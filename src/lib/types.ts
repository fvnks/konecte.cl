
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string; // Optional, might not be public
}

export type PropertyType = 'rent' | 'sale';
export type ListingCategory = 'apartment' | 'house' | 'condo' | 'land' | 'commercial' | 'other';

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  category: ListingCategory;
  price: number;
  currency: string;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  areaSqMeters: number;
  images: string[]; // URLs
  author: User;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  upvotes: number;
  commentsCount: number;
  features?: string[]; // e.g., "Parking", "Pool", "Pet-friendly"
  slug: string;
}

export interface SearchRequest {
  id: string;
  title: string;
  description: string;
  desiredPropertyType: PropertyType[]; // Can be looking for rent or sale
  desiredCategories: ListingCategory[];
  desiredLocation: {
    city: string;
    country?: string;
    neighborhood?: string;
  };
  minBedrooms?: number;
  minBathrooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  author: User;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  commentsCount: number;
  slug: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  parentId?: string | null; // For threaded comments
  createdAt: string; // ISO Date string
  upvotes: number;
}

export interface GoogleSheetConfig {
  sheetId: string;
  sheetName: string;
  columnsToDisplay: string; // Comma-separated column letters or headers e.g., "A,B,C" or "Nombre,Email,Telefono"
  isConfigured: boolean;
}

// Placeholder data for initial UI rendering
export const placeholderUser: User = {
  id: 'user1',
  name: 'Jane Doe',
  avatarUrl: 'https://placehold.co/40x40.png',
};

export const sampleProperties: PropertyListing[] = [
  {
    id: 'prop1',
    title: 'Amplio Apartamento de 3 Habitaciones en el Centro',
    slug: 'amplio-apartamento-3-habitaciones-centro',
    description: 'Un hermoso y espacioso apartamento ubicado en el corazón del centro de la ciudad, perfecto para familias o profesionales. Cuenta con comodidades modernas y impresionantes vistas de la ciudad.',
    propertyType: 'rent',
    category: 'apartment',
    price: 2500,
    currency: 'USD',
    address: 'Calle Principal 123, Apto 4B',
    city: 'Metrópolis',
    country: 'EE.UU.',
    bedrooms: 3,
    bathrooms: 2,
    areaSqMeters: 120,
    images: ['https://placehold.co/600x400.png?text=Sala+de+Estar', 'https://placehold.co/600x400.png?text=Habitacion+1', 'https://placehold.co/600x400.png?text=Cocina'],
    author: placeholderUser,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // Hace 2 días
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // Hace 1 día
    upvotes: 120,
    commentsCount: 15,
    features: ['Admite mascotas', 'Acceso al gimnasio', 'Plaza de aparcamiento'],
  },
  {
    id: 'prop2',
    title: 'Casa Moderna con Jardín en Venta',
    slug: 'casa-moderna-con-jardin-en-venta',
    description: 'Casa moderna recientemente renovada con un hermoso jardín y espacio al aire libre. Ideal para quienes buscan un entorno de vida tranquilo y confortable.',
    propertyType: 'sale',
    category: 'house',
    price: 450000,
    currency: 'USD',
    address: 'Avenida del Roble 456',
    city: 'Suburbia',
    country: 'EE.UU.',
    bedrooms: 4,
    bathrooms: 3,
    areaSqMeters: 200,
    images: ['https://placehold.co/600x400.png?text=Vista+Exterior', 'https://placehold.co/600x400.png?text=Jardin', 'https://placehold.co/600x400.png?text=Habitacion+Principal'],
    author: { id: 'user2', name: 'John Smith', avatarUrl: 'https://placehold.co/40x40.png' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // Hace 5 días
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // Hace 2 días
    upvotes: 250,
    commentsCount: 30,
    features: ['Gran jardín', 'Garaje', 'Paneles solares'],
  },
];

export const sampleRequests: SearchRequest[] = [
  {
    id: 'req1',
    title: 'Busco apartamento de 2 habitaciones que admita mascotas para alquilar cerca del centro',
    slug: 'busco-apartamento-2-habitaciones-admite-mascotas',
    description: 'Mi pareja y yo buscamos un apartamento de 2 habitaciones, debe admitir mascotas (tenemos un perro pequeño). Preferiblemente cerca del transporte público y parques. Nuestro presupuesto es de alrededor de $1800/mes.',
    desiredPropertyType: ['rent'],
    desiredCategories: ['apartment', 'condo'],
    desiredLocation: { city: 'Metrópolis', neighborhood: 'Centro' },
    minBedrooms: 2,
    budgetMax: 1800,
    author: { id: 'user3', name: 'Alice Brown', avatarUrl: 'https://placehold.co/40x40.png' },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // Hace 1 día
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    commentsCount: 5,
  },
  {
    id: 'req2',
    title: 'Busco casa familiar con más de 3 habitaciones para comprar en Suburbia',
    slug: 'busco-casa-familiar-3-habitaciones-suburbia',
    description: 'Somos una familia de cuatro que busca comprar una casa en un barrio familiar en Suburbia. Necesitamos al menos 3 habitaciones, un patio para los niños y un buen distrito escolar. Presupuesto hasta $500,000.',
    desiredPropertyType: ['sale'],
    desiredCategories: ['house'],
    desiredLocation: { city: 'Suburbia' },
    minBedrooms: 3,
    budgetMax: 500000,
    author: placeholderUser,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // Hace 3 días
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    commentsCount: 12,
  },
];

// Simulación de la configuración de Google Sheet que se guardaría
// En una aplicación real, esto se almacenaría en una base de datos o archivo de configuración seguro.
export const MOCK_SHEET_CONFIG_KEY = 'mockGoogleSheetConfig';

export function getMockSheetConfig(): GoogleSheetConfig | null {
  if (typeof window !== 'undefined') {
    const storedConfig = localStorage.getItem(MOCK_SHEET_CONFIG_KEY);
    if (storedConfig) {
      try {
        return JSON.parse(storedConfig) as GoogleSheetConfig;
      } catch (error) {
        console.error("Error parsing mock sheet config from localStorage", error);
        return null;
      }
    }
  }
  // Retorna una configuración por defecto si no hay nada o si es SSR
  return {
    sheetId: 'TU_SHEET_ID_POR_DEFECTO_AQUI',
    sheetName: 'Hoja1',
    columnsToDisplay: 'Nombre,Email,Teléfono', // Nombres de encabezados esperados
    isConfigured: false, // Inicialmente no configurado para forzar la configuración en el admin
  };
}

export function saveMockSheetConfig(config: GoogleSheetConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_SHEET_CONFIG_KEY, JSON.stringify({...config, isConfigured: true}));
  }
}
