import type { Context } from 'hono';
import * as z from 'zod';

import { openaiClient } from '../openai.js';
import { weatherTool } from '../tools/weather.js';

const BodyValidator = z.object({
  userMessage: z.string().min(1),
});

const tools = [weatherTool];

export async function handlePostMessage(c: Context) {
  const { userMessage } = BodyValidator.parse(await c.req.json());

  const response = await openaiClient.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    tools,
  });
  const result = response.output[0]; // type = message | function_call

  return c.json(result);
}
