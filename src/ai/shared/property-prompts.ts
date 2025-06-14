
// src/ai/shared/property-prompts.ts
// This file does NOT use 'use server'
import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Use z from genkit if it's re-exporting zod, otherwise use 'zod'
import type { PropertyListing, SearchRequest } from '@/lib/types';

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


// Schemas for FindListingsForFreeTextSearch flow (moved from the flow file)
export const FindListingsForFreeTextSearchInputSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de búsqueda debe tener al menos 10 caracteres.").max(1000, "La descripción no puede exceder los 1000 caracteres."),
});

const BaseMatchSchema = z.object({
  matchScore: z.number(),
  reason: z.string(),
});

// Making item schemas more robust by explicitly defining expected fields, even if custom is used for now.
// This helps ensure the AI is guided towards a structure that matches PropertyListing or SearchRequest.
const propertyItemFields = {
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  propertyType: z.enum(['rent', 'sale']),
  category: z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other']),
  price: z.number(),
  currency: z.string(),
  city: z.string(),
  // Add other essential fields that the AI *must* return for a property
};

const requestItemFields = {
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  desiredPropertyType: z.array(z.enum(['rent', 'sale'])),
  desiredCategories: z.array(z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other'])),
  // Add other essential fields for a request
};


export const MatchedPropertySchema = BaseMatchSchema.extend({
  type: z.literal('property'),
  item: z.custom<PropertyListing>((data) => { // Use z.custom for complex objects
    // Basic validation, can be expanded
    return typeof data === 'object' && data !== null && 'id' in data && 'title' in data && 'propertyType' in data;
  }).describe("The full property listing object that matched."),
});

export const MatchedRequestSchema = BaseMatchSchema.extend({
  type: z.literal('request'),
  item: z.custom<SearchRequest>((data) => { // Use z.custom for complex objects
    return typeof data === 'object' && data !== null && 'id' in data && 'title' in data && 'desiredPropertyType' in data;
  }).describe("The full search request object that matched."),
});


export const FoundMatchSchema = z.union([MatchedPropertySchema, MatchedRequestSchema]);

export const FindListingsForFreeTextSearchOutputSchema = z.object({
  matches: z.array(FoundMatchSchema),
});

// Types are still derived and can be exported from the flow file or here.
// Let's keep type exports in flow files for consistency if they are specific to that flow's output.
// Type exports for the new schemas (if needed externally, otherwise types in flow files are sufficient)
export type FindListingsForFreeTextSearchInput = z.infer<typeof FindListingsForFreeTextSearchInputSchema>;
export type MatchedProperty = z.infer<typeof MatchedPropertySchema>;
export type MatchedRequest = z.infer<typeof MatchedRequestSchema>;
export type FoundMatch = z.infer<typeof FoundMatchSchema>;
export type FindListingsForFreeTextSearchOutput = z.infer<typeof FindListingsForFreeTextSearchOutputSchema>;

