
// src/ai/shared/property-prompts.ts
// This file does NOT use 'use server'
import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Use z from genkit if it's re-exporting zod, otherwise use 'zod'

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
