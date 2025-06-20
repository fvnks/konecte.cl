
// src/actions/authActions.ts
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';
import { signUpSchema } from '@/lib/types'; 
import { randomUUID } from 'crypto';
import { generateAndSendOtpAction } from './otpActions'; // Import the OTP action

// --- Sign Up ---
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export async function signUpAction(values: SignUpFormValues): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password_hash'>, verificationPending?: boolean, userId?: string }> {
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
    const existingUserRows: any[] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUserRows.length > 0) {
      console.log(`[AuthAction] Sign-up failed: Email ${email} already exists.`);
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const roleId = accountType === 'broker' ? 'broker' : 'user';

    const userRoleRows: any[] = await query('SELECT id FROM roles WHERE id = ?', [roleId]);
    if (userRoleRows.length === 0) {
        console.error(`[AuthAction] CRITICAL Sign-up Error: Role '${roleId}' not found in DB.`);
        return { success: false, message: "Error de configuración del sistema: No se pudo asignar el rol. Contacte al administrador."};
    }

    const insertSql = `
      INSERT INTO users (
        id, name, email, password_hash, role_id, 
        phone_number, rut_tin, 
        company_name, main_operating_region, main_operating_commune, 
        properties_in_portfolio_count, website_social_media_link,
        phone_verified 
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
    `;
    
    const params = [
      userId, name, email, hashedPassword, roleId,
      phone_number, 
      rut_tin,
      accountType === 'broker' ? (company_name || null) : null,
      accountType === 'broker' ? (main_operating_region || null) : null,
      accountType === 'broker' ? (main_operating_commune || null) : null,
      accountType === 'broker' ? (properties_in_portfolio_count !== undefined && properties_in_portfolio_count !== null ? properties_in_portfolio_count : null) : null,
      accountType === 'broker' ? (website_social_media_link || null) : null,
    ];
    
    await query(insertSql, params);
    console.log(`[AuthAction] Sign-up successful for email: ${email}, userID: ${userId}, roleId: ${roleId}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPasswordHashBase } = {
      id: userId,
      name,
      email,
      role_id: roleId,
      phone_number: phone_number, // phone_number is now required
      rut_tin: rut_tin, // rut_tin is now required
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
      // Log error, but proceed with user creation. User can resend OTP.
      console.warn(`[AuthAction] User ${userId} created, but OTP sending failed: ${otpResult.message}`);
      return { 
        success: true, 
        message: "Usuario registrado. Hubo un problema al enviar el código de verificación a tu teléfono. Podrás solicitarlo de nuevo desde tu perfil.", 
        user: userWithoutPasswordHash,
        verificationPending: true, // Still pending even if initial send failed
        userId: userId 
      };
    }

    return { 
        success: true, 
        message: "Usuario registrado exitosamente. Se ha enviado un código de verificación a tu teléfono.", 
        user: userWithoutPasswordHash,
        verificationPending: true,
        userId: userId
    };
  } catch (error: any) {
    console.error("[AuthAction] Error in signUpAction:", error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('users.email')) {
        return { success: false, message: "Ya existe un usuario con este correo electrónico." };
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
    const usersFound: any[] = await query(
        `SELECT 
            u.id, u.name, u.email, u.password_hash, 
            u.rut_tin, u.phone_number, u.avatar_url, 
            u.role_id, r.name as role_name,
            u.plan_id, p.name as plan_name_from_db, u.plan_expires_at,
            p.can_view_contact_data,
            p.automated_alerts_enabled,
            p.advanced_dashboard_access,
            u.company_name,
            u.main_operating_commune, u.properties_in_portfolio_count, u.website_social_media_link,
            u.phone_verified 
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN plans p ON u.plan_id = p.id
         WHERE u.email = ?`,
        [email]
    );

    if (usersFound.length === 0) {
      console.log(`[AuthAction] Sign-in failed: User not found for email: ${email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    const userFromDb = usersFound[0] as User & { 
        password_hash: string; 
        plan_name_from_db?: string | null;
        can_view_contact_data?: boolean | null;
        automated_alerts_enabled?: boolean | null;
        advanced_dashboard_access?: boolean | null;
        phone_verified: boolean; 
    }; 
    console.log(`[AuthAction] User found: ${userFromDb.email}. Stored hash: ${userFromDb.password_hash ? userFromDb.password_hash.substring(0, 10) + "..." : "NOT FOUND"}, Length: ${userFromDb.password_hash?.length}`);


    if (!userFromDb.password_hash) {
        console.error(`[AuthAction] CRITICAL Sign-in Error: password_hash is missing for user ${userFromDb.email}.`);
        return { success: false, message: "Error de cuenta de usuario. Contacte al administrador." };
    }
    
    const passwordMatch = await bcrypt.compare(password, userFromDb.password_hash);
    console.log(`[AuthAction] Password match result for ${userFromDb.email}: ${passwordMatch}`);

    if (!passwordMatch) {
      console.log(`[AuthAction] Sign-in failed: Password mismatch for ${userFromDb.email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, plan_name_from_db, ...userToReturnBase } = userFromDb;

    const finalUser: User = {
      ...userToReturnBase,
      phone_number: userFromDb.phone_number, // ensure phone_number is passed
      plan_name: plan_name_from_db || null,
      plan_is_pro_or_premium: (plan_name_from_db?.toLowerCase().includes('pro') || plan_name_from_db?.toLowerCase().includes('premium')) && userFromDb.role_id === 'broker',
      plan_is_premium_broker: plan_name_from_db?.toLowerCase().includes('premium') && userFromDb.role_id === 'broker',
      plan_allows_contact_view: !!userFromDb.can_view_contact_data,
      plan_automated_alerts_enabled: !!userFromDb.automated_alerts_enabled,
      plan_advanced_dashboard_access: !!userFromDb.advanced_dashboard_access,
      phone_verified: !!userFromDb.phone_verified, 
    };

    console.log(`[AuthAction] Sign-in successful for ${finalUser.email}. Phone verified: ${finalUser.phone_verified}`);
    
    const verificationPending = !finalUser.phone_verified;
    if (verificationPending) {
        // Optionally, re-trigger OTP sending if user logs in and phone is not verified.
        // For now, just notify the client.
        console.log(`[AuthAction] User ${finalUser.id} phone not verified. Prompting for verification.`);
    }

    return { success: true, user: finalUser, verificationPending };
  } catch (error: any) {
    console.error("[AuthAction] Error in signInAction:", error);
    return { success: false, message: `Error al iniciar sesión: ${error.message}` };
  }
}
    
