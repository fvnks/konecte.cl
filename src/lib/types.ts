
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
  rut_tin?: string | null; // RUT (Chile) o Tax ID Number
  phone_number?: string | null; // Número de teléfono
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
  views_count?: number; // Añadido
  inquiries_count?: number; // Añadido
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
  open_for_broker_collaboration?: boolean;
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
  // Nuevos campos para la barra de anuncios
  announcement_bar_text?: string | null;
  announcement_bar_link_url?: string | null;
  announcement_bar_link_text?: string | null;
  announcement_bar_is_active?: boolean;
  announcement_bar_bg_color?: string | null;
  announcement_bar_text_color?: string | null;
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
  role_id: z.string().min(1, "El rol es requerido."),
  plan_id: z.string().optional().nullable(),
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

export const interactionTypeValues = [ // This is for CRM Interaction Types
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

// --- Auth Schemas ---
export const signUpSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255),
  rut: z.string().min(8, "El RUT/DNI debe tener al menos 8 caracteres.").max(20, "El RUT/DNI no puede exceder los 20 caracteres.").optional().or(z.literal('')),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos.").max(20, "El teléfono no puede exceder los 20 caracteres.").optional().or(z.literal('')),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(100),
  confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres."),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Path of error
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

// --- Request Form Schema ---
export const requestFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  desiredPropertyType: z.array(z.enum(["rent", "sale"])).min(1, "Debes seleccionar al menos un tipo de transacción (arriendo/venta)."),
  desiredCategories: z.array(z.enum(["apartment", "house", "condo", "land", "commercial", "other"])).min(1, "Debes seleccionar al menos una categoría de propiedad."),
  desiredLocationCity: z.string().min(2, "La ciudad/comuna deseada es requerida."),
  desiredLocationNeighborhood: z.string().optional(),
  minBedrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "No puede ser negativo.").optional().or(z.literal('')),
  minBathrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "No puede ser negativo.").optional().or(z.literal('')),
  budgetMax: z.coerce.number().positive("El presupuesto máximo debe ser un número positivo.").optional().or(z.literal('')),
  open_for_broker_collaboration: z.boolean().default(false).optional(),
});
export type RequestFormValues = z.infer<typeof requestFormSchema>;


// --- Chat Types ---
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string; // ISO string date
  read_at?: string | null; // ISO string date
  sender?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface ChatConversation {
  id: string;
  property_id?: string | null;
  request_id?: string | null;
  user_a_id: string;
  user_b_id: string;
  user_a_unread_count: number;
  user_b_unread_count: number;
  last_message_at?: string | null; // ISO string date
  created_at: string; // ISO string date
  updated_at: string; // ISO string date
}

// Type for displaying a list of conversations
export interface ChatConversationListItem {
  id: string;
  last_message_at?: string | null; // ISO string date
  other_user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  last_message_content?: string | null;
  unread_count_for_current_user: number;
  property_id?: string | null;
  request_id?: string | null;
  context_title?: string | null; // e.g., Property title or Request title
  context_slug?: string | null; // Slug for linking
  context_type?: 'property' | 'request' | null;
}

// --- Editable Texts Types ---
export interface EditableText {
  id: string;
  page_group: string;
  description: string;
  content_default: string | null;
  content_current: string | null;
  created_at?: string;
  updated_at?: string;
}

// --- Lead Tracking Types ---
export interface PropertyView {
  id: string;
  property_id: string;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  viewed_at: string; // ISO string date
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  property_owner_id: string; // ID del dueño de la propiedad
  user_id?: string | null; // ID del usuario que consulta, si está logueado
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submitted_at: string; // ISO string date
  is_read: boolean;
}

export const propertyInquiryFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido.").max(100),
  email: z.string().email("Correo electrónico inválido."),
  phone: z.string().max(20).optional().or(z.literal('')),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres.").max(1000),
});
export type PropertyInquiryFormValues = z.infer<typeof propertyInquiryFormSchema>;

// --- Property Visits Types ---
export type PropertyVisitStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'cancelled_by_visitor'
  | 'cancelled_by_owner'
  | 'rescheduled_by_owner'
  | 'completed'
  | 'visitor_no_show'
  | 'owner_no_show';

export const propertyVisitStatusValues: PropertyVisitStatus[] = [
  'pending_confirmation',
  'confirmed',
  'cancelled_by_visitor',
  'cancelled_by_owner',
  'rescheduled_by_owner',
  'completed',
  'visitor_no_show',
  'owner_no_show',
];

