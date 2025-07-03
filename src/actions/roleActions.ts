// src/actions/roleActions.ts
'use server';

import { db } from '@/lib/db';
import { roles, users } from '@/lib/db/schema';
import { eq, asc, count } from 'drizzle-orm';
import type { Role } from '@/lib/types';
import { ALL_APP_PERMISSIONS, type AppPermission } from '@/lib/permissions'; // Import AppPermission related items
import { revalidatePath } from 'next/cache';

function mapDbRowToRole(row: any): Role {
  let permissions: AppPermission[] | null = null;
  if (row.permissions) {
    try {
      const parsed = JSON.parse(row.permissions);
      if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string')) {
        permissions = parsed as AppPermission[];
      } else {
        console.warn(`[RoleAction WARN] Invalid JSON format for permissions in role ID ${row.id}. Permissions string: ${row.permissions}`);
        permissions = []; // Default to empty array on parse error
      }
    } catch (e) {
      console.error(`[RoleAction ERROR] Failed to parse permissions JSON for role ID ${row.id}:`, e, `Permissions string: ${row.permissions}`);
      permissions = []; // Default to empty array on critical parse error
    }
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: permissions, // Parsed permissions
  };
}

export async function getRolesAction(): Promise<Role[]> {
  try {
    const rows = await db.select().from(roles).orderBy(asc(roles.name));
    return rows.map(mapDbRowToRole);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return [];
  }
}

export async function getRoleByIdAction(roleId: string): Promise<Role | null> {
  if (!roleId) return null;
  try {
    const rows = await db.select().from(roles).where(eq(roles.id, roleId));
    if (rows.length === 0) return null;
    return mapDbRowToRole(rows[0]);
  } catch (error) {
    console.error(`Error fetching role ${roleId}:`, error);
    return null;
  }
}

export async function addRoleAction(formData: FormData): Promise<{ success: boolean; message?: string; role?: Role }> {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | undefined;
  // For initial creation, permissions can be empty or a default set.
  // The edit permissions UI will handle detailed assignment.
  const initialPermissions: AppPermission[] = []; 
  const permissionsJson = JSON.stringify(initialPermissions);

  if (!id || !name) {
    return { success: false, message: "El ID y el Nombre del rol son requeridos." };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(id)) {
    return { success: false, message: "El ID del rol solo puede contener letras, números y guiones bajos (_)." };
  }

  try {
    await db.insert(roles).values({
        id,
        name,
        description,
        permissions: permissionsJson,
    });
    revalidatePath('/admin/roles');
    revalidatePath('/admin/users'); // Roles affect user display/management
    
    const newRole = await getRoleByIdAction(id);
    return { success: true, message: "Rol añadido exitosamente.", role: newRole || undefined };
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

export async function updateRolePermissionsAction(
  roleId: string,
  newPermissions: AppPermission[]
): Promise<{ success: boolean; message?: string; role?: Role }> {
  if (!roleId) {
    return { success: false, message: "ID de rol no proporcionado." };
  }
  // Validate permissions against the known list (optional, but good practice)
  const validPermissions = newPermissions.filter(p => ALL_APP_PERMISSIONS.includes(p));
  if (validPermissions.length !== newPermissions.length) {
    // Log which permissions were invalid, but proceed with valid ones or error out.
    // For simplicity, we'll proceed with valid ones.
    console.warn(`[RoleAction WARN] Some invalid permissions were provided for role ${roleId}. Only valid ones will be saved.`);
  }

  const permissionsJson = JSON.stringify(validPermissions);

  try {
    const result = await db.update(roles).set({ permissions: permissionsJson }).where(eq(roles.id, roleId));
    if (result.rowsAffected > 0) {
      revalidatePath('/admin/roles');
      revalidatePath(`/admin/roles/${roleId}/edit`); // Revalidate specific edit page
      
      const updatedRole = await getRoleByIdAction(roleId);
      return { success: true, message: "Permisos del rol actualizados exitosamente.", role: updatedRole || undefined };
    } else {
      return { success: false, message: "Rol no encontrado o los permisos ya eran los mismos." };
    }
  } catch (error: any) {
    console.error(`Error al actualizar permisos para el rol ${roleId}:`, error);
    return { success: false, message: `Error al actualizar permisos: ${error.message}` };
  }
}

export async function deleteRoleAction(roleId: string): Promise<{ success: boolean; message?: string }> {
  if (!roleId) {
    return { success: false, message: "ID de rol no proporcionado." };
  }

  if (roleId === 'admin' || roleId === 'user' || roleId === 'broker') {
      const usersWithRole = await db.select({ value: count() }).from(users).where(eq(users.roleId, roleId));
      if (usersWithRole[0].value > 0) {
          return { success: false, message: `No se puede eliminar el rol "${roleId}" porque está asignado a ${usersWithRole[0].value} usuario(s).` };
      }
  }

  try {
    const result = await db.delete(roles).where(eq(roles.id, roleId));
    if (result.rowsAffected > 0) {
      revalidatePath('/admin/roles');
      revalidatePath('/admin/users');
      return { success: true, message: "Rol eliminado exitosamente." };
    } else {
      return { success: false, message: "El rol no fue encontrado o no se pudo eliminar." };
    }
  } catch (error: any) {
    console.error("Error al eliminar rol:", error);
     if (error.code === 'ER_ROW_IS_REFERENCED_2') { 
        return { success: false, message: "No se puede eliminar el rol porque está asignado a uno o más usuarios." };
    }
    return { success: false, message: `Error al eliminar rol: ${error.message}` };
  }
}

// Action to get the list of all defined application permissions
export async function getAvailablePermissionsAction(): Promise<AppPermission[]> {
  // In a more complex system, these might be stored in a database table
  // For now, we return the hardcoded list from our permissions definition file
  return [...ALL_APP_PERMISSIONS].sort(); // Return a sorted copy
}

