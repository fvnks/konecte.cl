
'use server';

/**
 * @fileOverview AI-powered property matching flow.
 *
 * - propertyMatching - A function that matches property listings with search requests.
 * - PropertyMatchingInput - The input type for the propertyMatching function.
 * - PropertyMatchingOutput - The return type for the propertyMatching function.
 */

import { ai } from '@/ai/genkit';
import {
  PropertyMatchingInputSchema,
  PropertyMatchingOutputSchema,
  propertyMatchingPrompt,
  type PropertyMatchingInput,
  type PropertyMatchingOutput
} from '@/ai/shared/property-prompts';

// The original flow for direct 1-to-1 matching
const propertyMatchingFlow = ai.defineFlow(
  {
    name: 'propertyMatchingFlow',
    inputSchema: PropertyMatchingInputSchema,
    outputSchema: PropertyMatchingOutputSchema,
  },
  async input => {
    const {output} = await propertyMatchingPrompt(input);
    return output!;
  }
);

export async function propertyMatching(input: PropertyMatchingInput): Promise<PropertyMatchingOutput> {
  return propertyMatchingFlow(input);
}

// Export only types from this 'use server' module, besides the main async function
export type { PropertyMatchingInput, PropertyMatchingOutput };
