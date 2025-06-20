// src/lib/types.ts
import { z } from 'zod';
import type { AppPermission } from './permissions'; // Import AppPermission
import { validarRut } from './rutValidator'; // Importar el validador de RUT

export interface Role {
  id: string; // ej: admin, editor_contenido
  name: string; // ej: Administrador, Editor de Contenido
  description?: string;
  permissions?: AppPermission[] | null;
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_currency: string;
  max_properties_allowed: number | null;
  max_requests_allowed: number | null;
  max_ai_searches_monthly: number | null;
  property_listing_duration_days: number | null;
  can_feature_properties: boolean;
  
  can_view_contact_data?: boolean;         
  manual_searches_daily_limit?: number | null; 
  automated_alerts_enabled?: boolean;     
  advanced_dashboard_access?: boolean;    
  daily_profile_views_limit?: number | null;   
  weekly_matches_reveal_limit?: number | null; 
  
  is_active: boolean;
  is_publicly_visible: boolean;
  is_enterprise_plan?: boolean;           

  created_at?: string;
  updated_at?: string;
}


export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  password_hash?: string; // Should ideally not be sent to client
  rut_tin?: string | null;
  phone_number?: string | null;
  role_id: string;
  role_name?: string;
  role_permissions?: AppPermission[] | null;
  plan_id?: string | null;
  plan_name?: string | null; 
  plan_expires_at?: string | null;
  
  plan_is_pro_or_premium?: boolean;
  plan_allows_contact_view?: boolean; 
  plan_is_premium_broker?: boolean; 
  plan_automated_alerts_enabled?: boolean;
  plan_advanced_dashboard_access?: boolean;

  // New fields for different account types
  company_name?: string | null;
  main_operating_region?: string | null;
  main_operating_commune?: string | null;
  properties_in_portfolio_count?: number | null;
  website_social_media_link?: string | null;

  created_at?: string;
  updated_at?: string;
}

export type PropertyType = 'rent' | 'sale';
export type ListingCategory = 'apartment' | 'house' | 'condo' | 'land' | 'commercial' | 'other';
export const orientationValues = ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", "other", "none"] as const;
export type OrientationType = typeof orientationValues[number];


export interface PropertyListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  category: ListingCategory;
  price: number;
  currency: string; // Could be 'CLP' or 'UF'
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  totalAreaSqMeters: number;
  usefulAreaSqMeters?: number | null;
  parkingSpaces?: number;
  petsAllowed?: boolean;
  furnished?: boolean;
  commercialUseAllowed?: boolean;
  hasStorage?: boolean;
  orientation?: OrientationType | null;
  images: string[];
  features?: string[];
  slug: string;
  upvotes: number;
  commentsCount: number;
  views_count?: number;
  inquiries_count?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User; 
}


