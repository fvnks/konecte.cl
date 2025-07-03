// src/actions/authActions.ts
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';
import { signUpSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { generateAndSendOtpAction } from './otpActions'; // Import the OTP action
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessions, users, roles, plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// --- Sign Up ---
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export async function signUpAction(values: SignUpFormValues): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password_hash'>, verificationPending?: boolean, userId?: string, phone_number_ending?: string }> {
  const validation = signUpSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const {
    accountType, name, email, password, phone_number, rut_tin,
    company_name, main_operating_region,
    main_operating_commune, properties_in_portfolio_count, website_social_media_link
  } = validation.data;

  console.log(`[AuthAction] Attempting sign-up for email: ${email}, type: ${accountType}`);

  try {
    const existingUserRows = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existingUserRows.length > 0) {
      console.log(`[AuthAction] Sign-up failed: Email ${email} already exists.`);
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }
    
    // Check for existing phone number
    const existingPhoneRows = await db.select({ id: users.id }).from(users).where(eq(users.phone_number, phone_number));
    if (existingPhoneRows.length > 0) {
        return { success: false, message: "Este número de teléfono ya está registrado." };
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const roleId = accountType === 'broker' ? 'broker' : 'user';

    const userRoleRows = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, roleId));
    if (userRoleRows.length === 0) {
        console.error(`[AuthAction] CRITICAL Sign-up Error: Role '${roleId}' not found in DB.`);
        return { success: false, message: "Error de configuración del sistema: No se pudo asignar el rol. Contacte al administrador."};
    }

    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash: hashedPassword,
      roleId,
      phone_number,
      rut_tin,
      company_name: accountType === 'broker' ? (company_name || null) : null,
      main_operating_region: accountType === 'broker' ? (main_operating_region || null) : null,
      main_operating_commune: accountType === 'broker' ? (main_operating_commune || null) : null,
      properties_in_portfolio_count: accountType === 'broker' ? (properties_in_portfolio_count !== undefined && properties_in_portfolio_count !== null ? properties_in_portfolio_count : null) : null,
      website_social_media_link: accountType === 'broker' ? (website_social_media_link || null) : null,
      phoneVerified: false,
    });

    console.log(`[AuthAction] Sign-up successful for email: ${email}, userID: ${userId}, roleId: ${roleId}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPasswordHashBase } = {
      id: userId,
      name,
      email,
      role_id: roleId,
      phone_number: phone_number,
      rut_tin: rut_tin,
      phone_verified: false,
    };

    const userWithoutPasswordHash: User = {
      ...userWithoutPasswordHashBase,
      company_name: accountType === 'broker' ? (company_name || null) : null,
      main_operating_region: accountType === 'broker' ? (main_operating_region || null) : null,
      main_operating_commune: accountType === 'broker' ? (main_operating_commune || null) : null,
      properties_in_portfolio_count: accountType === 'broker' ? (properties_in_portfolio_count !== undefined && properties_in_portfolio_count !== null ? properties_in_portfolio_count : null) : null,
      website_social_media_link: accountType === 'broker' ? (website_social_media_link || null) : null,
    };

    // Generate and send OTP
    const otpResult = await generateAndSendOtpAction(userId);
    if (!otpResult.success) {
      console.warn(`[AuthAction] User ${userId} created, but OTP sending failed: ${otpResult.message}`);
      return {
        success: true,
        message: "Usuario registrado. Hubo un problema al enviar el código de verificación a tu teléfono. Podrás solicitarlo de nuevo desde tu perfil.",
        user: userWithoutPasswordHash,
        verificationPending: true,
        userId: userId,
        phone_number_ending: otpResult.phone_number_ending // Pass even if send failed, maybe user got it before or will resend
      };
    }

    return {
        success: true,
        message: "Usuario registrado exitosamente. Se ha enviado un código de verificación a tu teléfono.",
        user: userWithoutPasswordHash,
        verificationPending: true,
        userId: userId,
        phone_number_ending: otpResult.phone_number_ending
    };
  } catch (error: any) {
    console.error("[AuthAction] Error in signUpAction:", error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('users.email')) {
        return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('uq_users_phone_number')) {
        return { success: false, message: "Este número de teléfono ya está registrado." };
    }
    return { success: false, message: `Error al registrar usuario: ${error.message}` };
  }
}


// --- Sign In ---
const signInSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(1, "La contraseña es requerida."),
});
export type SignInFormValues = z.infer<typeof signInSchema>;

export async function signInAction(values: SignInFormValues): Promise<{ success: boolean; message?: string; user?: User, verificationPending?: boolean }> {
  const validation = signInSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { email, password } = validation.data;
  console.log(`[AuthAction] Attempting sign-in for email: ${email}`);

  try {
    const results = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(plans, eq(users.planId, plans.id))
      .where(eq(users.email, email))
      .limit(1);

    if (results.length === 0) {
      console.log(`[AuthAction] Sign-in failed: User not found for email: ${email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    const { users: userFromDb, roles: roleInfo, plans: planInfo } = results[0];

    if (!userFromDb || !userFromDb.passwordHash) {
      console.log(`[AuthAction] Sign-in failed: User found but password hash missing for email: ${email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    const passwordMatch = await bcrypt.compare(password, userFromDb.passwordHash);
    if (!passwordMatch) {
      console.log(`[AuthAction] Sign-in failed: Invalid password for email: ${email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    // --- SESSION CREATION ---
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: userFromDb.id,
      token: sessionToken,
      expires,
    });

    cookies().set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
    });
    // --- END SESSION CREATION ---

    const { passwordHash, ...userBase } = userFromDb;

    const finalUser: User = {
        ...userBase,
        password_hash: undefined, // Asegurar que el hash no se incluya
        role_id: userBase.roleId as string,
        role_name: roleInfo?.name,
        plan_id: userBase.planId,
        plan_name: planInfo?.name ?? null,
        plan_is_pro_or_premium: (planInfo?.name?.toLowerCase().includes('pro') || planInfo?.name?.toLowerCase().includes('premium')) && userBase.roleId === 'broker',
        plan_is_premium_broker: planInfo?.name?.toLowerCase().includes('premium') && userBase.roleId === 'broker',
        plan_allows_contact_view: !!planInfo?.can_view_contact_data,
        plan_automated_alerts_enabled: !!planInfo?.automated_alerts_enabled,
        plan_advanced_dashboard_access: !!planInfo?.advanced_dashboard_access,
        phone_verified: Number(userBase.phoneVerified) === 1,
    };

    console.log(`[AuthAction] Sign-in successful for ${finalUser.email}. Phone verified: ${finalUser.phone_verified}`);

    const verificationPending = !finalUser.phone_verified;
    if (verificationPending) {
        console.log(`[AuthAction] User ${finalUser.id} phone not verified. Prompting for verification.`);
    }

    return { success: true, user: finalUser, verificationPending };

  } catch (error: any) {
    console.error("[AuthAction] Error in signInAction:", error);
    return { success: false, message: `Error al iniciar sesión: ${error.message}` };
  }
}

// --- Sign Out ---
export async function signOutAction(): Promise<void> {
    const sessionToken = cookies().get('session_token')?.value;

    if (sessionToken) {
        try {
            await db.delete(sessions).where(eq(sessions.token, sessionToken));
        } catch (error) {
            console.error('Error deleting session from DB:', error);
            // No detenerse, la cookie debe ser eliminada de todos modos.
        }
        // Invalidar la cookie
        cookies().set('session_token', '', { expires: new Date(0), path: '/' });
    }

    // Redirigir al login en cualquier caso
    redirect('/login');
}
