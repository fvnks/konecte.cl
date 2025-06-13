
// src/lib/types.ts
import { z } from 'zod';

export interface Role {
  id: string; // ej: admin, editor_contenido
  name: string; // ej: Administrador, Editor de Contenido
  description?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_currency: string;
  max_properties_allowed: number | null; // null para ilimitado
  max_requests_allowed: number | null;   // null para ilimitado
  can_feature_properties: boolean;
  property_listing_duration_days: number | null; // null para indefinido
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  password_hash?: string; // Only present when fetched from DB, should not be sent to client
  role_id: string; // FK a Role.id
  role_name?: string; // Nombre del rol (para mostrar en UI, obtenido de un JOIN)
  plan_id?: string | null; // FK a Plan.id
  plan_name?: string | null; // Nombre del plan (para mostrar en UI)
  plan_expires_at?: string | null; // Fecha de expiración del plan
  created_at?: string;
  updated_at?: string;
}

export type PropertyType = 'rent' | 'sale';
export type ListingCategory = 'apartment' | 'house' | 'condo' | 'land' | 'commercial' | 'other';

export interface PropertyListing {
  id: string;
  user_id: string; // FK a User.id
  title: string;
  description: string;
  propertyType: PropertyType;
  category: ListingCategory;
  price: number;
  currency: string; // CLP, UF, USD
  address: string;
  city: string; // Ciudad o Comuna
  country: string;
  bedrooms: number;
  bathrooms: number;
  areaSqMeters: number;
  images: string[];
  features?: string[];
  slug: string;
  upvotes: number;
  commentsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
}


export interface SearchRequest {
  id: string;
  user_id: string; // FK a User.id
  title: string;
  description: string;

  desiredPropertyType: PropertyType[];
  desiredCategories: ListingCategory[];

  desiredLocation?: {
    city: string;
    neighborhood?: string;
  };
  minBedrooms?: number;
  minBathrooms?: number;
  budgetMax?: number;
  commentsCount: number;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
}


export interface Comment {
  id: string;
  user_id: string;
  property_id?: string | null;
  request_id?: string | null;
  content: string;
  parent_id?: string | null; // Para comentarios anidados
  upvotes: number;
  created_at: string;
  updated_at: string;
  author?: Pick<User, 'id' | 'name' | 'avatarUrl'>; // Incluimos solo lo necesario del autor
}

// Esquema para añadir un nuevo comentario
export const addCommentFormSchema = z.object({
  content: z.string().min(1, "El comentario no puede estar vacío.").max(1000, "El comentario no puede exceder los 1000 caracteres."),
  parentId: z.string().uuid().optional(), // Para respuestas
});
export type AddCommentFormValues = z.infer<typeof addCommentFormSchema>;


export interface GoogleSheetConfig {
  id?: number;
  sheetId: string | null;
  sheetName: string | null;
  columnsToDisplay: string | null;
  isConfigured: boolean;
}

export type LandingSectionKey = "featured_list_requests" | "ai_matching" | "google_sheet";

export interface SiteSettings {
  id?: number;
  siteTitle: string | null;
  logoUrl: string | null;
  show_featured_listings_section?: boolean;
  show_ai_matching_section?: boolean;
  show_google_sheet_section?: boolean;
  landing_sections_order?: LandingSectionKey[] | null;
  updated_at?: string;
}

// --- User Management by Admin ---
export const adminCreateUserFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(100),
  confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres."),
  role_id: z.string().min(1, "El rol es requerido."),
  plan_id: z.string().optional().nullable(), // Puede ser string, undefined, o null
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});
export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserFormSchema>;

export const adminEditUserFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255),
  // role_id y plan_id se manejan con acciones separadas por ahora, pero podrían incluirse aquí si se desea un form unificado
});
export type AdminEditUserFormValues = z.infer<typeof adminEditUserFormSchema>;


// --- CRM Types ---

export type ContactStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'on_hold'
  | 'unqualified';

export const contactStatusOptions: { value: ContactStatus; label: string }[] = [
    { value: 'new', label: 'Nuevo' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'qualified', label: 'Calificado' },
    { value: 'proposal_sent', label: 'Propuesta Enviada' },
    { value: 'negotiation', label: 'En Negociación' },
    { value: 'won', label: 'Ganado' },
    { value: 'lost', label: 'Perdido' },
    { value: 'on_hold', label: 'En Espera' },
    { value: 'unqualified', label: 'No Calificado' },
];

export const contactStatusValues = [
  'new', 'contacted', 'qualified', 'proposal_sent',
  'negotiation', 'won', 'lost', 'on_hold', 'unqualified'
] as const;

const baseContactSchemaParts = {
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  company_name: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(contactStatusValues).default('new'),
  source: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
};

