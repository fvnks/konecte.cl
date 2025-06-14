
'use server';
/**
 * @fileOverview AI flow to find matching property listings and search requests
 * for a given free-text user search description.
 * - findListingsForFreeTextSearch - Function to trigger the flow.
 * - FindListingsForFreeTextSearchInput - Input type.
 * - FoundMatch - Union type for a matched property or request.
 * - FindListingsForFreeTextSearchOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { propertyMatchingPrompt, type PropertyMatchingInput } from '@/ai/shared/property-prompts';
import { getPropertiesAction } from '@/actions/propertyActions';
import { getRequestsAction } from '@/actions/requestActions';
import type { PropertyListing, SearchRequest } from '@/lib/types';

// Schemas
export const FindListingsForFreeTextSearchInputSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de búsqueda debe tener al menos 10 caracteres.").max(1000, "La descripción no puede exceder los 1000 caracteres."),
});
export type FindListingsForFreeTextSearchInput = z.infer<typeof FindListingsForFreeTextSearchInputSchema>;

const BaseMatchSchema = z.object({
  matchScore: z.number(),
  reason: z.string(),
});

const MatchedPropertySchema = BaseMatchSchema.extend({
  type: z.literal('property'),
  item: z.custom<PropertyListing>((data) => typeof data === 'object' && data !== null && 'title' in data && 'propertyType' in data), // Basic check
});
export type MatchedProperty = z.infer<typeof MatchedPropertySchema>;

const MatchedRequestSchema = BaseMatchSchema.extend({
  type: z.literal('request'),
  item: z.custom<SearchRequest>((data) => typeof data === 'object' && data !== null && 'title' in data && 'desiredPropertyType' in data), // Basic check
});
export type MatchedRequest = z.infer<typeof MatchedRequestSchema>;

export const FoundMatchSchema = z.union([MatchedPropertySchema, MatchedRequestSchema]);
export type FoundMatch = z.infer<typeof FoundMatchSchema>;

export const FindListingsForFreeTextSearchOutputSchema = z.object({
  matches: z.array(FoundMatchSchema),
});
export type FindListingsForFreeTextSearchOutput = z.infer<typeof FindListingsForFreeTextSearchOutputSchema>;


// Exported function to call the flow
export async function findListingsForFreeTextSearch(input: FindListingsForFreeTextSearchInput): Promise<FindListingsForFreeTextSearchOutput> {
  return findListingsForFreeTextSearchFlow(input);
}

// The Genkit flow
const findListingsForFreeTextSearchFlow = ai.defineFlow(
  {
    name: 'findListingsForFreeTextSearchFlow',
    inputSchema: FindListingsForFreeTextSearchInputSchema,
    outputSchema: FindListingsForFreeTextSearchOutputSchema,
  },
  async (input) => {
    const { userSearchDescription } = input;

    const activeProperties = await getPropertiesAction({ includeInactive: false });
    const activeRequests = await getRequestsAction({ includeInactive: false });

    const allMatches: FoundMatch[] = [];

    // Match against properties
    const propertyMatchPromises = activeProperties.map(async (property) => {
      const propertyText = `${property.title}. ${property.description} Categoría: ${property.category}. Tipo: ${property.propertyType}. Precio: ${property.price} ${property.currency}. Ubicación: ${property.city}, ${property.address}. Dorms: ${property.bedrooms}, Baños: ${property.bathrooms}. Superficie: ${property.areaSqMeters}m². Características: ${property.features?.join(', ')}.`;
      const matchingInput: PropertyMatchingInput = {
        propertyDescription: propertyText,
        searchRequest: userSearchDescription,
      };
      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput);
        if (matchOutput && matchOutput.matchScore > 0.3) { // Threshold to reduce noise
          allMatches.push({
            type: 'property',
            item: property,
            matchScore: matchOutput.matchScore,
            reason: matchOutput.reason,
          });
        }
      } catch (e: any) {
        console.error(`Error matching free text search with property ${property.id}: ${e.message}`);
      }
    });

    // Match against requests
    const requestMatchPromises = activeRequests.map(async (request) => {
      // Here, we treat the user's free-text search as a "hypothetical property"
      // and the existing request as the "search request" for the AI prompt.
      const requestText = `${request.title}. ${request.description} Busca en ${request.desiredLocation?.city}. Presupuesto: ${request.budgetMax}. Tipos: ${request.desiredCategories.join(', ')}. Para: ${request.desiredPropertyType.join(', ')}.`;
      const matchingInput: PropertyMatchingInput = {
        propertyDescription: userSearchDescription, // User's search is the "property"
        searchRequest: requestText,              // Existing request is the "search"
      };
      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput);
        if (matchOutput && matchOutput.matchScore > 0.3) { // Threshold
          allMatches.push({
            type: 'request',
            item: request,
            matchScore: matchOutput.matchScore,
            reason: matchOutput.reason,
          });
        }
      } catch (e: any) {
        console.error(`Error matching free text search with request ${request.id}: ${e.message}`);
      }
    });

    await Promise.all([...propertyMatchPromises, ...requestMatchPromises]);

    allMatches.sort((a, b) => b.matchScore - a.matchScore);

    return { matches: allMatches.slice(0, 10) }; // Return top 10 matches for now
  }
);

