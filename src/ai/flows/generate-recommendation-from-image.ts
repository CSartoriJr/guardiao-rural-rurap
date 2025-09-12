'use server';
/**
 * @fileOverview AI-powered assistant for technicians. It processes cassava type, submitted photos,
 * and optionally, device-provided GPS coordinates. It attempts to extract GPS from images if not provided by the device,
 * and determines the Amapá municipality based on the coordinates.
 *
 * - generateRecommendation - A function that extracts/confirms GPS and determines municipality. (Note: Name kept for now, but recommendation text is removed)
 * - GenerateRecommendationInput - The input type for the generateRecommendation function.
 * - GenerateRecommendationOutput - The return type for the generateRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { amapaMunicipalities } from '@/lib/mockData';
import type { SoilTexture, VegetationType } from '@/types';

// Input now accepts photo URLs from Firebase Storage instead of Data URIs directly
const GenerateRecommendationInputSchema = z.object({
  mandiocaVariety: z.string().optional().describe('The variety of the mandioca plant, if specified (e.g., BRS Formosa).'),
  macaxeiraVariety: z.string().optional().describe('The variety of the macaxeira plant, if specified (e.g., Vassourinha).'),
  isMandioca: z.boolean().optional().describe('Indicates if the plant is classified as Mandioca.'),
  isMacaxeira: z.boolean().optional().describe('Indicates if the plant is classified as Macaxeira.'),
  photoDataUri1: z // Kept name for compatibility, but this will be a URL
    .string()
    .url({ message: "Photo URL 1 must be a valid URL."})
    .describe(
      "A panoramic photo of the cassava plant, as a public URL (e.g., from Firebase Storage). This image may contain visible GPS coordinates."
    ),
  photoDataUri2: z // Kept name for compatibility, but this will be a URL
    .string()
    .url({ message: "Photo URL 2 must be a valid URL."})
    .describe(
      "A photo showing leaf roll or brooming symptoms, as a public URL."
    ),
  photoDataUri3: z // Kept name for compatibility, but this will be a URL
    .string()
    .url({ message: "Photo URL 3 must be a valid URL."})
    .describe(
      "A photo of the plant's tip cut, as a public URL."
    ),
  mandiocaPlantedArea: z.number().optional().describe('The total planted area of mandioca in hectares.'),
  mandiocaInfectedArea: z.number().optional().describe('The infected area of mandioca in hectares.'),
  macaxeiraPlantedArea: z.number().optional().describe('The total planted area of macaxeira in hectares.'),
  macaxeiraInfectedArea: z.number().optional().describe('The infected area of macaxeira in hectares.'),
  deviceLatitude: z.number().optional().describe('GPS Latitude provided by the farmer\'s device, if available. Numerical value between -90 and 90.'),
  deviceLongitude: z.number().optional().describe('GPS Longitude provided by the farmer\'s device, if available. Numerical value between -180 and 180.'),
  soilTexture: z.enum(["Arenoso", "Argiloso", "Textura Média"]).optional().describe('The soil texture of the planting area.'),
  vegetationType: z.enum(["Mata (Floresta)", "Cerrado"]).optional().describe('The type of vegetation in the area.'),
});
export type GenerateRecommendationInput = z.infer<typeof GenerateRecommendationInputSchema>;

const GenerateRecommendationOutputSchema = z.object({
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
Your task is to determine the GPS coordinates and identify the Amapá municipality based on the provided plant information and images.

Valid Amapá Municipalities: ${amapaMunicipalities.join(', ')}.

Plant Information:
- Classification: {{#if isMandioca}}Mandioca{{/if}}{{#if isMacaxeira}}{{#if isMandioca}} & {{/if}}Macaxeira{{/if}}{{^if isMandioca}}{{^if isMacaxeira}}Not specified{{/if}}{{/if}}
{{#if isMandioca}}
- Variety (Mandioca): {{{mandiocaVariety}}}
{{#if mandiocaPlantedArea}}- Planted Area (Mandioca): {{{mandiocaPlantedArea}}} hectares{{/if}}
{{#if mandiocaInfectedArea}}- Infected Area (Mandioca): {{{mandiocaInfectedArea}}} hectares{{/if}}
{{/if}}
{{#if isMacaxeira}}
- Variety (Macaxeira): {{{macaxeiraVariety}}}
{{#if macaxeiraPlantedArea}}- Planted Area (Macaxeira): {{{macaxeiraPlantedArea}}} hectares{{/if}}
{{#if macaxeiraInfectedArea}}- Infected Area (Macaxeira): {{{macaxeiraInfectedArea}}} hectares{{/if}}
{{/if}}
{{#if soilTexture}}- Soil Texture: {{{soilTexture}}}{{/if}}
{{#if vegetationType}}- Vegetation Type: {{{vegetationType}}}{{/if}}

Images Provided (as URLs):
- Photo 1 (Panoramic): {{media url=photoDataUri1}}
- Photo 2 (Leaf Roll/Brooming): {{media url=photoDataUri2}}
- Photo 3 (Tip Cut): {{media url=photoDataUri3}}

Device-Provided GPS (if available, for fallback use):
{{#if deviceLatitude}}- Device Latitude: {{{deviceLatitude}}}{{else}}- Device Latitude: Not provided{{/if}}
{{#if deviceLongitude}}- Device Longitude: {{{deviceLongitude}}}{{else}}- Device Longitude: Not provided{{/if}}

Instructions:
1.  **GPS Coordinate Determination**:
    *   **Priority 1: Image Extraction**: First, carefully examine 'Photo 1 (Panoramic)'. Look for any text overlay or embedded information that clearly indicates GPS Latitude and Longitude values. If you find clearly visible and valid numerical Latitude and Longitude values on the photo, you MUST use these as the primary coordinates.
    *   **Priority 2: Device-Provided GPS (Fallback)**: If and only if you CANNOT extract valid coordinates from 'Photo 1', then use the 'Device Latitude' and 'Device Longitude' if they are provided and appear valid (numerical, within range -90 to 90 for lat, -180 to 180 for lon).
    *   Populate the 'extractedLatitude' and 'extractedLongitude' fields in your JSON output with the determined numerical coordinates. Latitude must be a number between -90 and 90. Longitude must be a number between -180 and 180.
    *   If no valid GPS coordinates can be determined from either the image or the device, ensure 'extractedLatitude' and 'extractedLongitude' are omitted or set to null. Do not invent or estimate coordinates.

2.  **Municipality Determination (Amapá)**:
    *   Based on the 'extractedLatitude' and 'extractedLongitude' you determined:
        *   If the coordinates fall within the state of Amapá, Brazil, identify which of the following municipalities it belongs to: ${amapaMunicipalities.join(', ')}.
        *   Populate the 'determinedMunicipality' field with the name of the Amapá municipality.
        *   If the coordinates are in Amapá but the exact municipality is unclear from the list, you may assign "Macapá" if it's a plausible central location or if no other information is available.
        *   If the coordinates are clearly outside Amapá, or if a specific Amapá municipality cannot be determined from the provided list even if the location seems to be in Amapá, leave the 'determinedMunicipality' field blank/undefined. Do not guess a municipality if unsure.

Output Format: Ensure your response strictly adheres to the JSON schema for 'extractedLatitude', 'extractedLongitude', and 'determinedMunicipality'.
`,
});

const generateRecommendationFlow = ai.defineFlow(
  {
    name: 'generateRecommendationFlow',
    inputSchema: GenerateRecommendationInputSchema,
    outputSchema: GenerateRecommendationOutputSchema,
  },
  async (input): Promise<GenerateRecommendationOutput> => {
    try {
      // Log the input being sent to the AI to verify URLs
      console.log('[AI Flow] Input to generateRecommendationPrompt:', JSON.stringify(input, null, 2));
      
      const result = await prompt(input);

      if (result && result.output) {
        console.log('[AI Flow] Output from prompt:', JSON.stringify(result.output, null, 2));
        return {
          extractedLatitude: result.output.extractedLatitude,
          extractedLongitude: result.output.extractedLongitude,
          determinedMunicipality: result.output.determinedMunicipality,
        };
      } else {
        console.error(
          '[generateRecommendationFlow] AI prompt did not return a valid output structure for location data. Result:',
          JSON.stringify(result, null, 2)
        );
        let errorInfo = "Falha ao obter dados de localização da IA. A estrutura da resposta foi inesperada ou incompleta.";
        if (result && (result as any).error) {
            errorInfo += ` Erro da IA: ${(result as any).error}`;
        } else if (result && (result as any).blocked) {
            errorInfo += ` Conteúdo bloqueado pela IA.`;
        }
        return {};
      }
    } catch (error: any) {
      console.error('[generateRecommendationFlow] Error during AI prompt execution for location data:', error.message ? error.message : error, error);
      return {};
    }
  }
);
