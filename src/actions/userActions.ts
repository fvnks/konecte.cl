
// src/actions/userActions.ts
'use server';

import { query } from '@/lib/db';
import type { User, AdminCreateUserFormValues, AdminEditUserFormValues, UserProfileFormValues } from '@/lib/types';
import { adminCreateUserFormSchema, adminEditUserFormSchema, userProfileFormSchema } from '@/lib/types';
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
        u.phone_verified,
        u.created_at, u.updated_at 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN plans p ON u.plan_id = p.id
      ORDER BY u.name ASC
    `);
    return users.map((user: any) => ({
        ...user,
        phone_verified: Boolean(user.phone_verified),
        created_at: user.created_at ? new Date(user.created_at).toISOString() : undefined,
        updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : undefined,
        plan_expires_at: user.plan_expires_at ? new Date(user.plan_expires_at).toISOString() : null,
    })) as User[];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

export async function getUserByIdAction(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    const userRows: any[] = await query(
      `SELECT 
         u.id, u.name, u.email, u.avatar_url,
         u.rut_tin, u.phone_number, u.phone_verified,
         u.role_id, r.name as role_name,
         u.plan_id, p.name as plan_name, u.plan_expires_at,
         u.company_name, u.main_operating_region, u.main_operating_commune,
         u.properties_in_portfolio_count, u.website_social_media_link,
         u.created_at, u.updated_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN plans p ON u.plan_id = p.id
       WHERE u.id = ?`,
      [userId]
    );
    if (userRows.length === 0) {
      return null;
    }
    const user = userRows[0];
    return {
      ...user,
      phone_verified: Number(user.phone_verified) === 1,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : undefined,
      updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : undefined,
      plan_expires_at: user.plan_expires_at ? new Date(user.plan_expires_at).toISOString() : null,
    } as User;
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${userId}:`, error);
    return null;
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


