
'use server';
/**
 * @fileOverview AI flow to find matching property requests for a given property.
 * - findMatchingRequestsForProperty - Function to trigger the flow.
 * - FindMatchingRequestsInput - Input type.
 * - FindMatchingRequestsOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Use z from genkit or 'zod'
import { propertyMatchingPrompt, type PropertyMatchingInput } from '@/ai/shared/property-prompts';
import { getPropertyByIdForAdminAction } from '@/actions/propertyActions';
import { getRequestsAction } from '@/actions/requestActions';
import type { PropertyListing, SearchRequest } from '@/lib/types';

// Schemas (internal to this file, not exported as objects)
const FindMatchingRequestsInputSchema = z.object({
  propertyId: z.string().uuid("El ID de la propiedad debe ser un UUID válido."),
});
// Exporting the type is fine
export type FindMatchingRequestsInput = z.infer<typeof FindMatchingRequestsInputSchema>;

const MatchResultSchema = z.object({
  requestId: z.string(),
  requestTitle: z.string(),
  requestSlug: z.string(),
  matchScore: z.number(),
  reason: z.string(),
});
// Exporting the type is fine
export type MatchResult = z.infer<typeof MatchResultSchema>;

const FindMatchingRequestsOutputSchema = z.object({
  propertyName: z.string(),
  propertySlug: z.string(),
  matches: z.array(MatchResultSchema),
});
// Exporting the type is fine
export type FindMatchingRequestsOutput = z.infer<typeof FindMatchingRequestsOutputSchema>;

// Exported function to call the flow
export async function findMatchingRequestsForProperty(input: FindMatchingRequestsInput): Promise<FindMatchingRequestsOutput> {
  return findMatchingRequestsFlow(input);
}

// The Genkit flow
const findMatchingRequestsFlow = ai.defineFlow(
  {
    name: 'findMatchingRequestsFlow',
    inputSchema: FindMatchingRequestsInputSchema, // Use internal schema
    outputSchema: FindMatchingRequestsOutputSchema, // Use internal schema
  },
  async (input) => {
    const { propertyId } = input;

    const property: PropertyListing | null = await getPropertyByIdForAdminAction(propertyId);
    if (!property) {
      throw new Error(`Propiedad con ID ${propertyId} no encontrada.`);
    }

    const activeRequests: SearchRequest[] = await getRequestsAction({ includeInactive: false });
    if (!activeRequests || activeRequests.length === 0) {
      return { propertyName: property.title, propertySlug: property.slug, matches: [] };
    }

    const matchPromises = activeRequests.map(async (request) => {
      const matchingInput: PropertyMatchingInput = {
        propertyDescription: `${property.title}. ${property.description} Ubicada en ${property.city}, ${property.region}. Tipo: ${property.category}. Precio: ${property.price} ${property.currency}. Dormitorios: ${property.bedrooms}. Baños: ${property.bathrooms}. Superficie: ${property.totalAreaSqMeters}m².`,
        searchRequest: `${request.title}. ${request.description} Busca en ${request.desiredLocation?.city || 'cualquier ciudad'}, ${request.desiredLocation?.region || 'cualquier región'}. Presupuesto máximo: ${request.budgetMax || 'N/A'}. Tipos deseados: ${request.desiredCategories.join(', ')}. Para: ${request.desiredPropertyType.join(', ')}.`,
      };
      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput); 
        if (matchOutput) {
          return {
            requestId: request.id,
            requestTitle: request.title,
            requestSlug: request.slug,
            matchScore: matchOutput.matchScore,
            reason: matchOutput.reason,
          };
        }
      } catch (e: any) {
        console.error(`Error matching property ${property.id} with request ${request.id}: ${e.message}`);
      }
      return null;
    });

    let results = (await Promise.all(matchPromises)).filter(Boolean) as MatchResult[];
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    return { propertyName: property.title, propertySlug: property.slug, matches: results };
  }
);

// Ensure only types are exported besides the main async function for this 'use server' module
// Types are already exported individually above.
