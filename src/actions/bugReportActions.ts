// src/actions/bugReportActions.ts
'use server';

import { db } from '@/lib/db';
import { bugReports } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { BugReportFormValues } from '@/lib/types';
import { getSession, isAdmin } from '@/lib/session';
import { and, count, desc, eq } from 'drizzle-orm';

export interface BugReport {
  id: number;
  name: string | null;
  email: string | null;
  page_url: string | null;
  description: string;
  steps_to_reproduce: string | null;
  browser_device: string | null;
  user_id: string | null;
  status: 'new' | 'in_review' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate' | 'cannot_reproduce';
  admin_notes: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export async function submitBugReportAction(formData: BugReportFormValues): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getSession();
    const userId = currentUser?.id || null;

    // Insertar el reporte de error en la base de datos
    await db.insert(bugReports).values({
        name: formData.name || null,
        email: formData.email || null,
        page_url: formData.pageUrl || null,
        description: formData.description,
        steps_to_reproduce: formData.stepsToReproduce || null,
        browser_device: formData.browserDevice || null,
        user_id: userId
      });

    return {
      success: true,
      message: "¡Gracias! Tu reporte de error ha sido enviado correctamente."
    };
  } catch (error) {
    console.error('Error al enviar reporte de error:', error);
    return {
      success: false,
      message: "Hubo un problema al enviar tu reporte. Por favor intenta nuevamente."
    };
  }
}

export async function getBugReportsAction(options: {
  page?: number;
  pageSize?: number;
  status?: string;
  isRead?: boolean;
} = {}): Promise<{
  bugReports: BugReport[];
  totalCount: number;
  totalPages: number;
}> {
  const { 
    page = 1, 
    pageSize = 10, 
    status,
    isRead
  } = options;
  
  const offset = (page - 1) * pageSize;

  try {
    const conditions = [];
    if (status) {
        conditions.push(eq(bugReports.status, status as any));
    }
    if (isRead !== undefined) {
        conditions.push(eq(bugReports.is_read, isRead));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Obtener el recuento total para la paginación
    const countResult = await db.select({ value: count() }).from(bugReports).where(whereClause);
    
    const totalCount = countResult[0].value;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Obtener los reportes de errores con paginación
    const bugReportsResult = await db.select().from(bugReports).where(whereClause).orderBy(desc(bugReports.created_at)).limit(pageSize).offset(offset);
    
    return {
      bugReports: bugReportsResult.map(r => ({ ...r, created_at: r.created_at?.toISOString() ?? '', updated_at: r.updated_at?.toISOString() ?? '' })) as unknown as BugReport[],
      totalCount,
      totalPages
    };
  } catch (error) {
    console.error('Error al obtener reportes de errores:', error);
    return {
      bugReports: [],
      totalCount: 0,
      totalPages: 0
    };
  }
}

export async function updateBugReportStatusAction(
  id: string, 
  status: BugReport['status'], 
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return {
        success: false,
        message: "No tienes permisos para realizar esta acción."
      };
    }
    
    let setData: { status: BugReport['status'], admin_notes?: string } = { status: status };
    if (adminNotes) {
        setData.admin_notes = adminNotes;
    }
    
    await db.update(bugReports).set(setData).where(eq(bugReports.id, parseInt(id, 10)));
    
    revalidatePath('/admin/bug-reports');
    
    return {
      success: true,
      message: "Estado del reporte actualizado correctamente."
    };
  } catch (error) {
    console.error('Error al actualizar estado del reporte:', error);
    return {
      success: false,
      message: "Hubo un problema al actualizar el estado del reporte."
    };
  }
}

export async function markBugReportAsReadAction(id: string): Promise<{ success: boolean }> {
  try {
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return { success: false };
    }
    
    await db.update(bugReports).set({ is_read: true }).where(eq(bugReports.id, parseInt(id, 10)));
    
    revalidatePath('/admin/bug-reports');

    return { success: true };
  } catch (error) {
    console.error('Error al marcar reporte como leído:', error);
    return { success: false };
  }
}

export async function getUnreadBugReportsCountAction(): Promise<number> {
  try {
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return 0;
    }
    
    const result = await db.select({ value: count() }).from(bugReports).where(eq(bugReports.is_read, false));
    
    return result[0].value || 0;
  } catch (error) {
    console.error('Error al obtener conteo de reportes no leídos:', error);
    return 0;
  }
}

export async function deleteBugReportAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return {
        success: false,
        message: "No tienes permisos para realizar esta acción."
      };
    }
    
    await db.delete(bugReports).where(eq(bugReports.id, parseInt(id, 10)));
    
    revalidatePath('/admin/bug-reports');
    
    return {
      success: true,
      message: "Reporte eliminado correctamente."
    };
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    return {
      success: false,
      message: "Hubo un problema al eliminar el reporte."
    };
  }
}

export async function markBugReportAsActionReadAction(reportId: string, is_read: boolean): Promise<{ success: boolean; message: string }> {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return { success: false, message: "No tienes permisos para realizar esta acción." };
    }
    await db.update(bugReports).set({ is_read: is_read }).where(eq(bugReports.id, parseInt(reportId, 10)));
    revalidatePath('/admin/bug-reports');
    return { success: true, message: 'Reporte de error actualizado.' };
  } catch (error) {
    console.error('Error al actualizar el reporte de error:', error);
    return { success: false, message: 'Error al actualizar el reporte de error.' };
  }
}
