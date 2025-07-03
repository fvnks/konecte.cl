// src/actions/userActions.ts
'use server';

import type { User, AdminCreateUserFormValues, AdminEditUserFormValues, UserProfileFormValues } from '@/lib/types';
import { adminCreateUserFormSchema, adminEditUserFormSchema, userProfileFormSchema } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { eq, like, count, or, and, not } from 'drizzle-orm';
import { users, roles, plans } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function getUsersAction(): Promise<User[]> {
  try {
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      roleId: users.roleId,
      roleName: roles.name,
      planId: users.planId,
      planName: plans.name,
      planExpiresAt: users.planExpiresAt,
      phoneVerified: users.phoneVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(plans, eq(users.planId, plans.id))
      .orderBy(users.name);
      
    return result.map((user: any) => ({
        ...user,
        phone_verified: Boolean(user.phoneVerified),
        created_at: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
        updated_at: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
        plan_expires_at: user.planExpiresAt ? new Date(user.planExpiresAt).toISOString() : null,
    })) as User[];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

export async function getUserByIdAction(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    const userRows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      rutTin: users.rutTin,
      phoneNumber: users.phoneNumber,
      phoneVerified: users.phoneVerified,
      roleId: users.roleId,
      roleName: roles.name,
      planId: users.planId,
      planName: plans.name,
      planExpiresAt: users.planExpiresAt,
      planWhatsappIntegrationEnabled: plans.whatsappIntegration,
      companyName: users.companyName,
      mainOperatingRegion: users.mainOperatingRegion,
      mainOperatingCommune: users.mainOperatingCommune,
      propertiesInPortfolioCount: users.propertiesInPortfolioCount,
      websiteSocialMediaLink: users.websiteSocialMediaLink,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(plans, eq(users.planId, plans.id))
      .where(eq(users.id, userId));

    if (userRows.length === 0) {
      return null;
    }
    const user = userRows[0];
    return {
      ...user,
      phone_verified: Boolean(user.phoneVerified),
      plan_whatsapp_integration_enabled: Boolean(user.planWhatsappIntegrationEnabled),
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
      updated_at: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
      plan_expires_at: user.planExpiresAt ? new Date(user.planExpiresAt).toISOString() : null,
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
    const result = await db.update(users).set({ roleId: newRoleId }).where(eq(users.id, userId));
    if (result.rowsAffected > 0) {
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
    const result = await db.update(users).set({ planId: planIdToSet }).where(eq(users.id, userId));
    if (result.rowsAffected > 0) {
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

  const {
    name, email, password, role_id, plan_id, phone_number, rut_tin,
    company_name, main_operating_region, main_operating_commune,
    properties_in_portfolio_count, website_social_media_link
  } = validation.data;

  try {
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }
    
    if(phone_number) {
        const existingPhone = await db.select({ id: users.id }).from(users).where(eq(users.phoneNumber, phone_number));
        if (existingPhone.length > 0) {
            return { success: false, message: "Este número de teléfono ya está en uso." };
        }
    }

    const roleExists = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, role_id));
    if (roleExists.length === 0) {
      return { success: false, message: "El rol seleccionado no es válido." };
    }
    
    if (plan_id) {
        const planExists = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, plan_id));
        if (planExists.length === 0) {
            return { success: false, message: "El plan seleccionado no es válido." };
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash: hashedPassword,
      roleId: role_id,
      planId: plan_id || null,
      phoneNumber: phone_number,
      rutTin: rut_tin,
      companyName: role_id === 'broker' ? (company_name || null) : null,
      mainOperatingRegion: role_id === 'broker' ? (main_operating_region || null) : null,
      mainOperatingCommune: role_id === 'broker' ? (main_operating_commune || null) : null,
      propertiesInPortfolioCount: role_id === 'broker' ? (properties_in_portfolio_count ?? null) : null,
      websiteSocialMediaLink: role_id === 'broker' ? (website_social_media_link || null) : null,
      phoneVerified: true,
    });
    
    const newUserRows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      roleId: users.roleId,
      roleName: roles.name,
      planId: users.planId,
      planName: plans.name,
      planExpiresAt: users.planExpiresAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(plans, eq(users.planId, plans.id))
      .where(eq(users.id, userId));

    if (newUserRows.length === 0) {
        return { success: false, message: "Error al recuperar el usuario recién creado." };
    }
    
    const newUser: User = {
        ...newUserRows[0],
        created_at: newUserRows[0].createdAt ? new Date(newUserRows[0].createdAt).toISOString() : undefined,
        updated_at: newUserRows[0].updatedAt ? new Date(newUserRows[0].updatedAt).toISOString() : undefined,
        plan_expires_at: newUserRows[0].planExpiresAt ? new Date(newUserRows[0].planExpiresAt).toISOString() : null,
    };

    revalidatePath('/admin/users');
    return { success: true, message: "Usuario creado exitosamente.", user: newUser };

  } catch (error: any) {
    console.error("[UserAction Admin] Error in adminCreateUserAction:", error);
    // This is a specific check for mysql/planetscale driver
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('users.email_unique')) {
            return { success: false, message: "Ya existe un usuario con este correo electrónico." };
        }
        if (error.message.includes('users.phone_number_unique')) {
            return { success: false, message: "Este número de teléfono ya está registrado." };
        }
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

  const { name, email, role_id, plan_id, phone_number, rut_tin, company_name, main_operating_region, main_operating_commune, properties_in_portfolio_count, website_social_media_link } = validation.data;

  try {
    const currentUser = await db.select({ email: users.email, phoneNumber: users.phoneNumber }).from(users).where(eq(users.id, userId));
    if (currentUser.length === 0) {
      return { success: false, message: "Usuario no encontrado." };
    }

    if (email !== currentUser[0].email) {
      const existingUserWithNewEmail = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), not(eq(users.id, userId))));
      if (existingUserWithNewEmail.length > 0) {
        return { success: false, message: "El nuevo correo electrónico ya está en uso por otro usuario." };
      }
    }

    if (phone_number && phone_number !== currentUser[0].phoneNumber) {
      const existingUserWithNewPhone = await db.select({ id: users.id }).from(users).where(and(eq(users.phoneNumber, phone_number), not(eq(users.id, userId))));
      if (existingUserWithNewPhone.length > 0) {
        return { success: false, message: "El nuevo número de teléfono ya está en uso por otro usuario." };
      }
    }

    const roleExists = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, role_id));
    if (roleExists.length === 0) {
      return { success: false, message: "El rol seleccionado no es válido." };
    }
    
    if (plan_id) {
      const planExists = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, plan_id));
      if (planExists.length === 0) {
        return { success: false, message: "El plan seleccionado no es válido." };
      }
    }

    await db.update(users).set({
      name,
      email,
      roleId: role_id,
      planId: plan_id || null,
      phoneNumber: phone_number,
      rutTin: rut_tin,
      companyName: company_name,
      mainOperatingRegion: main_operating_region,
      mainOperatingCommune: main_operating_commune,
      propertiesInPortfolioCount: properties_in_portfolio_count,
      websiteSocialMediaLink: website_social_media_link,
    }).where(eq(users.id, userId));

    const updatedUser = await getUserByIdAction(userId);
    
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: "Usuario actualizado exitosamente.", user: updatedUser || undefined };

  } catch (error: any) {
    console.error("[UserAction Admin] Error in adminUpdateUserAction:", error);
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('users.email_unique')) {
            return { success: false, message: "El nuevo correo electrónico ya está en uso por otro usuario." };
        }
        if (error.message.includes('users.phone_number_unique')) {
            return { success: false, message: "El nuevo número de teléfono ya está en uso por otro usuario." };
        }
    }
    return { success: false, message: `Error al actualizar usuario: ${error.message}` };
  }
}

