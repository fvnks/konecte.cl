// src/actions/roleActions.ts
'use server';

import { query } from '@/lib/db';
import type { Role } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function getRolesAction(): Promise<Role[]> {
  try {
    const roles = await query('SELECT id, name, description FROM roles ORDER BY name ASC');
    return roles as Role[];
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return []; // Devuelve un array vacío en caso de error para no romper la UI
  }
}

export async function addRoleAction(formData: FormData): Promise<{ success: boolean; message?: string; role?: Role }> {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | undefined;

  if (!id || !name) {
    return { success: false, message: "El ID y el Nombre del rol son requeridos." };
  }
  
  // Validación simple del ID del rol (alfanumérico y guiones bajos)
  if (!/^[a-zA-Z0-9_]+$/.test(id)) {
    return { success: false, message: "El ID del rol solo puede contener letras, números y guiones bajos (_)." };
  }


  try {
    const newRoleId = id; // Usamos el ID provisto por el usuario
    await query('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [newRoleId, name, description || null]);
    revalidatePath('/admin/roles');
    revalidatePath('/admin/users');
    return { success: true, message: "Rol añadido exitosamente.", role: { id: newRoleId, name, description } };
  } catch (error: any) {
    console.error("Error al añadir rol:", error);
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes("'roles.PRIMARY'")) {
             return { success: false, message: "Error: Ya existe un rol con ese ID." };
        }
        if (error.message.includes("'roles.name'")) {
             return { success: false, message: "Error: Ya existe un rol con ese Nombre." };
        }
    }
    return { success: false, message: `Error al añadir rol: ${error.message}` };
  }
}

export async function deleteRoleAction(roleId: string): Promise<{ success: boolean; message?: string }> {
  if (!roleId) {
    return { success: false, message: "ID de rol no proporcionado." };
  }

  // Prevenir la eliminación de roles 'admin' o 'user' si son críticos y existen
  if (roleId === 'admin' || roleId === 'user') {
    // Primero, verificar si realmente existen estos roles.
    const existingRole = await query('SELECT id FROM roles WHERE id = ?', [roleId]);
    if (existingRole && existingRole.length > 0) {
        // Verificar si hay usuarios usando este rol
        const usersWithRole = await query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [roleId]);
        if (usersWithRole && usersWithRole[0].count > 0) {
            return { success: false, message: `No se puede eliminar el rol "${roleId}" porque está asignado a ${usersWithRole[0].count} usuario(s).` };
        }
    }
  }


  try {
    const result: any = await query('DELETE FROM roles WHERE id = ?', [roleId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/roles');
      revalidatePath('/admin/users');
      return { success: true, message: "Rol eliminado exitosamente." };
    } else {
      return { success: false, message: "El rol no fue encontrado o no se pudo eliminar." };
    }
  } catch (error: any) {
    console.error("Error al eliminar rol:", error);
     if (error.code === 'ER_ROW_IS_REFERENCED_2') { // Código de error común para FK constraint
        return { success: false, message: "No se puede eliminar el rol porque está asignado a uno o más usuarios." };
    }
    return { success: false, message: `Error al eliminar rol: ${error.message}` };
  }
}
