

export interface Role {
  id: string; // ej: admin, editor_contenido
  name: string; // ej: Administrador, Editor de Contenido
  description?: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  password_hash?: string; // Only present when fetched from DB, should not be sent to client
  role_id: string; // FK a Role.id
  role_name?: string; // Nombre del rol (para mostrar en UI, obtenido de un JOIN)
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


// --- DATOS DE EJEMPLO (Se mantendrán para desarrollo/fallback si la BD no está conectada) ---

export const placeholderUser: User = {
  id: 'user1',
  name: 'Juanita Pérez',
  avatarUrl: 'https://placehold.co/40x40.png?text=JP',
  email: 'juanita.perez@example.com',
  role_id: 'user', // Defaulting to 'user' for placeholder, can be admin if needed for testing specific flows
  role_name: 'Usuario'
};

// Los datos de ejemplo como sampleProperties, sampleRequests, sampleUsers, sampleComments han sido eliminados.
// La aplicación ahora dependerá de los datos de la base de datos o mostrará estados vacíos/mensajes apropiados.

