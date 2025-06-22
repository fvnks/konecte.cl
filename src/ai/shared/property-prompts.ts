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
  prompt: `You are an expert real estate matchmaking AI for a Chilean platform called "konecte". Your task is to compare a property listing with a user's search request and determine how well they match.

**Scoring Guidelines:**
- **Score 1.0 (Perfect Match):** All key criteria (location, category, type, price, rooms) match perfectly.
- **Score 0.7-0.9 (Strong Match):** Location, category, and transaction type match. Price is within budget. Minor differences in features or room count might exist.
- **Score 0.4-0.6 (Potential Match):** A key criterion like location or category matches, but there are significant differences in others (e.g., price is slightly over budget, or it's a house instead of a condo in the same area).
- **Score 0.0-0.3 (Poor Match):** Fundamental criteria like location (city/region) or transaction type (rent vs. sale) do not match.

**Matching Rules:**
1.  **Location is Key:** A match in the same city/region is critical. Give this high importance.
2.  **Transaction Type Must Match:** A 'rent' property cannot match a 'sale' request, and vice-versa. This is a deal-breaker.
3.  **Category Matters:** 'House' and 'Apartment' in the same area are strong matches. 'Land' and 'House' are poor matches.
4.  **Price & Budget:**
    - If the property price is **less than or equal to** the request's maximum budget, it's a good match on price.
    - If the property price is **slightly above** (e.g., within 10%) the budget, it's a potential match (lower score).
    - If the property price is **significantly above** the budget, it's a poor match.
    - If the request has no budget, evaluate based on other factors.
5.  **Rooms:** A property with **more** rooms than the requested minimum is a good match. A property with **fewer** rooms is a poor match.

**Your Task:**
Analyze the following Property Listing and Search Request. Provide a \`matchScore\` from 0.0 to 1.0 and a brief \`reason\` explaining your score based on the rules above.

---
**Property Listing:**
{{{propertyDescription}}}
---
**Search Request:**
{{{searchRequest}}}
---`,
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
