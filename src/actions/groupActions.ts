'use server';

import { db } from '@/lib/db';
import { groups, groupMembers, NewGroup } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { and, eq, inArray, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { users } from '@/lib/db/schema';

// Zod Schema for group creation
const createGroupSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  description: z.string().optional(),
  avatarUrl: z.string().url({ message: "URL de avatar inválida." }).optional(),
  postBadgeType: z.enum(['logo', 'name', 'none']).default('none'),
});

export async function createGroupAction(prevState: any, formData: FormData): Promise<{ success: boolean; message: string; groupId?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }
  
  const rawAvatarUrl = formData.get('avatarUrl');
  const avatarUrlForValidation = typeof rawAvatarUrl === 'string' && rawAvatarUrl.length > 0 ? rawAvatarUrl : undefined;

  const validatedFields = createGroupSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    avatarUrl: avatarUrlForValidation,
    postBadgeType: formData.get('postBadgeType'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Error de validación.',
    };
  }

  const { name, description, avatarUrl, postBadgeType } = validatedFields.data;
  const groupId = createId();

  try {
    await db.insert(groups).values({
      id: groupId,
      name,
      description,
      avatarUrl,
      ownerId: session.id,
      postBadgeType: postBadgeType,
    });

    // Añadir al dueño como el primer miembro y administrador del grupo
    await db.insert(groupMembers).values({
      groupId: groupId,
      userId: session.id,
      role: 'admin',
    });
    
    revalidatePath('/dashboard/my-groups');
    return { success: true, message: 'Grupo creado exitosamente.', groupId };
    
  } catch (error) {
    console.error('[GROUP_ACTION] Error creating group:', error);
    return { success: false, message: 'Ocurrió un error al crear el grupo.' };
  }
}

export async function getGroupByIdAction(groupId: string): Promise<{ success: boolean; group?: any; message?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  try {
    // 1. Obtener los detalles del grupo y del dueño
    const groupResults = await db
      .select({
        group: groups,
        owner: users,
      })
      .from(groups)
      .leftJoin(users, eq(groups.ownerId, users.id))
      .where(eq(groups.id, groupId))
      .limit(1);

    if (groupResults.length === 0) {
      return { success: false, message: 'Grupo no encontrado.' };
    }

    const { group, owner } = groupResults[0];

    // 2. Obtener los miembros y sus detalles de usuario
    const memberResults = await db
      .select({
        membership: groupMembers,
        user: users,
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));
      
    // 3. Combinar todo en un solo objeto
    const finalGroup = {
      ...group,
      owner,
      members: memberResults.map(r => ({
        ...r.membership,
        user: r.user,
      })),
      isOwner: group.ownerId === session.id,
      // DEBUG: Devolver los IDs para depuración en el frontend
      _debug: {
        ownerId: group.ownerId,
        sessionId: session.id,
      },
    };

    // 4. Verificar si el usuario actual es miembro
    const isMember = finalGroup.members.some(member => member.userId === session.id);
    if (!isMember) {
      return { success: false, message: 'No tienes permiso para ver este grupo.' };
    }

    return { success: true, group: finalGroup };
  } catch (error) {
    console.error(`[GROUP_ACTION] Error fetching group ${groupId}:`, error);
    return { success: false, message: 'Ocurrió un error al obtener el grupo.' };
  }
}