export interface SearchRequest {
  id: string;
  user_id: string;
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
  upvotes: number;
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
  parent_id?: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  author?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export const addCommentFormSchema = z.object({
  content: z.string().min(1, "El comentario no puede estar vacío.").max(1000, "El comentario no puede exceder los 1000 caracteres."),
  parentId: z.string().uuid().optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentFormSchema>;

export interface UserCommentInteraction {
  id: string;
  user_id: string;
  comment_id: string;
  interaction_type: 'like'; 
  created_at: string;
}

export interface CommentInteractionDetails {
  totalLikes: number;
  currentUserLiked: boolean;
}


export interface GoogleSheetConfig {
  id?: number;
  sheetId: string | null;
  sheetName: string | null;
  columnsToDisplay: string | null;
  isConfigured: boolean;
}

export type LandingSectionKey = "featured_list_requests" | "ai_matching" | "analisis_whatsbot" | "featured_plans";

export interface SiteSettings {
  id?: number;
  siteTitle: string | null;
  logoUrl: string | null;
  show_featured_listings_section?: boolean;
  show_ai_matching_section?: boolean;
  show_google_sheet_section?: boolean;
  show_featured_plans_section?: boolean; 
  landing_sections_order?: LandingSectionKey[] | null;
  announcement_bar_text?: string | null;
  announcement_bar_link_url?: string | null;
  announcement_bar_link_text?: string | null;
  announcement_bar_is_active?: boolean;
  announcement_bar_bg_color?: string | null;
  announcement_bar_text_color?: string | null;
  updated_at?: string;
}

const passwordValidation = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(100, "La contraseña no puede exceder los 100 caracteres.")
  .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula.")
  .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula.")
  .regex(/[0-9]/, "La contraseña debe contener al menos un número.")
  .regex(/[^A-Za-z0-9]/, "La contraseña debe contener al menos un carácter especial (ej: !@#$%^&*).");

export const adminCreateUserFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255),
  password: passwordValidation,
  confirmPassword: passwordValidation,
  role_id: z.string().min(1, "El rol es requerido."),
  plan_id: z.string().optional().nullable(),
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
  user_id: string;
  interaction_type: InteractionType;
  interaction_date: string;
  subject?: string | null;
  description: string;
  outcome?: string | null;
  follow_up_needed: boolean;
  follow_up_date?: string | null;
  created_at: string;
  updated_at: string;
  contact_name?: string;
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

export const signUpSchema = z.object({
  accountType: z.enum(['natural', 'broker'], { required_error: "Debes seleccionar un tipo de cuenta."}),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255),
  password: passwordValidation,
  confirmPassword: passwordValidation,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones.",
  }),

  phone_number: z.string().max(50, "El teléfono no puede exceder los 50 caracteres.").optional().or(z.literal('')),
  rut_tin: z.string().max(20, "El RUT/Tax ID no puede exceder los 20 caracteres.").optional().or(z.literal('')),

  company_name: z.string().max(255, "El nombre de la empresa no puede exceder los 255 caracteres.").optional().or(z.literal('')),
  main_operating_region: z.string().max(100, "La región no puede exceder los 100 caracteres.").optional().or(z.literal('')),
  main_operating_commune: z.string().max(100, "La comuna no puede exceder los 100 caracteres.").optional().or(z.literal('')),
  properties_in_portfolio_count: z.coerce.number().int("Debe ser un número entero.").min(0, "No puede ser negativo.").optional().nullable(),
  website_social_media_link: z.string().url("Debe ser una URL válida para el sitio web/RRSS.").max(2048).optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.accountType === 'broker') {
    if (!data.rut_tin || data.rut_tin.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El RUT es requerido para corredores/inmobiliarias.",
        path: ["rut_tin"],
      });
    } else if (!validarRut(data.rut_tin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El RUT ingresado no es válido.",
        path: ["rut_tin"],
      });
    }
  } else if (data.accountType === 'natural') {
    if (data.rut_tin && data.rut_tin.trim() !== '' && !validarRut(data.rut_tin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El RUT ingresado no es válido.",
        path: ["rut_tin"],
      });
    }
  }
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const propertyFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  propertyType: z.enum(["rent", "sale"], { required_error: "Debes seleccionar un tipo de propiedad (arriendo/venta)." }),
  category: z.enum(["apartment", "house", "condo", "land", "commercial", "other"], { required_error: "Debes seleccionar una categoría." }),
  price: z.coerce.number({invalid_type_error: "El precio debe ser un número."}).positive("El precio debe ser un número positivo."),
  currency: z.enum(["CLP", "UF"], { required_error: "La moneda es requerida." }),
  address: z.string().min(5, "La dirección es requerida."),
  city: z.string().min(2, "La ciudad es requerida."),
  country: z.string().min(2, "El país es requerido."),
  bedrooms: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Debe ser un número."}).int("Debe ser un número entero.").min(0, "No puede ser negativo.").default(0)
  ),
  bathrooms: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Debe ser un número."}).int("Debe ser un número entero.").min(0, "No puede ser negativo.").default(0)
  ),
  totalAreaSqMeters: z.coerce.number({invalid_type_error: "Debe ser un número."}).positive("El área total (m²) debe ser un número positivo."),
  usefulAreaSqMeters: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Debe ser un número."}).positive("El área útil (m²) debe ser un número positivo.").optional().nullable()
  ),
  parkingSpaces: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Debe ser un número."}).int("Debe ser un número entero.").min(0, "No puede ser negativo.").default(0)
  ),
  petsAllowed: z.boolean().default(false).optional(),
  furnished: z.boolean().default(false).optional(),
  commercialUseAllowed: z.boolean().default(false).optional(),
  hasStorage: z.boolean().default(false).optional(),
  orientation: z.enum(orientationValues).optional().or(z.literal('')), 
  images: z.array(z.string().url("Cada imagen debe ser una URL válida.")).min(0).max(5, "Puedes subir un máximo de 5 imágenes.").optional().default([]),
  features: z.string().optional().describe("Características separadas por comas. Ejemplo: Piscina,Estacionamiento"),
});
export type PropertyFormValues = z.infer<typeof propertyFormSchema>;


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

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string; 
  receiver_id: string;
  content: string;
  created_at: string; 
  read_at?: string | null;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
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
}

