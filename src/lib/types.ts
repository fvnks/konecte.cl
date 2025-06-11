

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
  property_type: PropertyType;
  category: ListingCategory;
  price: number;
  currency: string; // CLP, UF, USD
  address: string;
  city: string; // Ciudad o Comuna
  country: string;
  bedrooms: number;
  bathrooms: number;
  area_sq_meters: number;
  images: string[]; // Podría ser JSON string en DB, parseado en la app
  features?: string[]; // Podría ser JSON string en DB
  slug: string;
  upvotes: number;
  comments_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author?: User; // Para mostrar info del autor, opcionalmente cargado
}

export interface SearchRequest {
  id: string;
  user_id: string; // FK a User.id
  title: string;
  description: string;
  desired_property_type_rent: boolean;
  desired_property_type_sale: boolean;
  desired_category_apartment: boolean;
  desired_category_house: boolean;
  desired_category_condo: boolean;
  desired_category_land: boolean;
  desired_category_commercial: boolean;
  desired_category_other: boolean;
  desired_location_city: string;
  desired_location_neighborhood?: string;
  min_bedrooms?: number;
  min_bathrooms?: number;
  budget_max?: number;
  comments_count: number;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author?: User; // Para mostrar info del autor
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
  id?: number; // PK, solo una fila en la tabla
  sheetId: string | null;
  sheetName: string | null;
  columnsToDisplay: string | null;
  isConfigured: boolean;
}


// --- DATOS DE EJEMPLO (Se mantendrán para desarrollo/fallback si la BD no está conectada) ---

export const initialSampleRoles: Role[] = [
  { id: 'admin', name: 'Administrador', description: 'Acceso total al sistema.' },
  { id: 'user', name: 'Usuario', description: 'Usuario estándar con permisos limitados.' },
];

export const placeholderUser: User = {
  id: 'user1',
  name: 'Juanita Pérez',
  avatarUrl: 'https://placehold.co/40x40.png',
  email: 'juanita.perez@example.com',
  role_id: 'admin', 
  role_name: 'Administrador'
};

export const sampleUsers: User[] = [
  placeholderUser,
  {
    id: 'user2',
    name: 'Pedro Soto',
    avatarUrl: 'https://placehold.co/40x40.png?text=PS',
    email: 'pedro.soto@example.com',
    role_id: 'user',
    role_name: 'Usuario'
  },
  {
    id: 'user3',
    name: 'Ana González',
    avatarUrl: 'https://placehold.co/40x40.png?text=AG',
    email: 'ana.gonzalez@example.com',
    role_id: 'user',
    role_name: 'Usuario'
  },
    {
    id: 'user4',
    name: 'Carlos López',
    avatarUrl: 'https://placehold.co/40x40.png?text=CL',
    email: 'carlos.lopez@example.com',
    role_id: 'user',
    role_name: 'Usuario'
  },
   {
    id: 'user5',
    name: 'Laura Fernández',
    avatarUrl: 'https://placehold.co/40x40.png?text=LF',
    email: 'laura.fernandez@example.com',
    role_id: 'admin',
    role_name: 'Administrador'
  }
];


export const sampleProperties: PropertyListing[] = [
  {
    id: 'prop1',
    user_id: 'user2',
    title: 'Amplio Departamento de 3 Dormitorios en el Centro de Santiago',
    slug: 'amplio-departamento-3-dormitorios-centro-santiago',
    description: 'Un hermoso y espacioso departamento ubicado en el corazón del centro de la ciudad, perfecto para familias o profesionales. Cuenta con comodidades modernas e impresionantes vistas.',
    property_type: 'rent',
    category: 'apartment',
    price: 750000,
    currency: 'CLP',
    address: 'Calle Moneda 123, Apto 4B',
    city: 'Santiago Centro',
    country: 'Chile',
    bedrooms: 3,
    bathrooms: 2,
    area_sq_meters: 120,
    images: ['https://placehold.co/600x400.png?text=Living+Comedor', 'https://placehold.co/600x400.png?text=Dormitorio+1', 'https://placehold.co/600x400.png?text=Cocina'],
    author: sampleUsers.find(u => u.id === 'user2')!,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    upvotes: 120,
    comments_count: 15,
    features: ['Admite mascotas', 'Gimnasio', 'Estacionamiento'],
    is_active: true,
  },
  {
    id: 'prop2',
    user_id: placeholderUser.id,
    title: 'Casa Moderna con Jardín en Venta en Las Condes',
    slug: 'casa-moderna-con-jardin-en-venta-las-condes',
    description: 'Casa moderna recientemente renovada con un hermoso jardín y quincho. Ideal para quienes buscan un entorno de vida tranquilo y confortable en un buen sector.',
    property_type: 'sale',
    category: 'house',
    price: 12500, 
    currency: 'UF',
    address: 'Av. Apoquindo 7890',
    city: 'Las Condes',
    country: 'Chile',
    bedrooms: 4,
    bathrooms: 3,
    area_sq_meters: 200,
    images: ['https://placehold.co/600x400.png?text=Fachada', 'https://placehold.co/600x400.png?text=Jardin+Quincho', 'https://placehold.co/600x400.png?text=Dormitorio+Principal'],
    author: placeholderUser, 
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    upvotes: 250,
    comments_count: 30,
    features: ['Gran jardín', 'Estacionamiento', 'Piscina', 'Quincho'],
    is_active: true,
  },
];

export const sampleRequests: SearchRequest[] = [
  {
    id: 'req1',
    user_id: 'user3',
    title: 'Busco depto de 2 dormitorios que admita mascotas para arrendar en Providencia',
    slug: 'busco-depto-2-dormitorios-admite-mascotas-providencia',
    description: 'Mi pareja y yo buscamos un departamento de 2 dormitorios, debe admitir mascotas (tenemos un perrito). Preferiblemente cerca del Metro y parques. Nuestro presupuesto es alrededor de $650.000 mensuales.',
    desired_property_type_rent: true,
    desired_property_type_sale: false,
    desired_category_apartment: true,
    desired_category_condo: true,
    desired_category_house: false,
    desired_category_land: false,
    desired_category_commercial: false,
    desired_category_other: false,
    desired_location_city: 'Providencia', 
    desired_location_neighborhood: 'Sector Pedro de Valdivia',
    minBedrooms: 2,
    budget_max: 650000,
    author: sampleUsers.find(u => u.id === 'user3')!,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    comments_count: 5,
    is_active: true,
  },
  {
    id: 'req2',
    user_id: placeholderUser.id,
    title: 'Busco casa familiar con más de 3 dormitorios para comprar en Ñuñoa o La Reina',
    slug: 'busco-casa-familiar-3-dormitorios-nunoa-la-reina',
    description: 'Somos una familia de cuatro que busca comprar una casa en un barrio familiar en Ñuñoa o La Reina. Necesitamos al menos 3 dormitorios, patio para los niños y un buen sector. Presupuesto hasta 10.000 UF.',
    desired_property_type_rent: false,
    desired_property_type_sale: true,
    desired_category_house: true,
    desired_category_apartment: false,
    desired_category_condo: false,
    desired_category_land: false,
    desired_category_commercial: false,
    desired_category_other: false,
    desired_location_city: 'Ñuñoa',
    minBedrooms: 3,
    budget_max: 10000,
    author: placeholderUser,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    comments_count: 12,
    is_active: true,
  },
];

// Las funciones simuladas de localStorage se eliminarán ya que usaremos la base de datos.
// El manejo de la configuración de Google Sheets se hará mediante Server Actions que interactuarán con la BD.
