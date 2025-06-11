
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
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
  currency: string; // CLP, UF, USD
  address: string;
  city: string; // Ciudad o Comuna
  country: string;
  bedrooms: number;
  bathrooms: number;
  areaSqMeters: number;
  images: string[];
  author: User;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  commentsCount: number;
  features?: string[]; // e.g., "Estacionamiento", "Piscina", "Bodega"
  slug: string;
}

export interface SearchRequest {
  id: string;
  title: string;
  description: string;
  desiredPropertyType: PropertyType[];
  desiredCategories: ListingCategory[];
  desiredLocation: {
    city: string; // Ciudad o Comuna
    country?: string;
    neighborhood?: string; // Barrio o Sector
  };
  minBedrooms?: number;
  minBathrooms?: number;
  budgetMin?: number;
  budgetMax?: number; // En CLP o UF
  author: User;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
  slug: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  parentId?: string | null;
  createdAt: string;
  upvotes: number;
}

export interface GoogleSheetConfig {
  sheetId: string;
  sheetName: string;
  columnsToDisplay: string;
  isConfigured: boolean;
}

export const placeholderUser: User = {
  id: 'user1',
  name: 'Juanita Pérez',
  avatarUrl: 'https://placehold.co/40x40.png',
};

export const sampleProperties: PropertyListing[] = [
  {
    id: 'prop1',
    title: 'Amplio Departamento de 3 Dormitorios en el Centro de Santiago',
    slug: 'amplio-departamento-3-dormitorios-centro-santiago',
    description: 'Un hermoso y espacioso departamento ubicado en el corazón del centro de la ciudad, perfecto para familias o profesionales. Cuenta con comodidades modernas e impresionantes vistas.',
    propertyType: 'rent',
    category: 'apartment',
    price: 750000,
    currency: 'CLP',
    address: 'Calle Moneda 123, Apto 4B',
    city: 'Santiago Centro',
    country: 'Chile',
    bedrooms: 3,
    bathrooms: 2,
    areaSqMeters: 120,
    images: ['https://placehold.co/600x400.png?text=Living+Comedor', 'https://placehold.co/600x400.png?text=Dormitorio+1', 'https://placehold.co/600x400.png?text=Cocina'],
    author: placeholderUser,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    upvotes: 120,
    commentsCount: 15,
    features: ['Admite mascotas', 'Gimnasio', 'Estacionamiento'],
  },
  {
    id: 'prop2',
    title: 'Casa Moderna con Jardín en Venta en Las Condes',
    slug: 'casa-moderna-con-jardin-en-venta-las-condes',
    description: 'Casa moderna recientemente renovada con un hermoso jardín y quincho. Ideal para quienes buscan un entorno de vida tranquilo y confortable en un buen sector.',
    propertyType: 'sale',
    category: 'house',
    price: 12500, // UF
    currency: 'UF',
    address: 'Av. Apoquindo 7890',
    city: 'Las Condes',
    country: 'Chile',
    bedrooms: 4,
    bathrooms: 3,
    areaSqMeters: 200,
    images: ['https://placehold.co/600x400.png?text=Fachada', 'https://placehold.co/600x400.png?text=Jardin+Quincho', 'https://placehold.co/600x400.png?text=Dormitorio+Principal'],
    author: { id: 'user2', name: 'Pedro Soto', avatarUrl: 'https://placehold.co/40x40.png' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    upvotes: 250,
    commentsCount: 30,
    features: ['Gran jardín', 'Estacionamiento', 'Piscina', 'Quincho'],
  },
];

export const sampleRequests: SearchRequest[] = [
  {
    id: 'req1',
    title: 'Busco depto de 2 dormitorios que admita mascotas para arrendar en Providencia',
    slug: 'busco-depto-2-dormitorios-admite-mascotas-providencia',
    description: 'Mi pareja y yo buscamos un departamento de 2 dormitorios, debe admitir mascotas (tenemos un perrito). Preferiblemente cerca del Metro y parques. Nuestro presupuesto es alrededor de $650.000 mensuales.',
    desiredPropertyType: ['rent'],
    desiredCategories: ['apartment', 'condo'],
    desiredLocation: { city: 'Providencia', neighborhood: 'Sector Pedro de Valdivia' },
    minBedrooms: 2,
    budgetMax: 650000,
    author: { id: 'user3', name: 'Ana González', avatarUrl: 'https://placehold.co/40x40.png' },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    commentsCount: 5,
  },
  {
    id: 'req2',
    title: 'Busco casa familiar con más de 3 dormitorios para comprar en Ñuñoa o La Reina',
    slug: 'busco-casa-familiar-3-dormitorios-nunoa-la-reina',
    description: 'Somos una familia de cuatro que busca comprar una casa en un barrio familiar en Ñuñoa o La Reina. Necesitamos al menos 3 dormitorios, patio para los niños y un buen sector. Presupuesto hasta 10.000 UF.',
    desiredPropertyType: ['sale'],
    desiredCategories: ['house'],
    desiredLocation: { city: 'Ñuñoa' }, // Podría ser más específico en la descripción
    minBedrooms: 3,
    budgetMax: 10000, // Asumiendo UF
    author: placeholderUser,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    commentsCount: 12,
  },
];

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
  return {
    sheetId: 'TU_SHEET_ID_POR_DEFECTO_AQUI',
    sheetName: 'Hoja1',
    columnsToDisplay: 'Nombre,Email,Teléfono',
    isConfigured: false,
  };
}

export function saveMockSheetConfig(config: GoogleSheetConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_SHEET_CONFIG_KEY, JSON.stringify({...config, isConfigured: true}));
  }
}