export async function getUserGroupsAction(): Promise<{ success: boolean; groups?: any[]; primaryGroupId?: string | null; message?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  try {
    const userWithPrimaryGroup = await db.query.users.findFirst({
      where: eq(users.id, session.id),
      columns: {
        primaryGroupId: true,
      },
    });

    const userMemberships = await db.query.groupMembers.findMany({
      where: eq(groupMembers.userId, session.id),
      columns: {
        groupId: true,
      }
    });

    if (userMemberships.length === 0) {
      return { success: true, groups: [], primaryGroupId: userWithPrimaryGroup?.primaryGroupId };
    }

    const groupIds = userMemberships.map(m => m.groupId);

    // Obtener los grupos y sus dueños
    const groupDetails = await db.select({
      group: groups,
      owner: users,
    })
      .from(groups)
      .leftJoin(users, eq(groups.ownerId, users.id))
      .where(inArray(groups.id, groupIds));

    // Obtener el conteo de miembros para cada grupo
    const memberCounts = await db
      .select({
        groupId: groupMembers.groupId,
        count: count(groupMembers.id),
      })
      .from(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds))
      .groupBy(groupMembers.groupId);
    
    const memberCountsMap = new Map(memberCounts.map(item => [item.groupId, item.count]));

    // Combinar los datos
    const processedGroups = groupDetails.map(result => ({
      ...result.group,
      owner: result.owner,
      memberCount: memberCountsMap.get(result.group.id) || 0,
    }));

    return { success: true, groups: processedGroups, primaryGroupId: userWithPrimaryGroup?.primaryGroupId };

  } catch (error) {
    console.error('[GROUP_ACTION] Error getting user groups:', error);
    return { success: false, message: 'Ocurrió un error al obtener los grupos.' };
  }
}

const updateGroupDetailsSchema = z.object({
  groupId: z.string(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres.").optional(),
});

type UpdateGroupPayload = z.infer<typeof updateGroupDetailsSchema>;

export async function updateGroupDetailsAction(payload: UpdateGroupPayload): Promise<{ success: boolean; message: string }> {
  const user = await getSession();
  if (!user) {
    return { success: false, message: 'No autenticado.' };
  }
  
  const result = updateGroupDetailsSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, message: result.error.errors.map(e => e.message).join(', ') };
  }
  
  const { groupId, name, description } = result.data;

  try {
    // Primero, verificar que el usuario es admin del grupo
    const [membership] = await db.select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'admin') {
      return { success: false, message: 'No tienes permiso para editar este grupo.' };
    }

    // Si es admin, proceder a actualizar
    await db.update(groups)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    revalidatePath(`/dashboard/my-groups/${groupId}`);
    revalidatePath('/dashboard/my-groups');

    return { success: true, message: 'Grupo actualizado exitosamente.' };

  } catch (error) {
    console.error(`[GROUP_ACTION] Error updating group ${groupId}:`, error);
    return { success: false, message: 'Ocurrió un error al actualizar el grupo.' };
  }
}

export async function removeMemberAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  const groupId = formData.get('groupId') as string;
  const memberIdToRemove = formData.get('memberId') as string;

  if (!groupId || !memberIdToRemove) {
    return { success: false, message: 'Faltan parámetros.' };
  }

  try {
    // Verificar que el usuario actual es admin del grupo
    const [adminMembership] = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.id)))
      .limit(1);

    if (!adminMembership || adminMembership.role !== 'admin') {
      return { success: false, message: 'No tienes permiso para realizar esta acción.' };
    }

    // Prevenir que el dueño del grupo sea eliminado
    const [group] = await db.select({ ownerId: groups.ownerId }).from(groups).where(eq(groups.id, groupId));
    if (group && group.ownerId === memberIdToRemove) {
      return { success: false, message: 'No se puede eliminar al propietario del grupo.' };
    }

    // Proceder con la eliminación
    await db.delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, memberIdToRemove)));

    revalidatePath(`/dashboard/my-groups/${groupId}`);

    return { success: true, message: 'Miembro eliminado correctamente.' };

  } catch (error) {
    console.error(`[GROUP_ACTION] Error removing member ${memberIdToRemove} from group ${groupId}:`, error);
    return { success: false, message: 'Ocurrió un error al eliminar al miembro.' };
  }
}

