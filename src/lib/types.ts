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

// Placeholder data for initial UI rendering
export const placeholderUser: User = {
  id: 'user1',
  name: 'Jane Doe',
  avatarUrl: 'https://placehold.co/40x40.png',
};

export const sampleProperties: PropertyListing[] = [
  {
    id: 'prop1',
    title: 'Spacious 3-Bedroom Apartment in Downtown',
    slug: 'spacious-3-bedroom-apartment-downtown',
    description: 'A beautiful and spacious apartment located in the heart of downtown, perfect for families or professionals. Features modern amenities and stunning city views.',
    propertyType: 'rent',
    category: 'apartment',
    price: 2500,
    currency: 'USD',
    address: '123 Main St, Apt 4B',
    city: 'Metropolis',
    country: 'USA',
    bedrooms: 3,
    bathrooms: 2,
    areaSqMeters: 120,
    images: ['https://placehold.co/600x400.png?text=Living+Room', 'https://placehold.co/600x400.png?text=Bedroom+1', 'https://placehold.co/600x400.png?text=Kitchen'],
    author: placeholderUser,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    upvotes: 120,
    commentsCount: 15,
    features: ['Pet-friendly', 'Gym Access', 'Parking Spot'],
  },
  {
    id: 'prop2',
    title: 'Modern House with Garden for Sale',
    slug: 'modern-house-with-garden-for-sale',
    description: 'Newly renovated modern house with a beautiful garden and outdoor space. Ideal for those looking for a quiet and comfortable living environment.',
    propertyType: 'sale',
    category: 'house',
    price: 450000,
    currency: 'USD',
    address: '456 Oak Avenue',
    city: 'Suburbia',
    country: 'USA',
    bedrooms: 4,
    bathrooms: 3,
    areaSqMeters: 200,
    images: ['https://placehold.co/600x400.png?text=Exterior+View', 'https://placehold.co/600x400.png?text=Garden', 'https://placehold.co/600x400.png?text=Master+Bedroom'],
    author: { id: 'user2', name: 'John Smith', avatarUrl: 'https://placehold.co/40x40.png' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    upvotes: 250,
    commentsCount: 30,
    features: ['Large Garden', 'Garage', 'Solar Panels'],
  },
];

export const sampleRequests: SearchRequest[] = [
  {
    id: 'req1',
    title: 'Looking for a 2-bedroom pet-friendly apartment to rent near city center',
    slug: 'looking-for-2-bedroom-pet-friendly-apartment',
    description: 'My partner and I are looking for a 2-bedroom apartment, must be pet-friendly (we have a small dog). Preferably close to public transport and parks. Our budget is around $1800/month.',
    desiredPropertyType: ['rent'],
    desiredCategories: ['apartment', 'condo'],
    desiredLocation: { city: 'Metropolis', neighborhood: 'Downtown' },
    minBedrooms: 2,
    budgetMax: 1800,
    author: { id: 'user3', name: 'Alice Brown', avatarUrl: 'https://placehold.co/40x40.png' },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    commentsCount: 5,
  },
  {
    id: 'req2',
    title: 'Seeking a family house with 3+ bedrooms for purchase in Suburbia',
    slug: 'seeking-family-house-3-bedrooms-suburbia',
    description: 'We are a family of four looking to buy a house in a family-friendly neighborhood in Suburbia. Need at least 3 bedrooms, a yard for kids, and good school district. Budget up to $500,000.',
    desiredPropertyType: ['sale'],
    desiredCategories: ['house'],
    desiredLocation: { city: 'Suburbia' },
    minBedrooms: 3,
    budgetMax: 500000,
    author: placeholderUser,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    commentsCount: 12,
  },
];
