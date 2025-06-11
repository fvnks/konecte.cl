
// src/actions/userActions.ts
'use server';

import { query } from '@/lib/db';
import type { User } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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

// Placeholder para futuras acciones como crear o eliminar usuarios
// export async function createUserAction(userData: Omit<User, 'id' | 'role_name' | 'created_at' | 'updated_at'>) { /* ... */ }
// export async function deleteUserAction(userId: string) { /* ... */ }