export interface ChatConversationListItem {
  id: string;
  last_message_at?: string | null;
  other_user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  last_message_content?: string | null;
  unread_count_for_current_user: number;
  property_id?: string | null;
  request_id?: string | null;
  context_title?: string | null;
  context_slug?: string | null;
  context_type?: 'property' | 'request' | null;
}

export interface EditableText {
  id: string;
  page_group: string;
  description: string;
  content_default: string | null;
  content_current: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyView {
  id: string;
  property_id: string;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  viewed_at: string;
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  property_owner_id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submitted_at: string;
  is_read: boolean;
}

export const propertyInquiryFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido.").max(100),
  email: z.string().email("Correo electrónico inválido."),
  phone: z.string().max(20).optional().or(z.literal('')),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres.").max(1000),
});
export type PropertyInquiryFormValues = z.infer<typeof propertyInquiryFormSchema>;

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
  proposed_datetime: string;
  confirmed_datetime?: string | null;
  status: PropertyVisitStatus;
  visitor_notes?: string | null;
  owner_notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  property_title?: string;
  property_slug?: string;
  visitor_name?: string;
  visitor_avatar_url?: string;
  owner_name?: string;
  owner_avatar_url?: string;
}

export const requestVisitFormSchema = z.object({
  proposed_datetime: z.string().refine((date) => date && !isNaN(Date.parse(date)), {
    message: "La fecha y hora propuestas son inválidas o no han sido seleccionadas.",
  }),
  visitor_notes: z.string().max(1000, "Las notas no pueden exceder los 1000 caracteres.").optional().or(z.literal('')),
});
export type RequestVisitFormValues = z.infer<typeof requestVisitFormSchema>;

export type PropertyVisitAction =
  | 'confirm_original_proposal' 
  | 'reschedule_proposal'       
  | 'cancel_pending_request'    
  | 'cancel_confirmed_visit'    
  | 'mark_completed'            
  | 'mark_visitor_no_show'      
  | 'mark_owner_no_show'        
  | 'accept_owner_reschedule'   
  | 'reject_owner_reschedule'   
  | 'cancel_own_request';       

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


export interface ContactFormSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  submitted_at: string;
  is_read: boolean;
  admin_notes?: string | null;
  replied_at?: string | null;
}

export const contactFormPublicSchema = z.object({
  name: z.string().min(2, "El nombre es requerido.").max(100),
  email: z.string().email("Correo electrónico inválido."),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().min(3, "El asunto debe tener al menos 3 caracteres.").max(150).optional().or(z.literal('')),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres.").max(2000),
});
export type ContactFormPublicValues = z.infer<typeof contactFormPublicSchema>;

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
  created_at: string;
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
  newTotalLikes?: number;
  newInteractionType?: InteractionTypeEnum;
  matchDetails?: {
    matchFound: boolean;
    conversationId?: string;
    userAName?: string;
    userBName?: string;
    likedListingTitle?: string;
    reciprocalListingTitle?: string;
  }
}

export interface ListingInteractionDetails {
  totalLikes: number;
  currentUserInteraction: InteractionTypeEnum | null;
}


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

