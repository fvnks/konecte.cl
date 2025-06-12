
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
    // Futura mejora: verificar si el admin intenta cambiarse su propio rol a no-admin.
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
  const planIdToSet = newPlanId === '' ? null : newPlanId;

  try {
    const result: any = await query('UPDATE users SET plan_id = ? WHERE id = ?', [planIdToSet, userId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/users');
      return { success: true, message: "Plan del usuario actualizado exitosamente." };
    } else {
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

  try {
    const existingUserRows: any[] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUserRows.length > 0) {
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }

    const roleExistsRows: any[] = await query('SELECT id FROM roles WHERE id = ?', [role_id]);
    if (roleExistsRows.length === 0) {
      return { success: false, message: "El rol seleccionado no es válido." };
    }
    
    if (plan_id) {
        const planExistsRows: any[] = await query('SELECT id FROM plans WHERE id = ?', [plan_id]);
        if (planExistsRows.length === 0) {
            return { success: false, message: "El plan seleccionado no es válido." };
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await query(
      'INSERT INTO users (id, name, email, password_hash, role_id, plan_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role_id, plan_id || null]
    );
    
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
        return { success: false, message: "Error al recuperar el usuario recién creado." };
    }
    
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

export async function adminDeleteUserAction(userIdToDelete: string, currentAdminUserId: string): Promise<{ success: boolean; message?: string }> {
  if (!userIdToDelete || !currentAdminUserId) {
    return { success: false, message: "Se requiere el ID del usuario a eliminar y del administrador." };
  }

  if (userIdToDelete === currentAdminUserId) {
    return { success: false, message: "No puedes eliminar tu propia cuenta de administrador." };
  }

  // Adicionalmente, podrías querer prevenir la eliminación del último administrador o un admin "root".
  // Por ahora, solo prevenimos la auto-eliminación.

  try {
    // La base de datos se encargará de eliminar en cascada propiedades, solicitudes, comentarios, etc.
    // debido a las restricciones FOREIGN KEY con ON DELETE CASCADE.
    const result: any = await query('DELETE FROM users WHERE id = ?', [userIdToDelete]);

    if (result.affectedRows > 0) {
      revalidatePath('/admin/users');
      return { success: true, message: "Usuario eliminado exitosamente. Todos sus datos asociados (propiedades, solicitudes, comentarios, CRM) también han sido eliminados." };
    } else {
      return { success: false, message: "Usuario no encontrado o no se pudo eliminar." };
    }
  } catch (error: any) {
    console.error(`[UserAction Admin] Error deleting user ${userIdToDelete}:`, error);
    // Podría haber errores si, por alguna razón, ON DELETE CASCADE falla o hay otras restricciones.
    return { success: false, message: `Error al eliminar usuario: ${error.message}` };
  }
}
