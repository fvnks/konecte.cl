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
  parent_id?: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  author?: User;
}

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

const baseContactSchema = {
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  company_name: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(contactStatusValues).default('new'),
  source: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
};

export const addContactFormSchema = z.object(baseContactSchema);
export type AddContactFormValues = z.infer<typeof addContactFormSchema>;

export const editContactFormSchema = z.object(baseContactSchema); // Can be identical or diverge later
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
  interaction_date: string;
  subject?: string | null;
  description: string;
  outcome?: string | null;
  follow_up_needed: boolean;
  follow_up_date?: string | null; // Date only
  created_at: string;
  updated_at: string;
  contact_name?: string; // For display purposes, joined from contacts table
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