export async function adminUpdateUserAction(
  userId: string,
  values: AdminEditUserFormValues
): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password_hash'> }> {
  const validation = adminEditUserFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, role_id, plan_id } = validation.data;

  try {
    // Verificar si el email cambió y si el nuevo email ya existe para OTRO usuario
    const currentUserArr: any[] = await query('SELECT email FROM users WHERE id = ?', [userId]);
    if (currentUserArr.length === 0) {
      return { success: false, message: "Usuario no encontrado." };
    }
    const currentUserEmail = currentUserArr[0].email;

    if (email !== currentUserEmail) {
      const existingUserWithNewEmail: any[] = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingUserWithNewEmail.length > 0) {
        return { success: false, message: "El nuevo correo electrónico ya está en uso por otro usuario." };
      }
    }

    // Verificar si el rol existe
    const roleExistsRows: any[] = await query('SELECT id FROM roles WHERE id = ?', [role_id]);
    if (roleExistsRows.length === 0) {
      return { success: false, message: "El rol seleccionado no es válido." };
    }
    
    // Verificar si el plan existe (si se proporciona uno)
    if (plan_id) {
        const planExistsRows: any[] = await query('SELECT id FROM plans WHERE id = ?', [plan_id]);
        if (planExistsRows.length === 0) {
            return { success: false, message: "El plan seleccionado no es válido." };
        }
    }

    // Actualizar usuario
    await query(
      'UPDATE users SET name = ?, email = ?, role_id = ?, plan_id = ?, updated_at = NOW() WHERE id = ?',
      [name, email, role_id, plan_id || null, userId]
    );
    
    const updatedUserRows: any[] = await query(
        `SELECT u.id, u.name, u.email, u.avatar_url, 
                u.role_id, r.name as role_name,
                u.plan_id, p.name as plan_name, u.plan_expires_at,
                u.created_at, u.updated_at
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN plans p ON u.plan_id = p.id
         WHERE u.id = ?`, [userId]
    );

    if (updatedUserRows.length === 0) {
        // Esto no debería ocurrir si la actualización fue exitosa, pero es una verificación de seguridad
        return { success: false, message: "Error al recuperar el usuario después de la actualización." };
    }
    
    const updatedUser: User = {
        ...updatedUserRows[0],
        created_at: updatedUserRows[0].created_at ? new Date(updatedUserRows[0].created_at).toISOString() : undefined,
        updated_at: updatedUserRows[0].updated_at ? new Date(updatedUserRows[0].updated_at).toISOString() : undefined,
        plan_expires_at: updatedUserRows[0].plan_expires_at ? new Date(updatedUserRows[0].plan_expires_at).toISOString() : null,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userToReturn } = updatedUser;

    revalidatePath('/admin/users');
    return { success: true, message: "Usuario actualizado exitosamente.", user: userToReturn };

  } catch (error: any) {
    console.error(`[UserAction Admin] Error in adminUpdateUserAction for user ${userId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('users.email')) {
        return { success: false, message: "El correo electrónico ya está en uso por otro usuario." };
    }
    return { success: false, message: `Error al actualizar usuario: ${error.message}` };
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

export async function getUsersCountAction(): Promise<number> {
  try {
    const result: any[] = await query('SELECT COUNT(*) as count FROM users');
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error al obtener el conteo de usuarios:", error);
    return 0;
  }
}

export async function updateUserProfileAction(
  userId: string,
  values: UserProfileFormValues
): Promise<{ success: boolean; message?: string; updatedUser?: User }> {
  if (!userId) {
    return { success: false, message: 'Usuario no autenticado.' };
  }

  const validation = userProfileFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const {
    name,
    phone_number,
    avatarUrl,
    company_name,
    main_operating_region,
    main_operating_commune,
    properties_in_portfolio_count,
    website_social_media_link
  } = validation.data;

  try {
    // Check if phone number is being changed to one that already exists for another user
    if (phone_number) {
        const existingPhoneRows: any[] = await query(
            'SELECT id FROM users WHERE phone_number = ? AND id != ?',
            [phone_number, userId]
        );
        if (existingPhoneRows.length > 0) {
            return { success: false, message: 'Este número de teléfono ya está en uso por otro usuario.' };
        }
    }

    const updateSql = `
      UPDATE users SET
        name = ?,
        phone_number = ?,
        avatar_url = ?,
        company_name = ?,
        main_operating_region = ?,
        main_operating_commune = ?,
        properties_in_portfolio_count = ?,
        website_social_media_link = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      name,
      phone_number,
      avatarUrl || null,
      company_name || null,
      main_operating_region || null,
      main_operating_commune || null,
      properties_in_portfolio_count !== undefined && properties_in_portfolio_count !== null ? properties_in_portfolio_count : null,
      website_social_media_link || null,
      userId
    ];

    const result: any = await query(updateSql, params);

    if (result.affectedRows === 0) {
        return { success: false, message: 'No se pudo actualizar el perfil o no se encontraron cambios.' };
    }
    
    // Fetch the full updated user details to return
    const updatedUser = await getUserByIdAction(userId);
    if (!updatedUser) {
        return { success: false, message: 'Perfil actualizado, pero no se pudo recuperar la información actualizada.' };
    }
    
    revalidatePath('/profile');
    revalidatePath(`/dashboard`); // User info might be shown on dashboard

    return { success: true, message: 'Perfil actualizado exitosamente.', updatedUser: updatedUser };

  } catch (error: any) {
    console.error(`[UserAction] Error updating profile for user ${userId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('uq_users_phone_number')) {
        return { success: false, message: "Este número de teléfono ya está en uso por otro usuario." };
    }
    return { success: false, message: `Error al actualizar el perfil: ${error.message}` };
  }
}

export async function adminVerifyUserPhoneAction(userId: string): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: "ID de usuario no proporcionado." };
  }

  try {
    const result: any = await query(
      'UPDATE users SET phone_verified = TRUE, phone_otp = NULL, phone_otp_expires_at = NULL WHERE id = ?',
      [userId]
    );

    if (result.affectedRows > 0) {
      revalidatePath('/admin/users');
      return { success: true, message: "El teléfono del usuario ha sido verificado manualmente." };
    } else {
      return { success: false, message: "Usuario no encontrado o ya verificado." };
    }
  } catch (error: any) {
    console.error(`Error al verificar manualmente el teléfono para el usuario ${userId}:`, error);
    return { success: false, message: `Error al verificar teléfono: ${error.message}` };
  }
}
