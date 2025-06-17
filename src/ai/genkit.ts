
import { genkit, type InitPlugins, type FlowFn, type PromptFn } from 'genkit';
import { googleAI, GoogleAIPluginParams } from '@genkit-ai/googleai';
import { z } from 'genkit'; // Genkit re-exports Zod's 'z'

const googleApiKey = process.env.GOOGLE_API_KEY;
const genkitPlugins: InitPlugins = [];
let genkitModel: string | undefined = undefined;
let googleAiPluginInitialized = false;
let genkitInitializationError: string | null = null;

if (googleApiKey) {
  console.log('[Genkit] Initializing Google AI plugin using GOOGLE_API_KEY.');
  try {
    genkitPlugins.push(googleAI({ apiKey: googleApiKey }));
    genkitModel = 'googleai/gemini-2.0-flash'; // A default model
    googleAiPluginInitialized = true;
    console.log('[Genkit] Google AI plugin initialized successfully with API key.');
  } catch (error: any) {
    const message = `[Genkit] Error initializing Google AI plugin with explicit API key: ${error.message}`;
    console.error(message);
    genkitInitializationError = message; // Store the error message
    googleAiPluginInitialized = false; // Ensure flag is false on error
  }
} else {
  console.warn(
    '[Genkit] GOOGLE_API_KEY not found. Attempting to initialize Google AI plugin using Application Default Credentials.'
  );
  try {
    genkitPlugins.push(googleAI());
    genkitModel = 'googleai/gemini-2.0-flash'; // A default model
    googleAiPluginInitialized = true;
    console.log('[Genkit] Google AI plugin initialized successfully (likely via ADC).');
  } catch (error: any) {
    const message = `[Genkit] Error initializing Google AI plugin with ADC: ${error.message}`;
    console.error(message);
    // genkitInitializationError is not set here if we fallback to genkit without plugins
    googleAiPluginInitialized = false; // Ensure flag is false on error
  }
}

// Always initialize Genkit.
// If plugins are empty (e.g., googleAiPluginInitialized is false), 
// Genkit will be initialized but might not have models for generation.
export const ai = genkit({
  plugins: genkitPlugins,
  // Conditionally set a default model only if the Google AI plugin was successfully initialized.
  // Otherwise, let Genkit handle the absence of a model (it should error at generation time).
  model: googleAiPluginInitialized ? genkitModel : undefined,
  // It's crucial that flows/prompts using this `ai` instance implement try/catch
  // to handle errors if no model is available for generation (e.g., if googleAiPluginInitialized is false).
});

// Export the initialization status and any error message.
// This can be used by flows or UI components to gracefully degrade functionality.
export { googleAiPluginInitialized, genkitInitializationError };
