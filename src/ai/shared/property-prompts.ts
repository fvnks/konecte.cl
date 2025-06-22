
// src/ai/shared/property-prompts.ts
// This file does NOT use 'use server'
import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Use z from genkit if it's re-exporting zod, otherwise use 'zod'
import type { PropertyListing, SearchRequest, PropertyType as LibPropertyType, ListingCategory as LibListingCategory, OrientationType as LibOrientationType } from '@/lib/types';
import { orientationValues } from '@/lib/types';

export const PropertyMatchingInputSchema = z.object({
  propertyDescription: z.string().describe('Description of the property listing.'),
  searchRequest: z.string().describe('User search request for a property.'),
});
export type PropertyMatchingInput = z.infer<typeof PropertyMatchingInputSchema>;

export const PropertyMatchingOutputSchema = z.object({
  matchScore: z.number().describe('A score indicating how well the property listing matches the search request (0-1).'),
  reason: z.string().describe('Explanation of why the property listing matches the search request.'),
});
export type PropertyMatchingOutput = z.infer<typeof PropertyMatchingOutputSchema>;

export const propertyMatchingPrompt = ai.definePrompt({
  name: 'propertyMatchingPrompt',
  input: { schema: PropertyMatchingInputSchema },
  output: { schema: PropertyMatchingOutputSchema },
  prompt: `You are an AI assistant that matches property listings with user search requests.

  Analyze the property description and search request to determine how well they match.
  Provide a match score between 0 and 1, where 1 indicates a perfect match.
  Also, provide a reason for the match score.

  Property Description: {{{propertyDescription}}}
  Search Request: {{{searchRequest}}}`,
});


// Schemas for FindListingsForFreeTextSearch flow
export const FindListingsForFreeTextSearchInputSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de búsqueda debe tener al menos 10 caracteres.").max(1000, "La descripción no puede exceder los 1000 caracteres."),
});

const BaseMatchSchema = z.object({
  matchScore: z.number(),
  reason: z.string(),
});

// propertyItemFields and requestItemFields are not directly used by the schemas below,
// but can be useful if we decide to make the `item` schema more specific later.
// For now, using z.custom<PropertyListing> and z.custom<SearchRequest> is simpler.

export const MatchedPropertySchema = BaseMatchSchema.extend({
  type: z.literal('property'),
  item: z.custom<PropertyListing>((data) => { 
    return typeof data === 'object' && data !== null && 'id' in data && 'title' in data && 'propertyType' in data;
  }).describe("The full property listing object that matched."),
});

export const MatchedRequestSchema = BaseMatchSchema.extend({
  type: z.literal('request'),
  item: z.custom<SearchRequest>((data) => { 
    return typeof data === 'object' && data !== null && 'id' in data && 'title' in data && 'desiredPropertyType' in data;
  }).describe("The full search request object that matched."),
});


export const FoundMatchSchema = z.union([MatchedPropertySchema, MatchedRequestSchema]);

export const FindListingsForFreeTextSearchOutputSchema = z.object({
  matches: z.array(FoundMatchSchema),
});


// --- Schemas for Auto-Matching Flows ---

// Schema for the input of findMatchingRequestsForNewPropertyFlow
export const NewPropertyInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  propertyType: z.enum(['rent', 'sale'] as [LibPropertyType, ...LibPropertyType[]]),
  category: z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other'] as [LibListingCategory, ...LibListingCategory[]]),
  price: z.number(),
  currency: z.string(),
  address: z.string(),
  city: z.string(),
  region: z.string(),
  country: z.string(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  totalAreaSqMeters: z.number(),
  usefulAreaSqMeters: z.number().optional().nullable(),
  parkingSpaces: z.number().int().min(0).optional(),
  petsAllowed: z.boolean().optional(),
  furnished: z.boolean().optional(),
  commercialUseAllowed: z.boolean().optional(),
  hasStorage: z.boolean().optional(),
  orientation: z.enum(orientationValues).optional().nullable(),
  features: z.array(z.string()).optional(),
});
export type NewPropertyInput = z.infer<typeof NewPropertyInputSchema>;

// Schema for the input of findMatchingPropertiesForNewRequestFlow
export const NewRequestInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  desiredPropertyType: z.array(z.enum(['rent', 'sale'] as [LibPropertyType, ...LibPropertyType[]])),
  desiredCategories: z.array(z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other'] as [LibListingCategory, ...LibListingCategory[]])),
  desiredLocationCity: z.string(),
  desiredLocationRegion: z.string(),
  desiredLocationNeighborhood: z.string().optional(),
  minBedrooms: z.number().optional(),
  minBathrooms: z.number().optional(),
  budgetMax: z.number().optional(),
});
export type NewRequestInput = z.infer<typeof NewRequestInputSchema>;


// Type exports for the new schemas (if needed externally, otherwise types in flow files are sufficient)
export type FindListingsForFreeTextSearchInput = z.infer<typeof FindListingsForFreeTextSearchInputSchema>;
export type MatchedProperty = z.infer<typeof MatchedPropertySchema>;
export type MatchedRequest = z.infer<typeof MatchedRequestSchema>;
export type FoundMatch = z.infer<typeof FoundMatchSchema>;
export type FindListingsForFreeTextSearchOutput = z.infer<typeof FindListingsForFreeTextSearchOutputSchema>;
