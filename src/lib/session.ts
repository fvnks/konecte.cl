import { cookies } from 'next/headers';
import { db } from './db';

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
    const session = await db.query.sessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.token, sessionToken),
      with: {
        user: true
      }
    });
    
    if (!session || new Date(session.expires) < new Date()) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
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