export const PropertyVisitStatusLabels: Record<PropertyVisitStatus, string> = {
  pending_confirmation: 'Pendiente Confirmación',
  confirmed: 'Confirmada',
  cancelled_by_visitor: 'Cancelada por Visitante',
  cancelled_by_owner: 'Cancelada por Propietario',
  rescheduled_by_owner: 'Reagendada por Propietario',
  completed: 'Completada',
  visitor_no_show: 'Visitante No Asistió',
  owner_no_show: 'Propietario No Asistió',
};

export interface PropertyVisit {
  id: string;
  property_id: string;
  visitor_user_id: string;
  property_owner_user_id: string;
  proposed_datetime: string; // ISO string date
  confirmed_datetime?: string | null; // ISO string date
  status: PropertyVisitStatus;
  visitor_notes?: string | null;
  owner_notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string; // ISO string date
  updated_at: string; // ISO string date
  // Optional joined data for display
  property_title?: string;
  property_slug?: string;
  visitor_name?: string;
  visitor_avatar_url?: string;
  owner_name?: string;
  owner_avatar_url?: string;
}

export const requestVisitFormSchema = z.object({
  proposed_datetime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La fecha y hora propuestas son inválidas.",
  }),
  visitor_notes: z.string().max(1000, "Las notas no pueden exceder los 1000 caracteres.").optional().or(z.literal('')),
});
export type RequestVisitFormValues = z.infer<typeof requestVisitFormSchema>;

export const updateVisitStatusFormSchema = z.object({
  new_status: z.enum(propertyVisitStatusValues, { required_error: "El nuevo estado es requerido." }),
  confirmed_datetime: z.string().optional().nullable().refine(
    (date) => date === null || date === undefined || date === '' || !isNaN(Date.parse(date)), {
    message: "La fecha confirmada es inválida si se proporciona.",
  }),
  owner_notes: z.string().max(1000).optional().or(z.literal('')),
  cancellation_reason: z.string().max(500).optional().or(z.literal('')),
});
export type UpdateVisitStatusFormValues = z.infer<typeof updateVisitStatusFormSchema>;

export type PropertyVisitAction =
  | 'confirm'
  | 'cancel_by_owner'
  | 'reschedule'
  | 'mark_completed'
  | 'mark_visitor_no_show'
  | 'mark_owner_no_show'
  | 'cancel_by_visitor';

// --- Contact Form Submissions ---
export interface ContactFormSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  submitted_at: string; // ISO string date
  is_read: boolean;
  admin_notes?: string | null;
  replied_at?: string | null; // ISO string date
}

export const contactFormPublicSchema = z.object({
  name: z.string().min(2, "El nombre es requerido.").max(100),
  email: z.string().email("Correo electrónico inválido."),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().min(3, "El asunto debe tener al menos 3 caracteres.").max(150).optional().or(z.literal('')),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres.").max(2000),
});
export type ContactFormPublicValues = z.infer<typeof contactFormPublicSchema>;

// --- User Listing Interactions (Likes/Dislikes) ---
export const listingTypeValues = ['property', 'request'] as const;
export type ListingType = (typeof listingTypeValues)[number];

export const listingInteractionTypeValues = ['like', 'dislike', 'skip'] as const;
export type InteractionTypeEnum = (typeof listingInteractionTypeValues)[number];

export interface UserListingInteraction {
  id: string;
  user_id: string;
  listing_id: string;
  listing_type: ListingType;
  interaction_type: InteractionTypeEnum;
  created_at: string; // ISO string date
}

export const recordInteractionSchema = z.object({
  listingId: z.string().uuid("ID de listado inválido."),
  listingType: z.enum(listingTypeValues, { required_error: "Tipo de listado requerido." }),
  interactionType: z.enum(listingInteractionTypeValues, { required_error: "Tipo de interacción requerido." }),
});
export type RecordInteractionValues = z.infer<typeof recordInteractionSchema>;

export interface RecordInteractionResult {
  success: boolean;
  message?: string;
  interaction?: UserListingInteraction;
  matchDetails?: {
    matchFound: boolean;
    conversationId?: string;
    userAName?: string; 
    userBName?: string; 
    likedListingTitle?: string; 
    reciprocalListingTitle?: string; 
  }
}

// --- Server Action Results for Submit ---
export interface SubmitPropertyResult {
  success: boolean;
  message?: string;
  propertyId?: string;
  propertySlug?: string;
  autoMatchesCount?: number;
}

export interface SubmitRequestResult {
  success: boolean;
  message?: string;
  requestId?: string;
  requestSlug?: string;
  autoMatchesCount?: number;
}


// --- DATOS DE EJEMPLO (Se mantendrán para desarrollo/fallback si la BD no está conectada) ---

export const placeholderUser: User = {
  id: 'user1',
  name: 'Juanita Pérez',
  avatarUrl: 'https://placehold.co/40x40.png?text=JP',
  email: 'juanita.perez@example.com',
  role_id: 'user',
  role_name: 'Usuario'
};
