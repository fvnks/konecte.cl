
// src/lib/permissions.ts

// Define all known application permissions
// Use a hierarchical naming convention like "feature:action" or "module:sub_module:action"
export const ALL_APP_PERMISSIONS = [
  // General Admin
  'admin:access_dashboard',
  'admin:view_stats',
  'admin:view_whatsapp_viewer',

  // Property Management
  'property:create',
  'property:edit_own',        // User can edit their own properties
  'property:edit_any',         // Admin can edit any property
  'property:delete_own',       // User can delete their own properties
  'property:delete_any',        // Admin can delete any property
  'property:set_active_status',// Admin can activate/deactivate any property
  'property:view_details_contact_info_if_rules_met', // General users can see contact if rules met

  // Request Management
  'request:create',
  'request:edit_own',
  'request:edit_any',          // Admin
  'request:delete_own',
  'request:delete_any',         // Admin
  'request:set_active_status', // Admin

  // User Management (Mostly Admin)
  'user:view_list',            // Admin
  'user:view_details',         // Admin
  'user:create',               // Admin
  'user:edit_profile_own',     // User can edit their own profile
  'user:edit_profile_any',     // Admin can edit any user's profile details
  'user:assign_role',          // Admin
  'user:assign_plan',          // Admin
  'user:delete',               // Admin

  // Role Management (Admin)
  'role:view_list',
  'role:create',
  'role:edit_permissions',
  'role:delete',

  // Plan Management (Admin)
  'plan:view_list',
  'plan:create',
  'plan:edit',
  'plan:delete',
  'plan:toggle_status',
  'plan:toggle_visibility',

  // Site Settings Management (Admin)
  'settings:site_appearance',
  'settings:google_sheets',    // Renamed from "analisis_whatsbot_config" to be more general
  'settings:content_management', // For editable texts

  // CRM (Primarily user-specific, admin might have oversight)
  'crm:access_own',            // User can access their own CRM
  'crm:view_any',              // Admin might view any CRM for support/overview

  // Chat / Messaging
  'chat:initiate',             // General ability to start chats
  'chat:use_whatsapp_bot',     // Specific permission, likely tied to a plan feature

  // Comments
  'comment:create',
  'comment:delete_own',
  'comment:delete_any',        // Admin

  // Visits / Scheduling
  'visit:request',                          // User can request a visit
  'visit:manage_own_property_visits',       // Property owner can manage visits to their properties
  'visit:manage_own_requested_visits',      // Visitor can manage visits they requested
  'visit:view_all',                         // Admin can see all visits

  // Broker Collaborations
  'collaboration:propose',                  // Broker can propose a collaboration
  'collaboration:manage',                   // Broker can accept/reject collaborations on their listings/requests

  // Contact Form Submissions (Admin)
  'contact_submission:view',
  'contact_submission:respond',
  'contact_submission:delete',

  // AI Features
  'ai:use_matching_tools',                  // General access to AI property/request matching
  'ai:use_free_text_search',                // Access to free-text AI search
  'ai:use_assistant_chat',                  // Access to the AI assistant chat widget

  // Special "all permissions" wildcard, typically only for 'superadmin' type roles
  '*',
] as const;

export type AppPermission = typeof ALL_APP_PERMISSIONS[number];

// Helper function to check if a role has a specific permission
// This would be used on the server-side, and potentially client-side if role permissions are loaded.
export function roleHasPermission(rolePermissions: AppPermission[] | null | undefined, requiredPermission: AppPermission): boolean {
  if (!rolePermissions) {
    return false;
  }
  // If role has wildcard, they have all permissions
  if (rolePermissions.includes('*')) {
    return true;
  }
  return rolePermissions.includes(requiredPermission);
}

