// src/actions/bugReportActions.ts
'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { BugReportFormValues } from '@/lib/types';
import { getSession, isAdmin } from '@/lib/session';

export interface BugReport {
  id: string;
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
    await query(
      `INSERT INTO bug_reports 
      (name, email, page_url, description, steps_to_reproduce, browser_device, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        formData.name || null,
        formData.email || null,
        formData.pageUrl || null,
        formData.description,
        formData.stepsToReproduce || null,
        formData.browserDevice || null,
        userId
      ]
    );

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
    // Construir la consulta base
    let whereClause = '';
    const params: any[] = [];
    
    if (status) {
      whereClause += 'WHERE status = ?';
      params.push(status);
    }
    
    if (isRead !== undefined) {
      whereClause += whereClause ? ' AND is_read = ?' : 'WHERE is_read = ?';
      params.push(isRead);
    }
    
    // Obtener el recuento total para la paginación
    const countResult = await query(
      `SELECT COUNT(*) as total FROM bug_reports ${whereClause}`,
      params
    );
    
    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Obtener los reportes de errores con paginación
    const bugReportsResult = await query(
      `SELECT * FROM bug_reports ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    
    return {
      bugReports: bugReportsResult as BugReport[],
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
    
    // Actualizar el estado del reporte
    if (adminNotes) {
      await query(
        'UPDATE bug_reports SET status = ?, admin_notes = ? WHERE id = ?',
        [status, adminNotes, id]
      );
    } else {
      await query(
        'UPDATE bug_reports SET status = ? WHERE id = ?',
        [status, id]
      );
    }
    
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
    
    await query(
      'UPDATE bug_reports SET is_read = TRUE WHERE id = ?',
      [id]
    );
    
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
    
    const result = await query(
      'SELECT COUNT(*) as count FROM bug_reports WHERE is_read = FALSE'
    );
    
    return result[0].count || 0;
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
    
    await query('DELETE FROM bug_reports WHERE id = ?', [id]);
    
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
