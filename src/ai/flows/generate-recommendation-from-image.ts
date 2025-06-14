
'use server';
/**
 * @fileOverview AI-powered recommendation generator for technicians based on cassava type and submitted photos.
 * It also attempts to extract GPS coordinates if they are visibly present on the images.
 *
 * - generateRecommendation - A function that generates recommendation drafts and extracts GPS.
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
      "A panoramic photo of the cassava plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image may contain visible GPS coordinates."
    ),
  photoDataUri2: z
    .string()
    .describe(
      "A photo showing leaf roll or brooming symptoms, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  photoDataUri3: z
    .string()
    .describe(
      "A photo of the plant's tip cut, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  plantedArea: z.number().optional().describe('The total planted area in hectares.'),
  infectedArea: z.number().optional().describe('The infected area in hectares.'),
});
export type GenerateRecommendationInput = z.infer<typeof GenerateRecommendationInputSchema>;

const GenerateRecommendationOutputSchema = z.object({
  recommendation: z.string().describe('The agricultural recommendation for the cassava plant.'),
  extractedLatitude: z.number().optional().describe('The latitude extracted by the AI from visible text on the image, if found.'),
  extractedLongitude: z.number().optional().describe('The longitude extracted by the AI from visible text on the image, if found.'),
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
Your task is to provide a detailed recommendation for the farmer and attempt to extract GPS coordinates if they are visibly printed on the images.

Plant Information:
- Classification: {{#if isMandioca}}Mandioca{{/if}}{{#if isMacaxeira}}{{#if isMandioca}} and {{/if}}Macaxeira{{/if}}{{^if isMandioca}}{{^if isMacaxeira}}Not specified{{/if}}{{/if}}
- Variety: {{{cassavaType}}}
{{#if plantedArea}}- Planted Area: {{{plantedArea}}} hectares{{/if}}
{{#if infectedArea}}- Infected Area: {{{infectedArea}}} hectares (out of {{{plantedArea}}} ha planted){{/if}}

Images Provided:
- Photo 1 (Panoramic): {{media url=photoDataUri1}}
- Photo 2 (Leaf Roll/Brooming): {{media url=photoDataUri2}}
- Photo 3 (Tip Cut): {{media url=photoDataUri3}}

Instructions:
1.  **GPS Coordinate Extraction**: Carefully examine all submitted images, especially 'Photo 1 (Panoramic)'. Look for any text overlay or embedded information that clearly indicates GPS Latitude and Longitude values (e.g., as added by apps like NoteCam).
    *   If you find valid numerical Latitude and Longitude values, parse them. Latitude should be between -90 and 90. Longitude should be between -180 and 180.
    *   Populate the 'extractedLatitude' and 'extractedLongitude' fields in your output if coordinates are successfully parsed. If not found or unclear, leave them undefined.

2.  **Agricultural Recommendation**: Based on the plant classification, variety, submitted photos, and area information:
    *   Consider the proportion of infected area to planted area if provided.
    *   If you successfully extracted GPS coordinates, consider if this location information (e.g. general climate of Amapá, Brazil, or common regional pests/diseases if broadly known for that region based on the coordinates) can refine your diagnosis or recommendation. State if you are using this information.
    *   Provide a clear, actionable recommendation.
    *   If a disease is suspected, name it and suggest specific control measures (organic or chemical, with dosages if appropriate).
    *   If the plant appears healthy, state that and recommend best practices for continued health and productivity.
    *   If the images are inconclusive for a definitive diagnosis, explain why and suggest what additional information or photos might be needed.

Output Format: Ensure your response strictly adheres to the JSON schema for 'extractedLatitude', 'extractedLongitude', and 'recommendation'.
`,
});

const generateRecommendationFlow = ai.defineFlow(
  {
    name: 'generateRecommendationFlow',
    inputSchema: GenerateRecommendationInputSchema,
    outputSchema: GenerateRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure that if coordinates are present, they are numbers, not strings from LLM.
    // The Zod schema should handle this during parsing if the LLM provides strings,
    // but an explicit check/conversion might be added here if issues arise.
    return output!;
  }
);