// Example mapping of permissions to more user-friendly names for the UI:
export const PERMISSION_LABELS: Record<AppPermission, string> = {
    '*': 'Acceso Total (Superadmin)',
    'admin:access_dashboard': 'Acceder al Panel de Administración',
    'admin:view_stats': 'Ver Estadísticas Globales',
    'admin:view_whatsapp_viewer': 'Ver Chats de WhatsApp',
    'property:create': 'Publicar Propiedades',
    'property:edit_own': 'Editar Sus Propias Propiedades',
    'property:edit_any': 'Editar Cualquier Propiedad (Admin)',
    'property:delete_own': 'Eliminar Sus Propias Propiedades',
    'property:delete_any': 'Eliminar Cualquier Propiedad (Admin)',
    'property:set_active_status': 'Activar/Desactivar Propiedades (Admin)',
    'property:view_details_contact_info_if_rules_met': 'Ver Info de Contacto (si cumple reglas)',
    'request:create': 'Publicar Solicitudes de Búsqueda',
    'request:edit_own': 'Editar Sus Propias Solicitudes',
    'request:edit_any': 'Editar Cualquier Solicitud (Admin)',
    'request:delete_own': 'Eliminar Sus Propias Solicitudes',
    'request:delete_any': 'Eliminar Cualquier Solicitud (Admin)',
    'request:set_active_status': 'Activar/Desactivar Solicitudes (Admin)',
    'user:view_list': 'Ver Lista de Usuarios (Admin)',
    'user:view_details': 'Ver Detalles de Usuarios (Admin)',
    'user:create': 'Crear Nuevos Usuarios (Admin)',
    'user:edit_profile_own': 'Editar Su Propio Perfil',
    'user:edit_profile_any': 'Editar Perfil de Cualquier Usuario (Admin)',
    'user:assign_role': 'Asignar Roles a Usuarios (Admin)',
    'user:assign_plan': 'Asignar Planes a Usuarios (Admin)',
    'user:delete': 'Eliminar Usuarios (Admin)',
    'role:view_list': 'Ver Lista de Roles (Admin)',
    'role:create': 'Crear Nuevos Roles (Admin)',
    'role:edit_permissions': 'Editar Permisos de Roles (Admin)',
    'role:delete': 'Eliminar Roles (Admin)',
    'plan:view_list': 'Ver Lista de Planes (Admin)',
    'plan:create': 'Crear Nuevos Planes (Admin)',
    'plan:edit': 'Editar Planes (Admin)',
    'plan:delete': 'Eliminar Planes (Admin)',
    'plan:toggle_status': 'Activar/Desactivar Planes (Admin)',
    'plan:toggle_visibility': 'Cambiar Visibilidad Pública de Planes (Admin)',
    'settings:site_appearance': 'Gestionar Apariencia del Sitio (Admin)',
    'settings:google_sheets': 'Configurar Google Sheets (Admin)',
    'settings:content_management': 'Gestionar Contenido del Sitio (Admin)',
    'crm:access_own': 'Acceder a Su Propio CRM',
    'crm:view_any': 'Ver Cualquier CRM (Admin)',
    'chat:initiate': 'Iniciar Conversaciones de Chat',
    'chat:use_whatsapp_bot': 'Usar Chat con Bot de WhatsApp (Plan)',
    'comment:create': 'Crear Comentarios',
    'comment:delete_own': 'Eliminar Sus Propios Comentarios',
    'comment:delete_any': 'Eliminar Cualquier Comentario (Admin)',
    'visit:request': 'Solicitar Visitas a Propiedades',
    'visit:manage_own_property_visits': 'Gestionar Visitas a Sus Propiedades',
    'visit:manage_own_requested_visits': 'Gestionar Visitas Solicitadas',
    'visit:view_all': 'Ver Todas las Visitas (Admin)',
    'collaboration:propose': 'Proponer Colaboraciones (Corredor)',
    'collaboration:manage': 'Gestionar Sus Colaboraciones (Corredor)',
    'contact_submission:view': 'Ver Envíos de Formulario de Contacto (Admin)',
    'contact_submission:respond': 'Responder a Envíos de Formulario (Admin)',
    'contact_submission:delete': 'Eliminar Envíos de Formulario (Admin)',
    'ai:use_matching_tools': 'Usar Herramientas de Coincidencia IA',
    'ai:use_free_text_search': 'Usar Búsqueda IA por Texto Libre',
    'ai:use_assistant_chat': 'Usar Asistente de Chat IA',
};

// Group permissions for UI presentation
export const PERMISSION_GROUPS = {
    'Administración General': [
        'admin:access_dashboard', 'admin:view_stats', 'admin:view_whatsapp_viewer'
    ],
    'Gestión de Propiedades': [
        'property:create', 'property:edit_own', 'property:edit_any', 'property:delete_own', 'property:delete_any', 'property:set_active_status', 'property:view_details_contact_info_if_rules_met'
    ],
    'Gestión de Solicitudes': [
        'request:create', 'request:edit_own', 'request:edit_any', 'request:delete_own', 'request:delete_any', 'request:set_active_status'
    ],
    'Gestión de Usuarios (Admin)': [
        'user:view_list', 'user:view_details', 'user:create', 'user:edit_profile_any', 'user:assign_role', 'user:assign_plan', 'user:delete'
    ],
    'Gestión de Perfil (Usuario)': [
        'user:edit_profile_own'
    ],
    'Gestión de Roles (Admin)': [
        'role:view_list', 'role:create', 'role:edit_permissions', 'role:delete'
    ],
    'Gestión de Planes (Admin)': [
        'plan:view_list', 'plan:create', 'plan:edit', 'plan:delete', 'plan:toggle_status', 'plan:toggle_visibility'
    ],
    'Configuración del Sitio (Admin)': [
        'settings:site_appearance', 'settings:google_sheets', 'settings:content_management'
    ],
    'CRM': [
        'crm:access_own', 'crm:view_any'
    ],
    'Mensajería y Chat': [
        'chat:initiate', 'chat:use_whatsapp_bot'
    ],
    'Comentarios': [
        'comment:create', 'comment:delete_own', 'comment:delete_any'
    ],
    'Gestión de Visitas': [
        'visit:request', 'visit:manage_own_property_visits', 'visit:manage_own_requested_visits', 'visit:view_all'
    ],
    'Colaboraciones (Corredor)': [
        'collaboration:propose', 'collaboration:manage'
    ],
    'Formulario de Contacto (Admin)': [
        'contact_submission:view', 'contact_submission:respond', 'contact_submission:delete'
    ],
    'Funcionalidades de IA': [
        'ai:use_matching_tools', 'ai:use_free_text_search', 'ai:use_assistant_chat'
    ],
    'Permisos Especiales': [
        '*'
    ]
};
export type PermissionGroupName = keyof typeof PERMISSION_GROUPS;