export type WhatsAppMessageSender = 'user' | 'bot';

export interface WhatsAppMessage {
  id: string;
  telefono: string; 
  text: string;
  sender: WhatsAppMessageSender; 
  timestamp: number; 
  status?: 'pending_to_whatsapp' | 'sent_to_whatsapp' | 'delivered_to_user' | 'failed'; 
  sender_id_override?: string; 
  telefono_remitente_konecte?: string; 
}

export interface SendMessageToBotPayload {
  telefonoReceptorBot: string; 
  text: string;
  telefonoRemitenteUsuarioWeb: string; 
  userId: string; 
}

export type ReceiveReplyPayload = { 
  telefono: string; 
  text: string; 
}

export interface PendingMessageForExternalBot {
  id: string;
  telefonoReceptorEnWhatsapp: string; 
  textoOriginal: string; 
  telefonoRemitenteParaRespuestaKonecte: string; 
  userId: string; 
}

export type BrokerCollaborationStatus = 'pending' | 'accepted' | 'rejected' | 'deal_in_progress' | 'deal_closed_success' | 'deal_failed';

export interface BrokerCollaboration {
    id: string;
    property_request_id: string;
    requesting_broker_id: string; 
    property_id: string;
    offering_broker_id: string; 
    status: BrokerCollaborationStatus;
    commission_terms?: string | null; 
    chat_conversation_id?: string | null;
    proposed_at: string;
    accepted_at?: string | null;
    closed_at?: string | null;
    updated_at: string;

    property_request_title?: string;
    property_request_slug?: string;
    requesting_broker_name?: string;
    property_title?: string;
    property_slug?: string;
    offering_broker_name?: string;
}

export const proposePropertyFormSchema = z.object({
  selectedPropertyId: z.string().uuid("Debes seleccionar una propiedad válida."),
  commission_terms: z.string().max(500, "Los términos de comisión no pueden exceder los 500 caracteres.").optional().or(z.literal('')),
});
export type ProposePropertyFormValues = z.infer<typeof proposePropertyFormSchema>;

export const bugReportFormSchema = z.object({
  name: z.string().max(100, "El nombre no puede exceder los 100 caracteres.").optional().or(z.literal('')),
  email: z.string().email("Correo electrónico inválido.").max(100).optional().or(z.literal('')),
  pageUrl: z.string().url("Debe ser una URL válida.").max(2048).optional().or(z.literal('')),
  description: z.string().min(10, "La descripción del error debe tener al menos 10 caracteres.").max(2000, "La descripción no puede exceder los 2000 caracteres."),
  stepsToReproduce: z.string().max(2000, "Los pasos no pueden exceder los 2000 caracteres.").optional().or(z.literal('')),
  browserDevice: z.string().max(500, "La información del navegador/dispositivo no puede exceder los 500 caracteres.").optional().or(z.literal('')),
});
export type BugReportFormValues = z.infer<typeof bugReportFormSchema>;

export type UserMetricType = 'profile_view' | 'match_reveal' | 'ai_search' | 'manual_search_executed';

export type UserActionLogType =
  | 'view_property_details' | 'view_request_details' | 'view_user_profile' | 'view_contact_info_property' | 'view_contact_info_request'
  | 'execute_manual_property_search' | 'execute_manual_request_search' | 'execute_ai_match_search' | 'execute_ai_find_requests_for_property' | 'execute_ai_find_properties_for_request'
  | 'create_property' | 'update_property' | 'delete_property' | 'create_request' | 'update_request' | 'delete_request'
  | 'create_comment' | 'update_comment' | 'delete_comment' | 'create_crm_contact' | 'update_crm_contact' | 'log_crm_interaction'
  | 'user_login_success' | 'user_login_fail' | 'user_logout' | 'user_registration' | 'password_reset_request' | 'password_reset_success'
  | 'listing_like' | 'listing_dislike' | 'listing_skip' | 'comment_like'
  | 'plan_subscription_change'
  | 'unusual_activity_detected' | 'account_locked_temporarily' | 'admin_action';

    


