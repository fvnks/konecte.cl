
// src/actions/authActions.ts
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';
import { signUpSchema } from '@/lib/types'; // Importar el schema actualizado
import { randomUUID } from 'crypto';

// --- Sign Up ---
// El signUpSchema se importa ahora desde types.ts
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export async function signUpAction(values: SignUpFormValues): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password_hash'> }> {
  const validation = signUpSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, password, rut, phone } = validation.data; // acceptTerms se valida pero no se guarda directamente aquí
  console.log(`[AuthAction] Attempting sign-up for email: ${email}`);

  try {
    const existingUserRows: any[] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUserRows.length > 0) {
      console.log(`[AuthAction] Sign-up failed: Email ${email} already exists.`);
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const defaultUserRoleId = 'user'; // Make sure 'user' role exists in your 'roles' table

    // Verify default role exists
    const userRoleRows: any[] = await query('SELECT id FROM roles WHERE id = ?', [defaultUserRoleId]);
    if (userRoleRows.length === 0) {
        console.error(`[AuthAction] CRITICAL Sign-up Error: Default role '${defaultUserRoleId}' not found in DB. Please ensure the 'roles' table is populated, for example with: INSERT INTO roles (id, name) VALUES ('user', 'Usuario'), ('admin', 'Administrador');`);
        return { success: false, message: "Error de configuración del sistema: No se pudo asignar el rol por defecto. Contacte al administrador."};
    }


    await query(
      'INSERT INTO users (id, name, email, password_hash, rut_tin, phone_number, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, rut || null, phone || null, defaultUserRoleId]
    );
    console.log(`[AuthAction] Sign-up successful for email: ${email}, userID: ${userId}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPasswordHash } = {
      id: userId,
      name,
      email,
      rut_tin: rut || null,
      phone_number: phone || null,
      role_id: defaultUserRoleId,
    };

    return { success: true, message: "Usuario registrado exitosamente.", user: userWithoutPasswordHash };
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
        `SELECT 
            u.id, u.name, u.email, u.password_hash, 
            u.rut_tin, u.phone_number, u.avatar_url, 
            u.role_id, r.name as role_name,
            u.plan_id, p.name as plan_name, u.plan_expires_at
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN plans p ON u.plan_id = p.id
         WHERE u.email = ?`,
        [email]
    );

    if (usersFound.length === 0) {
      console.log(`[AuthAction] Sign-in failed: User not found for email: ${email}`);
      return { success: false, message: "Credenciales inválidas." };
    }

    const user = usersFound[0] as User & { password_hash: string }; 
    console.log(`[AuthAction] User found: ${user.email}. Stored hash: ${user.password_hash ? user.password_hash.substring(0, 10) + "..." : "NOT FOUND"}, Length: ${user.password_hash?.length}`);


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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPasswordHash } = user;
    console.log(`[AuthAction] Sign-in successful for ${user.email}`);

    return { success: true, user: userWithoutPasswordHash };
  } catch (error: any) {
    console.error("[AuthAction] Error in signInAction:", error);
    return { success: false, message: `Error al iniciar sesión: ${error.message}` };
  }
}
