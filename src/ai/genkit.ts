
import {genkit} from 'genkit';
import {googleAI, GoogleAIPluginParams} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_API_KEY;
const genkitPlugins = [];
let genkitModel: string | undefined = undefined;

if (googleApiKey) {
  console.log('[Genkit] Initializing Google AI plugin using GOOGLE_API_KEY.');
  const pluginOptions: GoogleAIPluginParams = { apiKey: googleApiKey };
  try {
    genkitPlugins.push(googleAI(pluginOptions));
    genkitModel = 'googleai/gemini-2.0-flash';
    console.log('[Genkit] Google AI plugin initialized successfully with API key.');
  } catch (error: any) {
    console.error('[Genkit] Error initializing Google AI plugin with explicit API key:', error.message);
  }
} else {
  console.warn(
    '[Genkit] GOOGLE_API_KEY is not set. Attempting to initialize Google AI plugin using Application Default Credentials. ' +
    'If ADC is not configured, AI features may not work or an error may occur.'
  );
  try {
    // Attempt to initialize; it will use ADC or throw if no auth method is found.
    genkitPlugins.push(googleAI());
    genkitModel = 'googleai/gemini-2.0-flash'; // Assume if it doesn't throw, it might work
    console.log('[Genkit] Google AI plugin initialized successfully (likely via ADC or other implicit means).');
  } catch (error: any) {
    console.error('[Genkit] Critical error initializing Google AI plugin (GOOGLE_API_KEY not set and ADC likely not found/failed):', error.message);
    // Do not add the plugin if it errors out here. `plugins` array will be empty.
    // `genkitModel` will remain undefined.
  }
}

export const ai = genkit({
  plugins: genkitPlugins,
  model: genkitModel, // Default model only if a Google AI plugin was successfully added.
});
