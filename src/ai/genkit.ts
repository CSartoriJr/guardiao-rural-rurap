
import {genkit} from 'genkit';
import type {FlowFn, PromptFn} from 'genkit/action';
import {googleAI, GoogleAIPluginParams} from '@genkit-ai/googleai';
import {z} from 'genkit/zod';


const googleApiKey = process.env.GOOGLE_API_KEY;
const genkitPlugins: any[] = [];
let genkitModel: string | undefined = undefined;
let googleAiPluginInitialized = false;

if (googleApiKey) {
  console.log('[Genkit] Initializing Google AI plugin using GOOGLE_API_KEY.');
  const pluginOptions: GoogleAIPluginParams = { apiKey: googleApiKey };
  try {
    genkitPlugins.push(googleAI(pluginOptions));
    genkitModel = 'googleai/gemini-2.0-flash';
    googleAiPluginInitialized = true;
    console.log('[Genkit] Google AI plugin initialized successfully with API key.');
  } catch (error: any) {
    console.error('[Genkit] Error initializing Google AI plugin with explicit API key:', error.message);
  }
}

if (!googleAiPluginInitialized) {
  console.warn(
    '[Genkit] GOOGLE_API_KEY not used or initialization failed. Attempting to initialize Google AI plugin using Application Default Credentials.'
  );
  try {
    genkitPlugins.push(googleAI());
    genkitModel = 'googleai/gemini-2.0-flash';
    googleAiPluginInitialized = true;
    console.log('[Genkit] Google AI plugin initialized successfully (likely via ADC).');
  } catch (error: any) {
    console.error('[Genkit] Critical error initializing Google AI plugin with ADC (GOOGLE_API_KEY not set and ADC likely not found/failed):', error.message);
  }
}

let exportedAi: any;

if (googleAiPluginInitialized) {
  exportedAi = genkit({
    plugins: genkitPlugins,
    model: genkitModel, // This will be 'googleai/gemini-2.0-flash' if plugin loaded
  });
} else {
  console.error("[Genkit] No AI plugins initialized. AI features will be disabled. Using dummy AI object.");
  
  const DUMMY_AI_ERROR_MESSAGE = "AI feature unavailable: Genkit AI plugin not configured.";

  exportedAi = {
    defineFlow: <
      CustomMetadata extends Record<string, any>,
      In extends z.ZodTypeAny,
      Out extends z.ZodTypeAny,
      Stream extends z.ZodTypeAny = z.ZodNever
    >(
      config: {
        name: string;
        inputSchema?: In;
        outputSchema?: Out;
        streamSchema?: Stream;
        metadata?: CustomMetadata;
        [key: string]: any;
      },
      handler: FlowFn<In, Out, Stream>
    ): FlowFn<In, Out, Stream> => {
      console.warn(`[Genkit Dummy] AI Disabled: Flow '${config.name}' defined but will not execute.`);
      return async (input: z.infer<In>): Promise<z.infer<Out>> => {
        console.error(`[Genkit Dummy] ${DUMMY_AI_ERROR_MESSAGE} (Flow: ${config.name})`);
        if (config.outputSchema instanceof z.ZodObject) {
          // Attempt to return a default-like empty object for ZodObject schemas
          // This is a simplification; complex default values might require more specific handling.
          return {} as z.infer<Out>;
        }
        throw new Error(`${DUMMY_AI_ERROR_MESSAGE} (Flow: ${config.name})`);
      };
    },
    
    definePrompt: <
      In extends z.ZodTypeAny = z.ZodAny,
      Out extends z.ZodTypeAny = z.ZodString, // Default output is string if not specified
      CustomMetadata extends Record<string, any> = Record<string, any>
    >(
      config: {
        name: string;
        input?: { schema: In; metadata?: Record<string, any> };
        output?: { schema: Out; metadata?: Record<string, any> };
        prompt?: string | ((input: z.infer<In>) => string | Record<string, any> | Record<string, any>[]);
        tools?: any[]; // Simplified type for tools
        metadata?: CustomMetadata;
        [key: string]: any;
      }
    ): PromptFn<In, Out> => {
      console.warn(`[Genkit Dummy] AI Disabled: Prompt '${config.name}' defined but will not execute.`);
      // Genkit 1.x prompt function returns an object with output, error, etc.
      return async (input: z.infer<In>): Promise<{ output?: z.infer<Out>; error?: any; blocked?: boolean; [key: string]: any; }> => {
        console.error(`[Genkit Dummy] ${DUMMY_AI_ERROR_MESSAGE} (Prompt: ${config.name})`);
        if (config.output?.schema instanceof z.ZodObject) {
          return { output: {} as z.infer<Out>, error: DUMMY_AI_ERROR_MESSAGE };
        }
        return { output: undefined, error: DUMMY_AI_ERROR_MESSAGE };
      };
    },

    generate: async (options: any): Promise<any> => {
      console.error(`[Genkit Dummy] ${DUMMY_AI_ERROR_MESSAGE} (ai.generate)`);
      // Mimic Genkit 1.x generate response structure
      return { 
        candidates: [{
          index: 0,
          finishReason: 'ERROR',
          message: { role: 'model', content: [{ text: DUMMY_AI_ERROR_MESSAGE }] },
        }],
        usage: {},
        model: options.model || 'dummy/model-unavailable',
        request: options,
        error: DUMMY_AI_ERROR_MESSAGE,
        // Helper accessors common in Genkit 1.x
        text: () => DUMMY_AI_ERROR_MESSAGE,
        output: () => undefined, 
      };
    },

    defineTool: (config: any, handler: any): any => {
        console.warn(`[Genkit Dummy] AI Disabled: Tool '${config.name}' defined but will not execute.`);
        return handler; // Return original handler or a dummy that throws
    },
    // defineSchema is just a Zod wrapper, should be fine as is or could be a pass-through
    defineSchema: <T extends z.ZodTypeAny>(name: string, schema: T) : T => {
        // console.warn(`[Genkit Dummy] defineSchema called for '${name}'.`);
        return schema;
    },
    // Add other Genkit functions if they are used and cause issues during build.
    // For example: listModels, start (though start is for dev server)
  };
}

export const ai = exportedAi;
// Exporting googleAiPluginInitialized can be useful for conditional logic elsewhere if needed.
export { googleAiPluginInitialized };
