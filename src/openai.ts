import { OpenAI } from 'openai';

import { config } from './config.js';

export const openaiClient = new OpenAI({
  apiKey: config.openaiApiKey,
});
