
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recommendation-from-image.ts';
import '@/ai/flows/update-user-by-admin.ts';
import '@/ai/flows/create-user-document.ts';
import '@/ai/flows/create-external-user.ts';
import '@/ai/flows/reset-user-password-by-admin.ts';
