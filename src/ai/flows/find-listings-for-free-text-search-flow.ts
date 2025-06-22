
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
import { 
  propertyMatchingPrompt, 
  type PropertyMatchingInput,
  FindListingsForFreeTextSearchInputSchema,
  FindListingsForFreeTextSearchOutputSchema,
  FoundMatchSchema
} from '@/ai/shared/property-prompts';
import { getPropertiesAction } from '@/actions/propertyActions';
import { getRequestsAction } from '@/actions/requestActions';
import type { PropertyListing, SearchRequest } from '@/lib/types';

// Types are derived from imported schemas
export type FindListingsForFreeTextSearchInput = z.infer<typeof FindListingsForFreeTextSearchInputSchema>;
export type FoundMatch = z.infer<typeof FoundMatchSchema>;
export type FindListingsForFreeTextSearchOutput = z.infer<typeof FindListingsForFreeTextSearchOutputSchema>;


// Exported function to call the flow
export async function findListingsForFreeTextSearch(input: FindListingsForFreeTextSearchInput): Promise<FindListingsForFreeTextSearchOutput> {
  return findListingsForFreeTextSearchFlow(input);
}

// Helper to safely get string value or default
const s = (value: any, def: string = ''): string => (value === null || value === undefined) ? def : String(value);
const sj = (arr: string[] | undefined | null, def: string = 'ninguna'): string => (arr && arr.length > 0) ? arr.join(', ') : def;


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
      const propertyText = `Título: ${s(property.title)}. Descripción: ${s(property.description)}. Categoría: ${s(property.category)}. Tipo: ${s(property.propertyType)}. Precio: ${s(property.price)} ${s(property.currency)}. Ubicación: ${s(property.address)}, ${s(property.city)}, ${s(property.region)}. Dorms: ${s(property.bedrooms, 'N/A')}, Baños: ${s(property.bathrooms, 'N/A')}. Superficie: ${s(property.totalAreaSqMeters, 'N/A')}m². Características: ${sj(property.features)}.`;
      const matchingInput: PropertyMatchingInput = {
        propertyDescription: propertyText,
        searchRequest: userSearchDescription,
      };
      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput);
        if (matchOutput && matchOutput.matchScore > 0.3) { 
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
      const requestText = `Título: ${s(request.title)}. Descripción: ${s(request.description)}. Busca en ${s(request.desiredLocation?.city, 'cualquier ciudad')}, ${s(request.desiredLocation?.region, 'cualquier región')}. Presupuesto: ${s(request.budgetMax, 'N/A')}. Tipos: ${sj(request.desiredCategories)}. Para: ${sj(request.desiredPropertyType)}.`;
      const matchingInput: PropertyMatchingInput = {
        propertyDescription: userSearchDescription, 
        searchRequest: requestText,              
      };
      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput);
        if (matchOutput && matchOutput.matchScore > 0.3) { 
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

    return { matches: allMatches.slice(0, 10) }; 
  }
);
