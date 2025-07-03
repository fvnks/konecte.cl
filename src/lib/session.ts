import { cookies } from 'next/headers';
import { db } from './db';
import { sessions, users } from './db/schema';
import { eq } from 'drizzle-orm';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const sessionToken = cookies().get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    const results = await db
      .select()
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, sessionToken))
      .limit(1);
    
    if (results.length === 0) {
      return null;
    }

    const { sessions: sessionData, users: userData } = results[0];

    if (!sessionData || !userData || new Date(sessionData.expires) < new Date()) {
      // Limpiar cookie expirada
      if (sessionData && new Date(sessionData.expires) < new Date()) {
        cookies().set('session_token', '', { expires: new Date(0), path: '/' });
      }
      return null;
    }
    
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.roleId, // Asumiendo que roleId contiene el string del rol
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getSession();
  return user?.role === 'admin';
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSession();
  
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  return user;
} 