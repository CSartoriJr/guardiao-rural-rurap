
'use server';
/**
 * @fileOverview AI-powered recommendation generator for technicians based on cassava type, submitted photos,
 * and optionally, device-provided GPS coordinates. It attempts to extract GPS from images if not provided by the device,
 * and determines the Amapá municipality based on the coordinates.
 *
 * - generateRecommendation - A function that generates recommendation drafts, extracts/confirms GPS, and determines municipality.
 * - GenerateRecommendationInput - The input type for the generateRecommendation function.
 * - GenerateRecommendationOutput - The return type for the generateRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { amapaMunicipalities } from '@/lib/mockData';

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
  deviceLatitude: z.number().optional().describe('GPS Latitude provided by the farmer\'s device, if available. Numerical value between -90 and 90.'),
  deviceLongitude: z.number().optional().describe('GPS Longitude provided by the farmer\'s device, if available. Numerical value between -180 and 180.'),
});
export type GenerateRecommendationInput = z.infer<typeof GenerateRecommendationInputSchema>;

const GenerateRecommendationOutputSchema = z.object({
  recommendation: z.string().describe('The agricultural recommendation for the cassava plant.'),
  extractedLatitude: z.coerce.number().optional().describe('The latitude confirmed or extracted by the AI. Must be a numerical value between -90 and 90. Prioritizes device-provided coordinates if available, otherwise attempts extraction from images.'),
  extractedLongitude: z.coerce.number().optional().describe('The longitude confirmed or extracted by the AI. Must be a numerical value between -180 and 180. Prioritizes device-provided coordinates if available, otherwise attempts extraction from images.'),
  determinedMunicipality: z.string().optional().describe(`The Amapá municipality determined by the AI based on the extracted GPS coordinates. If coordinates are within Amapá, choose one from this list: ${amapaMunicipalities.join(', ')}. If coordinates are outside Amapá or municipality cannot be definitively determined from the list, leave this field blank/undefined. If coordinates seem to be in Amapá but the precise municipality is unclear, assign the most likely one (e.g., "Macapá" for a central or unknown location within Amapá).`),
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
  prompt: `You are an expert agricultural technician specializing in cassava plants (mandioca/macaxeira) in the state of Amapá, Brazil.
Your task is to provide a detailed recommendation for the farmer, determine the GPS coordinates, and identify the municipality in Amapá.

Valid Amapá Municipalities: ${amapaMunicipalities.join(', ')}.

Plant Information:
- Classification: {{#if isMandioca}}Mandioca{{/if}}{{#if isMacaxeira}}{{#if isMandioca}} and {{/if}}Macaxeira{{/if}}{{^if isMandioca}}{{^if isMacaxeira}}Not specified{{/if}}{{/if}}
- Variety: {{{cassavaType}}}
{{#if plantedArea}}- Planted Area: {{{plantedArea}}} hectares{{/if}}
{{#if infectedArea}}- Infected Area: {{{infectedArea}}} hectares (out of {{{plantedArea}}} ha planted){{/if}}

Images Provided:
- Photo 1 (Panoramic): {{media url=photoDataUri1}}
- Photo 2 (Leaf Roll/Brooming): {{media url=photoDataUri2}}
- Photo 3 (Tip Cut): {{media url=photoDataUri3}}

Device-Provided GPS (if available):
{{#if deviceLatitude}}- Device Latitude: {{{deviceLatitude}}}{{else}}- Device Latitude: Not provided{{/if}}
{{#if deviceLongitude}}- Device Longitude: {{{deviceLongitude}}}{{else}}- Device Longitude: Not provided{{/if}}

Instructions:
1.  **GPS Coordinate Determination**:
    *   **Priority**: If 'Device Latitude' and 'Device Longitude' are provided and appear valid (numerical, within range -90 to 90 for lat, -180 to 180 for lon), use these as the primary coordinates.
    *   **Image Extraction (Fallback)**: If device coordinates are *not* provided or are clearly invalid, then carefully examine 'Photo 1 (Panoramic)'. Look for any text overlay or embedded information that clearly indicates GPS Latitude and Longitude values.
    *   If you find clearly visible numerical Latitude and Longitude values on 'Photo 1 (Panoramic)', parse them directly as numbers.
    *   Populate the 'extractedLatitude' and 'extractedLongitude' fields in your JSON output with the determined numerical coordinates. Latitude must be a number between -90 and 90. Longitude must be a number between -180 and 180.
    *   If no valid GPS coordinates can be determined, ensure 'extractedLatitude' and 'extractedLongitude' are omitted or set to null. Do not invent or estimate coordinates.

2.  **Municipality Determination (Amapá)**:
    *   Based on the 'extractedLatitude' and 'extractedLongitude' you determined:
        *   If the coordinates fall within the state of Amapá, Brazil, identify which of the following municipalities it belongs to: ${amapaMunicipalities.join(', ')}.
        *   Populate the 'determinedMunicipality' field with the name of the Amapá municipality.
        *   If the coordinates are in Amapá but the exact municipality is unclear from the list, you may assign "Macapá" if it's a plausible central location or if no other information is available.
        *   If the coordinates are clearly outside Amapá, or if a specific Amapá municipality cannot be determined from the provided list even if the location seems to be in Amapá, leave the 'determinedMunicipality' field blank/undefined. Do not guess a municipality if unsure.

3.  **Agricultural Recommendation**: Based on the plant classification, variety, submitted photos, area information, determined GPS coordinates, and the 'determinedMunicipality' (if any):
    *   Consider the proportion of infected area to planted area if provided.
    *   If you determined a municipality, consider if this location information can refine your diagnosis or recommendation. State if you are using this information.
    *   Provide a clear, actionable recommendation.
    *   If a disease is suspected, name it and suggest specific control measures.
    *   If the plant appears healthy, state that and recommend best practices.
    *   If the images are inconclusive, explain why.

Output Format: Ensure your response strictly adheres to the JSON schema for 'extractedLatitude', 'extractedLongitude', 'determinedMunicipality', and 'recommendation'.
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
    return output!;
  }
);

