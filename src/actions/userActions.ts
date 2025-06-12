
// src/actions/userActions.ts
'use server';

import { query } from '@/lib/db';
import type { User, AdminCreateUserFormValues } from '@/lib/types';
import { adminCreateUserFormSchema } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function getUsersAction(): Promise<User[]> {
  try {
    const users = await query(`
      SELECT 
        u.id, u.name, u.email, u.avatar_url, 
        u.role_id, r.name as role_name,
        u.plan_id, p.name as plan_name, u.plan_expires_at,
        u.created_at, u.updated_at 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN plans p ON u.plan_id = p.id
      ORDER BY u.name ASC
    `);
    return users.map((user: any) => ({
        ...user,
        created_at: user.created_at ? new Date(user.created_at).toISOString() : undefined,
        updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : undefined,
        plan_expires_at: user.plan_expires_at ? new Date(user.plan_expires_at).toISOString() : null,
    })) as User[];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

export async function updateUserRoleAction(userId: string, newRoleId: string): Promise<{ success: boolean; message?: string }> {
  if (!userId || !newRoleId) {
    return { success: false, message: "ID de usuario o rol no proporcionado." };
  }

  try {
    const result: any = await query('UPDATE users SET role_id = ? WHERE id = ?', [newRoleId, userId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/users');
      return { success: true, message: "Rol del usuario actualizado exitosamente." };
    } else {
      return { success: false, message: "Usuario no encontrado o el rol ya era el mismo." };
    }
  } catch (error: any) {
    console.error("Error al actualizar el rol del usuario:", error);
    return { success: false, message: `Error al actualizar el rol del usuario: ${error.message}` };
  }
}

export async function updateUserPlanAction(userId: string, newPlanId: string | null): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: "ID de usuario no proporcionado." };
  }
  // Si newPlanId es una cadena vacía (ej, desde un Select que no tiene un valor para "Sin Plan" como null explícito),
  // lo convertimos a null para la base de datos.
  const planIdToSet = newPlanId === '' ? null : newPlanId;

  try {
    // Por ahora, al cambiar de plan, no actualizaremos plan_expires_at.
    // Esto podría ser una mejora futura.
    const result: any = await query('UPDATE users SET plan_id = ? WHERE id = ?', [planIdToSet, userId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/users');
      return { success: true, message: "Plan del usuario actualizado exitosamente." };
    } else {
      // Esto puede ocurrir si el usuario ya tenía ese plan (o ya era null)
      return { success: true, message: "Plan del usuario sin cambios (ya estaba asignado)." };
    }
  } catch (error: any) {
    console.error("Error al actualizar el plan del usuario:", error);
    return { success: false, message: `Error al actualizar el plan del usuario: ${error.message}` };
  }
}

export async function adminCreateUserAction(values: AdminCreateUserFormValues): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password_hash'> }> {
  const validation = adminCreateUserFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, password, role_id, plan_id } = validation.data;
  console.log(`[UserAction Admin] Attempting to create user with email: ${email}`);

  try {
    const existingUserRows: any[] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUserRows.length > 0) {
      console.log(`[UserAction Admin] User creation failed: Email ${email} already exists.`);
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }

    // Verificar que el rol exista
    const roleExistsRows: any[] = await query('SELECT id FROM roles WHERE id = ?', [role_id]);
    if (roleExistsRows.length === 0) {
      console.error(`[UserAction Admin] Role with id '${role_id}' not found.`);
      return { success: false, message: "El rol seleccionado no es válido." };
    }
    
    // Verificar que el plan exista si se proporciona
    if (plan_id) {
        const planExistsRows: any[] = await query('SELECT id FROM plans WHERE id = ?', [plan_id]);
        if (planExistsRows.length === 0) {
            console.error(`[UserAction Admin] Plan with id '${plan_id}' not found.`);
            return { success: false, message: "El plan seleccionado no es válido." };
        }
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await query(
      'INSERT INTO users (id, name, email, password_hash, role_id, plan_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role_id, plan_id || null]
    );
    console.log(`[UserAction Admin] User creation successful for email: ${email}, userID: ${userId}`);

    // Fetch the newly created user (without password hash) to return role_name and plan_name
    const newUserRows: any[] = await query(
        `SELECT u.id, u.name, u.email, u.avatar_url, 
                u.role_id, r.name as role_name,
                u.plan_id, p.name as plan_name, u.plan_expires_at,
                u.created_at, u.updated_at
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN plans p ON u.plan_id = p.id
         WHERE u.id = ?`, [userId]
    );

    if (newUserRows.length === 0) {
        // Should not happen if insert was successful
        return { success: false, message: "Error al recuperar el usuario recién creado." };
    }
    
    // Map to User type, ensuring dates are ISO strings
    const newUser: User = {
        ...newUserRows[0],
        created_at: newUserRows[0].created_at ? new Date(newUserRows[0].created_at).toISOString() : undefined,
        updated_at: newUserRows[0].updated_at ? new Date(newUserRows[0].updated_at).toISOString() : undefined,
        plan_expires_at: newUserRows[0].plan_expires_at ? new Date(newUserRows[0].plan_expires_at).toISOString() : null,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userToReturn } = newUser;


    revalidatePath('/admin/users');
    return { success: true, message: "Usuario creado exitosamente.", user: userToReturn };

  } catch (error: any) {
    console.error("[UserAction Admin] Error in adminCreateUserAction:", error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('users.email')) {
        return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }
    return { success: false, message: `Error al crear usuario: ${error.message}` };
  }
}


// export async function deleteUserAction(userId: string) { /* ... */ }