export const addContactFormSchema = z.object(baseContactSchemaParts);
export type AddContactFormValues = z.infer<typeof addContactFormSchema>;

export const editContactFormSchema = z.object(baseContactSchemaParts);
export type EditContactFormValues = z.infer<typeof editContactFormSchema>;


export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  status: ContactStatus;
  source?: string | null;
  notes?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type InteractionType =
  | 'note'
  | 'email_sent'
  | 'email_received'
  | 'call_made'
  | 'call_received'
  | 'meeting'
  | 'message_sent'
  | 'message_received'
  | 'task_completed'
  | 'property_viewing'
  | 'offer_made'
  | 'other';

export const interactionTypeValues = [
  'note', 'email_sent', 'email_received', 'call_made', 'call_received',
  'meeting', 'message_sent', 'message_received', 'task_completed',
  'property_viewing', 'offer_made', 'other'
] as const;

export const interactionTypeOptions: { value: InteractionType; label: string }[] = [
    { value: 'note', label: 'Nota' },
    { value: 'email_sent', label: 'Email Enviado' },
    { value: 'email_received', label: 'Email Recibido' },
    { value: 'call_made', label: 'Llamada Realizada' },
    { value: 'call_received', label: 'Llamada Recibida' },
    { value: 'meeting', label: 'Reunión' },
    { value: 'message_sent', label: 'Mensaje Enviado' },
    { value: 'message_received', label: 'Mensaje Recibido' },
    { value: 'task_completed', label: 'Tarea Completada' },
    { value: 'property_viewing', label: 'Visita a Propiedad' },
    { value: 'offer_made', label: 'Oferta Realizada' },
    { value: 'other', label: 'Otro' },
];

export interface Interaction {
  id: string;
  contact_id: string;
  user_id: string; // User who logged this interaction, usually the contact owner
  interaction_type: InteractionType;
  interaction_date: string; // ISO string date
  subject?: string | null;
  description: string;
  outcome?: string | null;
  follow_up_needed: boolean;
  follow_up_date?: string | null; // ISO string date (date part only)
  created_at: string;
  updated_at: string;
  contact_name?: string; // For display purposes, joined from contacts table
}

const baseInteractionFormSchema = z.object({
  interaction_type: z.enum(interactionTypeValues, {
    required_error: "El tipo de interacción es requerido.",
  }),
  interaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La fecha de interacción es inválida.",
  }),
  subject: z.string().max(255).optional().or(z.literal('')),
  description: z.string().min(1, "La descripción es requerida.").max(2000, "La descripción no puede exceder los 2000 caracteres."),
  outcome: z.string().max(255).optional().or(z.literal('')),
  follow_up_needed: z.boolean().default(false),
  follow_up_date: z.string().optional().nullable().refine(
    (date) => date === null || date === undefined || date === '' || !isNaN(Date.parse(date)), {
    message: "La fecha de seguimiento es inválida.",
  }),
});

export const addInteractionFormSchema = baseInteractionFormSchema;
export type AddInteractionFormValues = z.infer<typeof addInteractionFormSchema>;

export const editInteractionFormSchema = baseInteractionFormSchema;
export type EditInteractionFormValues = z.infer<typeof editInteractionFormSchema>;

// --- Chat Types ---
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
  sender?: Pick<User, 'id' | 'name' | 'avatarUrl'>; // Optional sender details for display
}

export interface ChatConversation {
  id: string;
  property_id?: string | null;
  request_id?: string | null;
  user_a_id: string;
  user_b_id: string;
  user_a_unread_count: number;
  user_b_unread_count: number;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  // Fields for display in a list
  other_user?: Pick<User, 'id' | 'name' | 'avatarUrl'>; // Details of the other participant
  last_message_content?: string | null; // Snippet of the last message
  unread_count_for_current_user?: number; // Specific unread count for the logged-in user in this convo
  context_title?: string; // e.g., Property title or Request title
  context_slug?: string; // Slug for linking
  context_type?: 'property' | 'request' | null;
}

// Simplified version for listing conversations, might include a snippet of the last message etc.
export type ChatConversationListItem = Pick<
  ChatConversation,
  | 'id'
  | 'last_message_at'
  | 'other_user'
  | 'last_message_content'
  | 'unread_count_for_current_user'
  | 'property_id'
  | 'request_id'
  | 'context_title'
  | 'context_slug'
  | 'context_type'
>;


// --- DATOS DE EJEMPLO (Se mantendrán para desarrollo/fallback si la BD no está conectada) ---

export const placeholderUser: User = {
  id: 'user1',
  name: 'Juanita Pérez',
  avatarUrl: 'https://placehold.co/40x40.png?text=JP',
  email: 'juanita.perez@example.com',
  role_id: 'user',
  role_name: 'Usuario'
};

    