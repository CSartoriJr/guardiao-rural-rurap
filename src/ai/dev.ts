
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recommendation-from-image.ts';
import '@/ai/flows/update-user-by-admin.ts'; // Add new flow
import '@/ai/flows/create-user-document.ts';
