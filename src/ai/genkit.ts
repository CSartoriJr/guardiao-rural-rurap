
import { genkit, type InitPlugins } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase'; // Correct import for Firebase Genkit plugin
import { firebaseConfig, firebaseInitializedCorrectly } from '@/lib/firebase';
import { z } from 'genkit'; // Genkit re-exports Zod's 'z'

const googleApiKey = process.env.GOOGLE_API_KEY;
const genkitPlugins: InitPlugins = [];
let googleAiPluginInitialized = false;
let genkitInitializationError: string | null = null;

if (!firebaseInitializedCorrectly) {
  genkitInitializationError = "[Genkit] Cannot initialize Genkit plugins because Firebase core initialization failed.";
  console.error(genkitInitializationError);
} else {
  // Always initialize the Firebase plugin if Firebase itself is ready.
  // This is crucial for server-side functions (flows) to have context.
  console.log('[Genkit] Initializing Firebase plugin for Genkit.');
  genkitPlugins.push(firebase({
      firestore: {
          // You could specify a specific client here, but by default,
          // it will use the initialized client from @/lib/firebase
      },
      auth: {
          // Likewise for auth
      },
      app: {
          // And for the app itself.
      }
  }));

  // Then, conditionally initialize the Google AI plugin.
  if (googleApiKey) {
    console.log('[Genkit] Initializing Google AI plugin using GOOGLE_API_KEY.');
    try {
      genkitPlugins.push(googleAI({ apiKey: googleApiKey }));
      googleAiPluginInitialized = true;
      console.log('[Genkit] Google AI plugin initialized successfully with API key.');
    } catch (error: any) {
      const message = `[Genkit] Error initializing Google AI plugin with explicit API key: ${error.message}`;
      console.error(message);
      genkitInitializationError = message;
      googleAiPluginInitialized = false;
    }
  } else {
    console.warn(
      '[Genkit] GOOGLE_API_KEY not found. Attempting to initialize Google AI plugin using Application Default Credentials (ADC).'
    );
    try {
      genkitPlugins.push(googleAI());
      googleAiPluginInitialized = true;
      console.log('[Genkit] Google AI plugin initialized successfully (likely via ADC).');
    } catch (error: any) {
      const message = `[Genkit] Error initializing Google AI plugin with ADC: ${error.message}`;
      console.error(message);
      // Do not set genkitInitializationError here, as it's a fallback scenario.
      // The individual flows should handle the case where no model is available.
      googleAiPluginInitialized = false;
    }
  }
}

// Initialize Genkit with the configured plugins.
export const ai = genkit({
  plugins: genkitPlugins,
  // We don't set a default model here anymore.
  // Each prompt should explicitly define the model it needs, e.g., 'googleai/gemini-2.0-flash'.
  // This makes the code more robust if the Google AI plugin fails to initialize.
});

// Export the initialization status and any error message.
// This can be used by flows or UI components to gracefully degrade functionality.
export { googleAiPluginInitialized, genkitInitializationError };