export async function adminDeleteUserAction(userIdToDelete: string, currentAdminUserId: string): Promise<{ success: boolean; message?: string }> {
  if (userIdToDelete === currentAdminUserId) {
    return { success: false, message: "No puedes eliminar tu propia cuenta de administrador." };
  }

  try {
    const result = await db.delete(users).where(eq(users.id, userIdToDelete));

    if (result.rowsAffected > 0) {
      revalidatePath('/admin/users');
      return { success: true, message: "Usuario eliminado exitosamente." };
    } else {
      return { success: false, message: "Usuario no encontrado." };
    }
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    return { success: false, message: `Error al eliminar usuario: ${error.message}` };
  }
}

export async function getUsersCountAction(): Promise<number> {
  try {
    const result = await db.select({ value: count() }).from(users);
    return result[0]?.value ?? 0;
  } catch (error) {
    console.error("Error al obtener el conteo de usuarios:", error);
    return 0;
  }
}

export async function updateUserProfileAction(
  userId: string,
  values: UserProfileFormValues
): Promise<{ success: boolean; message?: string; updatedUser?: User }> {
    const session = await getSession();
    if (!session || session.user?.id !== userId) {
        return { success: false, message: 'No autorizado.' };
    }

  const validation = userProfileFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, phone_number, company_name, main_operating_region, main_operating_commune, properties_in_portfolio_count, website_social_media_link, avatar_url } = validation.data;

  try {
    const currentUser = await db.select({ email: users.email, phoneNumber: users.phoneNumber }).from(users).where(eq(users.id, userId));
    if (currentUser.length === 0) {
      return { success: false, message: "Usuario no encontrado." };
    }

    if (email !== currentUser[0].email) {
      const existingUser = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), not(eq(users.id, userId))));
      if (existingUser.length > 0) {
        return { success: false, message: "El correo electrónico ya está en uso." };
      }
    }
    
    if (phone_number && phone_number !== currentUser[0].phoneNumber) {
        const existingUserWithNewPhone = await db.select({ id: users.id }).from(users).where(and(eq(users.phoneNumber, phone_number), not(eq(users.id, userId))));
        if (existingUserWithNewPhone.length > 0) {
            return { success: false, message: "Este número de teléfono ya está en uso por otro usuario." };
        }
    }

    await db.update(users).set({
      name,
      email,
      phoneNumber: phone_number,
      companyName: company_name,
      mainOperatingRegion: main_operating_region,
      mainOperatingCommune: main_operating_commune,
      propertiesInPortfolioCount: properties_in_portfolio_count,
      websiteSocialMediaLink: website_social_media_link,
      avatarUrl: avatar_url,
    }).where(eq(users.id, userId));

    const updatedUser = await getUserByIdAction(userId);

    revalidatePath(`/dashboard/profile`);
    return { success: true, message: 'Perfil actualizado exitosamente.', updatedUser: updatedUser || undefined };

  } catch (error: any) {
    console.error("Error al actualizar el perfil del usuario:", error);
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('users.email_unique')) {
            return { success: false, message: "El correo electrónico ya está en uso." };
        }
        if (error.message.includes('users.phone_number_unique')) {
            return { success: false, message: "Este número de teléfono ya está en uso por otro usuario." };
        }
    }
    return { success: false, message: `Error al actualizar el perfil: ${error.message}` };
  }
}

