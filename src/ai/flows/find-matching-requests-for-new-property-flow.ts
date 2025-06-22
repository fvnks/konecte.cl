'use server';
/**
 * @fileOverview AI flow to find matching property requests for a newly created property.
 * - findMatchingRequestsForNewProperty - Function to trigger the flow.
 * - NewPropertyInput - Input type (defined in shared).
 * - MatchResult - Output type for each match.
 * - FindMatchingRequestsForNewPropertyOutput - Array of MatchResult.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { propertyMatchingPrompt, type PropertyMatchingInput, NewPropertyInputSchema } from '@/ai/shared/property-prompts';
import { getRequestsAction } from '@/actions/requestActions';
import type { SearchRequest } from '@/lib/types';

// Output type for a single match
const MatchResultSchema = z.object({
  requestId: z.string(),
  requestTitle: z.string(),
  requestSlug: z.string(),
  requestAuthorName: z.string().optional(),
  requestAuthorId: z.string().optional(),
  matchScore: z.number(),
  reason: z.string(),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

const FindMatchingRequestsForNewPropertyOutputSchema = z.array(MatchResultSchema);
export type FindMatchingRequestsForNewPropertyOutput = z.infer<typeof FindMatchingRequestsForNewPropertyOutputSchema>;


// Exported function to call the flow
export async function findMatchingRequestsForNewProperty(
  input: z.infer<typeof NewPropertyInputSchema>
): Promise<FindMatchingRequestsForNewPropertyOutput> {
  return findMatchingRequestsForNewPropertyFlow(input);
}

// The Genkit flow
const findMatchingRequestsForNewPropertyFlow = ai.defineFlow(
  {
    name: 'findMatchingRequestsForNewPropertyFlow',
    inputSchema: NewPropertyInputSchema, // Use schema from shared-prompts
    outputSchema: FindMatchingRequestsForNewPropertyOutputSchema,
  },
  async (newProperty) => {
    const activeRequests: SearchRequest[] = await getRequestsAction({ includeInactive: false });
    if (!activeRequests || activeRequests.length === 0) {
      return [];
    }

    const matchPromises = activeRequests.map(async (request) => {
      const propertyDescription = `${newProperty.title}. ${newProperty.description} Ubicada en ${newProperty.city}, ${newProperty.region}. Tipo: ${newProperty.category}. Precio: ${newProperty.price} ${newProperty.currency}. Dormitorios: ${newProperty.bedrooms}. Baños: ${newProperty.bathrooms}. Superficie: ${newProperty.totalAreaSqMeters}m². Características: ${(newProperty.features || []).join(', ')}.`;
      const searchRequestDescription = `${request.title}. ${request.description} Busca en ${request.desiredLocation?.city || 'cualquier ciudad'}, ${request.desiredLocation?.region || 'cualquier región'}. Presupuesto máximo: ${request.budgetMax || 'N/A'}. Tipos deseados: ${request.desiredCategories.join(', ')}. Para: ${request.desiredPropertyType.join(', ')}.`;

      const matchingInput: PropertyMatchingInput = {
        propertyDescription: propertyDescription,
        searchRequest: searchRequestDescription,
      };

      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput);
        if (matchOutput) {
          return {
            requestId: request.id,
            requestTitle: request.title,
            requestSlug: request.slug,
            requestAuthorName: request.author?.name,
            requestAuthorId: request.author?.id,
            matchScore: matchOutput.matchScore,
            reason: matchOutput.reason,
          };
        }
      } catch (e: any) {
        console.error(`Error matching new property ${newProperty.id} with request ${request.id}: ${e.message}`);
      }
      return null;
    });

    let results = (await Promise.all(matchPromises)).filter(Boolean) as MatchResult[];
    results.sort((a, b) => b.matchScore - a.matchScore); 
    
    return results;
  }
);

// Export only type
export type { NewPropertyInput };
