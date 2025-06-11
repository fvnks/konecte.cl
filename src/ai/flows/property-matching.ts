'use server';

/**
 * @fileOverview AI-powered property matching flow.
 *
 * - propertyMatching - A function that matches property listings with search requests.
 * - PropertyMatchingInput - The input type for the propertyMatching function.
 * - PropertyMatchingOutput - The return type for the propertyMatching function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyMatchingInputSchema = z.object({
  propertyDescription: z.string().describe('Description of the property listing.'),
  searchRequest: z.string().describe('User search request for a property.'),
});
export type PropertyMatchingInput = z.infer<typeof PropertyMatchingInputSchema>;

const PropertyMatchingOutputSchema = z.object({
  matchScore: z.number().describe('A score indicating how well the property listing matches the search request (0-1).'),
  reason: z.string().describe('Explanation of why the property listing matches the search request.'),
});
export type PropertyMatchingOutput = z.infer<typeof PropertyMatchingOutputSchema>;

export async function propertyMatching(input: PropertyMatchingInput): Promise<PropertyMatchingOutput> {
  return propertyMatchingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyMatchingPrompt',
  input: {schema: PropertyMatchingInputSchema},
  output: {schema: PropertyMatchingOutputSchema},
  prompt: `You are an AI assistant that matches property listings with user search requests.

  Analyze the property description and search request to determine how well they match.
  Provide a match score between 0 and 1, where 1 indicates a perfect match.
  Also, provide a reason for the match score.

  Property Description: {{{propertyDescription}}}
  Search Request: {{{searchRequest}}}`,
});

const propertyMatchingFlow = ai.defineFlow(
  {
    name: 'propertyMatchingFlow',
    inputSchema: PropertyMatchingInputSchema,
    outputSchema: PropertyMatchingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