export async function addMemberAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  const groupId = formData.get('groupId') as string;
  const userIdToAdd = formData.get('userId') as string;

  if (!groupId || !userIdToAdd) {
    return { success: false, message: 'Faltan parámetros.' };
  }

  try {
    // 1. Verificar que el usuario actual es admin del grupo
    const [adminMembership] = await db.select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.id)))
      .limit(1);

    if (!adminMembership || adminMembership.role !== 'admin') {
      return { success: false, message: 'No tienes permiso para realizar esta acción.' };
    }

    // 2. Verificar que el usuario a añadir no sea ya miembro
    const [existingMembership] = await db.select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userIdToAdd)))
      .limit(1);
      
    if (existingMembership) {
      return { success: false, message: 'Este usuario ya es miembro del grupo.' };
    }

    // 3. Añadir al nuevo miembro
    await db.insert(groupMembers).values({
      groupId: groupId,
      userId: userIdToAdd,
      role: 'member', // Por defecto se añade como 'member'
    });

    revalidatePath(`/dashboard/my-groups/${groupId}`);
    return { success: true, message: 'Nuevo miembro añadido correctamente.' };

  } catch (error) {
    console.error(`[GROUP_ACTION] Error adding member ${userIdToAdd} to group ${groupId}:`, error);
    // Podríamos tener un error si el usuario no existe, pero lo asumimos por el flujo
    return { success: false, message: 'Ocurrió un error al añadir al miembro.' };
  }
}

export async function changeMemberRoleAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  const groupId = formData.get('groupId') as string;
  const memberIdToChange = formData.get('memberId') as string;
  const newRole = formData.get('newRole') as 'admin' | 'member';

  if (!groupId || !memberIdToChange || !['admin', 'member'].includes(newRole)) {
    return { success: false, message: 'Faltan parámetros o el rol es inválido.' };
  }

  try {
    // 1. Verificar que el usuario actual es admin del grupo
    const [adminMembership] = await db.select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.id)))
      .limit(1);

    if (!adminMembership || adminMembership.role !== 'admin') {
      return { success: false, message: 'No tienes permiso para realizar esta acción.' };
    }

    // 2. Prevenir que el rol del dueño del grupo sea cambiado
    const [group] = await db.select({ ownerId: groups.ownerId }).from(groups).where(eq(groups.id, groupId));
    if (group && group.ownerId === memberIdToChange) {
      return { success: false, message: 'No se puede cambiar el rol del propietario del grupo.' };
    }

    // 3. Proceder con la actualización del rol
    await db.update(groupMembers)
      .set({ role: newRole })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, memberIdToChange)));

    revalidatePath(`/dashboard/my-groups/${groupId}`);
    return { success: true, message: 'Rol del miembro actualizado correctamente.' };

  } catch (error) {
    console.error(`[GROUP_ACTION] Error changing role for member ${memberIdToChange} in group ${groupId}:`, error);
    return { success: false, message: 'Ocurrió un error al cambiar el rol del miembro.' };
  }
}

export async function setPrimaryGroupAction(groupId: string): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  try {
    // Verificar que el usuario es miembro del grupo que intenta establecer como principal
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.userId, session.id),
        eq(groupMembers.groupId, groupId)
      ),
    });

    if (!membership) {
      return { success: false, message: 'No puedes establecer como principal un grupo al que no perteneces.' };
    }

    // Actualizar el usuario
    await db.update(users)
      .set({ primaryGroupId: groupId })
      .where(eq(users.id, session.id));
      
    revalidatePath('/dashboard/my-groups');
    return { success: true, message: 'Grupo principal actualizado.' };

  } catch (error) {
    console.error(`[GROUP_ACTION] Error setting primary group for user ${session.id}:`, error);
    return { success: false, message: 'Ocurrió un error al actualizar el grupo principal.' };
  }
}

export async function deleteGroupAction(groupId: string): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autenticado.' };
  }

  try {
    // 1. Obtener el grupo para verificar al propietario
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: {
        ownerId: true,
      },
    });

    if (!group) {
      return { success: false, message: 'Grupo no encontrado.' };
    }

    // 2. Solo el propietario del grupo puede eliminarlo
    if (group.ownerId !== session.id) {
      return { success: false, message: 'No tienes permiso para eliminar este grupo. Solo el propietario puede hacerlo.' };
    }

    // 3. Eliminar el grupo (las membresías se eliminarán en cascada gracias a la configuración del schema)
    await db.delete(groups).where(eq(groups.id, groupId));

    revalidatePath('/dashboard/my-groups');
    return { success: true, message: 'Grupo eliminado exitosamente.' };

  } catch (error) {
    console.error(`[GROUP_ACTION] Error deleting group ${groupId}:`, error);
    return { success: false, message: 'Ocurrió un error al eliminar el grupo.' };
  }
} 