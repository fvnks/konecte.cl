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

  try {
    // Verificar si el email ya existe
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return { success: false, message: "Ya existe un usuario con este correo electrónico." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const defaultUserRoleId = 'user'; // Asignar rol 'user' por defecto

    // Verificar si el rol 'user' existe
    const userRole = await query('SELECT id FROM roles WHERE id = ?', [defaultUserRoleId]);
    if (userRole.length === 0) {
        // Podrías crear el rol 'user' aquí si no existe, o lanzar un error más específico.
        // Por ahora, si no existe, no se puede crear el usuario.
        console.error(`Error Crítico: El rol por defecto '${defaultUserRoleId}' no existe en la base de datos.`);
        return { success: false, message: "Error de configuración del sistema: No se pudo asignar el rol por defecto. Contacte al administrador."};
    }


    await query(
      'INSERT INTO users (id, name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, defaultUserRoleId]
    );

    const newUser: Omit<User, 'password_hash'> = {
      id: userId,
      name,
      email,
      role_id: defaultUserRoleId,
      // role_name se podría obtener con otra consulta o dejar que el frontend lo maneje
    };

    return { success: true, message: "Usuario registrado exitosamente.", user: newUser };
  } catch (error: any) {
    console.error("Error en signUpAction:", error);
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

  try {
    const usersFound = await query(
        `SELECT u.id, u.name, u.email, u.password_hash, u.avatar_url, u.role_id, r.name as role_name 
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ?`, 
        [email]
    );

    if (usersFound.length === 0) {
      return { success: false, message: "Credenciales inválidas." };
    }

    const user: User & { password_hash: string } = usersFound[0];
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { success: false, message: "Credenciales inválidas." };
    }

    // No devolver el password_hash al cliente
    const { password_hash, ...userWithoutPasswordHash } = user;

    return { success: true, user: userWithoutPasswordHash };
  } catch (error: any) {
    console.error("Error en signInAction:", error);
    return { success: false, message: `Error al iniciar sesión: ${error.message}` };
  }
}
