'use server';
/**
 * @fileOverview AI-powered recommendation generator for technicians based on cassava type and submitted photos.
 *
 * - generateRecommendation - A function that generates recommendation drafts.
 * - GenerateRecommendationInput - The input type for the generateRecommendation function.
 * - GenerateRecommendationOutput - The return type for the generateRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecommendationInputSchema = z.object({
  cassavaType: z.string().describe('The type of cassava.'),
  photoDataUri1: z
    .string()
    .describe(
      "A photo of the cassava plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  photoDataUri2: z
    .string()
    .describe(
      "A photo of the cassava plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  photoDataUri3: z
    .string()
    .describe(
      "A photo of the cassava plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateRecommendationInput = z.infer<typeof GenerateRecommendationInputSchema>;

const GenerateRecommendationOutputSchema = z.object({
  recommendation: z.string().describe('The recommendation for the cassava plant.'),
});
export type GenerateRecommendationOutput = z.infer<typeof GenerateRecommendationOutputSchema>;

export async function generateRecommendation(
  input: GenerateRecommendationInput
): Promise<GenerateRecommendationOutput> {
  return generateRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecommendationPrompt',
  input: {schema: GenerateRecommendationInputSchema},
  output: {schema: GenerateRecommendationOutputSchema},
  prompt: `You are an expert agricultural technician specializing in cassava plants. Based on the cassava type and submitted photos, provide a recommendation for the farmer.

Cassava Type: {{{cassavaType}}}

Photo 1: {{media url=photoDataUri1}}
Photo 2: {{media url=photoDataUri2}}
Photo 3: {{media url=photoDataUri3}}

Recommendation: `,
});

const generateRecommendationFlow = ai.defineFlow(
  {
    name: 'generateRecommendationFlow',
    inputSchema: GenerateRecommendationInputSchema,
    outputSchema: GenerateRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
