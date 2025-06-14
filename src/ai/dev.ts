
import { config } from 'dotenv';
config();

import '@/ai/flows/property-matching.ts';
import '@/ai/flows/find-matching-requests-flow.ts';
import '@/ai/flows/find-matching-properties-flow.ts';
import '@/ai/flows/find-listings-for-free-text-search-flow.ts'; // Add the new flow

