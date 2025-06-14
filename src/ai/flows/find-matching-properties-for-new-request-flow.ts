
'use server';
/**
 * @fileOverview AI flow to find matching properties for a newly created search request.
 * - findMatchingPropertiesForNewRequest - Function to trigger the flow.
 * - NewRequestInput - Input type (defined in shared).
 * - PropertyMatchResult - Output type for each match.
 * - FindMatchingPropertiesForNewRequestOutput - Array of PropertyMatchResult.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { propertyMatchingPrompt, type PropertyMatchingInput, NewRequestInputSchema } from '@/ai/shared/property-prompts';
import { getPropertiesAction } from '@/actions/propertyActions';
import type { PropertyListing } from '@/lib/types';

// Output type for a single match
const PropertyMatchResultSchema = z.object({
  propertyId: z.string(),
  propertyTitle: z.string(),
  propertySlug: z.string(),
  propertyAuthorName: z.string().optional(),
  propertyAuthorId: z.string().optional(),
  matchScore: z.number(),
  reason: z.string(),
});
export type PropertyMatchResult = z.infer<typeof PropertyMatchResultSchema>;

const FindMatchingPropertiesForNewRequestOutputSchema = z.array(PropertyMatchResultSchema);
export type FindMatchingPropertiesForNewRequestOutput = z.infer<typeof FindMatchingPropertiesForNewRequestOutputSchema>;

// Exported function to call the flow
export async function findMatchingPropertiesForNewRequest(
  input: z.infer<typeof NewRequestInputSchema>
): Promise<FindMatchingPropertiesForNewRequestOutput> {
  return findMatchingPropertiesForNewRequestFlow(input);
}

// The Genkit flow
const findMatchingPropertiesForNewRequestFlow = ai.defineFlow(
  {
    name: 'findMatchingPropertiesForNewRequestFlow',
    inputSchema: NewRequestInputSchema, // Use schema from shared-prompts
    outputSchema: FindMatchingPropertiesForNewRequestOutputSchema,
  },
  async (newRequest) => {
    const activeProperties: PropertyListing[] = await getPropertiesAction({ includeInactive: false });
    if (!activeProperties || activeProperties.length === 0) {
      return [];
    }

    const matchPromises = activeProperties.map(async (property) => {
      const propertyDescription = `${property.title}. ${property.description} Ubicada en ${property.city}. Tipo: ${property.category}. Precio: ${property.price} ${property.currency}. Dormitorios: ${property.bedrooms}. Baños: ${property.bathrooms}. Superficie: ${property.areaSqMeters}m².`;
      const searchRequestDescription = `${newRequest.title}. ${newRequest.description} Busca en ${newRequest.desiredLocationCity || 'cualquier ciudad'}. Presupuesto máximo: ${newRequest.budgetMax || 'N/A'}. Tipos deseados: ${newRequest.desiredCategories.join(', ')}. Para: ${newRequest.desiredPropertyType.join(', ')}.`;

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
            propertyAuthorName: property.author?.name,
            propertyAuthorId: property.author?.id,
            matchScore: matchOutput.matchScore,
            reason: matchOutput.reason,
          };
        }
      } catch (e: any) {
        console.error(`Error matching new request ${newRequest.id} with property ${property.id}: ${e.message}`);
      }
      return null;
    });

    let results = (await Promise.all(matchPromises)).filter(Boolean) as PropertyMatchResult[];
    results.sort((a, b) => b.matchScore - a.matchScore); // Sort by best match

    return results;
  }
);

// Export only type
export type { NewRequestInput };