export async function adminVerifyUserPhoneAction(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const result = await db.update(users).set({ phoneVerified: true, phoneOtp: null, phoneOtpExpiresAt: null }).where(eq(users.id, userId));
        if (result.rowsAffected > 0) {
            revalidatePath('/admin/users');
            return { success: true, message: 'Teléfono verificado exitosamente.' };
        } else {
            return { success: false, message: 'Usuario no encontrado.' };
        }
    } catch (error: any) {
        console.error('Error al verificar el teléfono del usuario:', error);
        return { success: false, message: `Error del servidor: ${error.message}` };
    }
}


export async function searchUsersAction(searchTerm: string): Promise<User[]> {
    if (!searchTerm.trim()) {
        return [];
    }

    try {
        const results = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
            roleId: users.roleId,
            roleName: roles.name,
            planId: users.planId,
            planName: plans.name,
        }).from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(plans, eq(users.planId, plans.id))
        .where(
            or(
                like(users.name, `%${searchTerm}%`),
                like(users.email, `%${searchTerm}%`),
                like(users.phoneNumber, `%${searchTerm}%`)
            )
        )
        .limit(10);
        
        return results.map(user => ({
            ...user,
            role_id: user.roleId,
            role_name: user.roleName,
            plan_id: user.planId,
            plan_name: user.planName,
        })) as User[];

    } catch (error) {
        console.error("Error al buscar usuarios:", error);
        return [];
    }
}

export async function findUserByEmailAction(email: string): Promise<{ success: boolean; message: string; user?: { id: string; name: string; email: string; avatarUrl: string | null; }; }> {
    const session = await getSession();
    if (!session) {
        return { success: false, message: "No autenticado." };
    }
    if (!email) {
        return { success: false, message: "El correo electrónico es requerido." };
    }
    try {
        const userResult = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
        }).from(users).where(eq(users.email, email));

        if (userResult.length === 0) {
            return { success: false, message: "Usuario no encontrado." };
        }
        return { success: true, message: "Usuario encontrado.", user: userResult[0] };
    } catch (error: any) {
        console.error("Error al buscar usuario por email:", error);
        return { success: false, message: `Error del servidor: ${error.message}` };
    }
}
