// src/actions/authActions.ts
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';
import { randomUUID } from 'crypto';

// --- Sign Up ---
const signUpSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export async function signUpAction(values: SignUpFormValues): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password_hash'> }> {
  const validation = signUpSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, password } = validation.data;
  console.log(`[AuthAction] Attempting sign-up for email: ${email}`);

  try {
    const existingUserRows: any[] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUserRows.length > 0) {
      console.log(`[AuthAction] Sign-up failed: Email ${email} already exists.`);
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const defaultUserRoleId = 'user';

    const userRoleRows: any[] = await query('SELECT id FROM roles WHERE id = ?', [defaultUserRoleId]);
    if (userRoleRows.length === 0) {
        console.error(`[AuthAction] CRITICAL Sign-up Error: Default role '${defaultUserRoleId}' not found in DB.`);
        return { success: false, message: "Error de configuración del sistema: No se pudo asignar el rol por defecto. Contacte al administrador."};
    }

    await query(
      'INSERT INTO users (id, name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, defaultUserRoleId]
    );
    console.log(`[AuthAction] Sign-up successful for email: ${email}, userID: ${userId}`);

    const newUser: Omit<User, 'password_hash'> = {
      id: userId,
      name,
      email,
      role_id: defaultUserRoleId,
    };

    return { success: true, message: "Usuario registrado exitosamente.", user: newUser };
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

export async function signInAction(values: SignInFormValues): Promise<{ success: boolean; message?: string; user?: User }> {
  const validation = signInSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { email, password } = validation.data;
  console.log(`[AuthAction] Attempting sign-in for email: ${email}`);

  try {
    const usersFound: any[] = await query(
        `SELECT u.id, u.name, u.email, u.password_hash, u.avatar_url, u.role_id, r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.email = ?`,
        [email]
    );

    if (usersFound.length === 0) {
      console.log(`[AuthAction] Sign-in failed: User not found for email: ${email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    const user = usersFound[0] as User & { password_hash: string };
    console.log(`[AuthAction] User found: ${user.email}. Stored hash: ${user.password_hash ? user.password_hash.substring(0, 10) + "..." : "NOT FOUND"}`);

    if (!user.password_hash) {
        console.error(`[AuthAction] CRITICAL Sign-in Error: password_hash is missing for user ${user.email}.`);
        return { success: false, message: "Error de cuenta de usuario. Contacte al administrador." };
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`[AuthAction] Password match result for ${user.email}: ${passwordMatch}`);

    if (!passwordMatch) {
      console.log(`[AuthAction] Sign-in failed: Password mismatch for ${user.email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    // No devolver el password_hash al cliente
    const { password_hash, ...userWithoutPasswordHash } = user;
    console.log(`[AuthAction] Sign-in successful for ${user.email}`);

    return { success: true, user: userWithoutPasswordHash };
  } catch (error: any) {
    console.error("[AuthAction] Error in signInAction:", error);
    return { success: false, message: `Error al iniciar sesión: ${error.message}` };
  }
}
