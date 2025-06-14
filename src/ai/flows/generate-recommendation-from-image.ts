
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
  cassavaType: z.string().describe('The variety of the cassava plant (e.g., BRS Formosa, Vassourinha).'),
  isMandioca: z.boolean().optional().describe('Indicates if the plant is classified as Mandioca.'),
  isMacaxeira: z.boolean().optional().describe('Indicates if the plant is classified as Macaxeira.'),
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
  plantedArea: z.number().optional().describe('The total planted area in hectares.'),
  infectedArea: z.number().optional().describe('The infected area in hectares.'),
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
  prompt: `You are an expert agricultural technician specializing in cassava plants (mandioca/macaxeira).
Based on the plant classification, variety, submitted photos, and area information, provide a detailed recommendation for the farmer.

Plant Classification: {{#if isMandioca}}Mandioca{{/if}}{{#if isMacaxeira}}{{#if isMandioca}} e {{/if}}Macaxeira{{/if}}{{^if isMandioca}}{{^if isMacaxeira}}Não especificado{{/if}}{{/if}}
Plant Variety: {{{cassavaType}}}
{{#if plantedArea}}Planted Area: {{{plantedArea}}} hectares{{/if}}
{{#if infectedArea}}Infected Area: {{{infectedArea}}} hectares{{/if}}

Photo 1 (Panoramic): {{media url=photoDataUri1}}
Photo 2 (Leaf Roll/Brooming): {{media url=photoDataUri2}}
Photo 3 (Tip Cut): {{media url=photoDataUri3}}

Consider the proportion of infected area to planted area if provided.
Provide a clear, actionable recommendation. If a disease is suspected, name it and suggest control measures.
If the plant appears healthy, state that and recommend best practices for continued health.
If the images are inconclusive, suggest what additional information or photos might be needed.

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
