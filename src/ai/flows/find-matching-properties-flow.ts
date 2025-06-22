
'use server';
/**
 * @fileOverview AI flow to find matching properties for a given search request.
 * - findMatchingPropertiesForRequest - Function to trigger the flow.
 * - FindMatchingPropertiesInput - Input type.
 * - FindMatchingPropertiesOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { propertyMatchingPrompt, type PropertyMatchingInput } from '@/ai/shared/property-prompts';
import { getRequestByIdForAdminAction } from '@/actions/requestActions'; // Assuming this fetches enough detail for AI
import { getPropertiesAction } from '@/actions/propertyActions';
import type { SearchRequest, PropertyListing } from '@/lib/types';

// Schemas (internal to this file, not exported as objects)
const FindMatchingPropertiesInputSchema = z.object({
  requestId: z.string().uuid("El ID de la solicitud debe ser un UUID válido."),
});
// Exporting the type is fine
export type FindMatchingPropertiesInput = z.infer<typeof FindMatchingPropertiesInputSchema>;

const PropertyMatchResultSchema = z.object({
  propertyId: z.string(),
  propertyTitle: z.string(),
  propertySlug: z.string(),
  matchScore: z.number(),
  reason: z.string(),
});
// Exporting the type is fine
export type PropertyMatchResult = z.infer<typeof PropertyMatchResultSchema>;

const FindMatchingPropertiesOutputSchema = z.object({
  requestName: z.string(),
  requestSlug: z.string(),
  matches: z.array(PropertyMatchResultSchema),
});
// Exporting the type is fine
export type FindMatchingPropertiesOutput = z.infer<typeof FindMatchingPropertiesOutputSchema>;

// Exported function to call the flow
export async function findMatchingPropertiesForRequest(input: FindMatchingPropertiesInput): Promise<FindMatchingPropertiesOutput> {
  return findMatchingPropertiesFlow(input);
}

// The Genkit flow
const findMatchingPropertiesFlow = ai.defineFlow(
  {
    name: 'findMatchingPropertiesFlow',
    inputSchema: FindMatchingPropertiesInputSchema,
    outputSchema: FindMatchingPropertiesOutputSchema,
  },
  async (input) => {
    const { requestId } = input;

    const request: SearchRequest | null = await getRequestByIdForAdminAction(requestId); // Use admin action for full details
    if (!request) {
      throw new Error(`Solicitud con ID ${requestId} no encontrada.`);
    }

    const activeProperties: PropertyListing[] = await getPropertiesAction({ includeInactive: false });
    if (!activeProperties || activeProperties.length === 0) {
      return { requestName: request.title, requestSlug: request.slug, matches: [] };
    }

    const matchPromises = activeProperties.map(async (property) => {
      const propertyDescription = `${property.title}. ${property.description} Ubicada en ${property.city}, ${property.region}. Tipo: ${property.category}. Precio: ${property.price} ${property.currency}. Dormitorios: ${property.bedrooms}. Baños: ${property.bathrooms}. Superficie: ${property.totalAreaSqMeters}m².`;
      const searchRequestDescription = `${request.title}. ${request.description} Busca en ${request.desiredLocation?.city || 'cualquier ciudad'}, ${request.desiredLocation?.region || 'cualquier región'}. Presupuesto máximo: ${request.budgetMax || 'N/A'}. Tipos deseados: ${request.desiredCategories.join(', ')}. Para: ${request.desiredPropertyType.join(', ')}.`;

      const matchingInput: PropertyMatchingInput = {
        propertyDescription: propertyDescription,
        searchRequest: searchRequestDescription,
      };

      try {
        const { output: matchOutput } = await propertyMatchingPrompt(matchingInput);
        if (matchOutput) {
          return {
            propertyId: property.id,
            propertyTitle: property.title,
            propertySlug: property.slug,
            matchScore: matchOutput.matchScore,
            reason: matchOutput.reason,
          };
        }
      } catch (e: any) {
        console.error(`Error matching request ${request.id} with property ${property.id}: ${e.message}`);
      }
      return null;
    });

    let results = (await Promise.all(matchPromises)).filter(Boolean) as PropertyMatchResult[];
    results.sort((a, b) => b.matchScore - a.matchScore);

    return { requestName: request.title, requestSlug: request.slug, matches: results };
  }
);
