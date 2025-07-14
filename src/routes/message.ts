import type { Context } from 'hono';
import * as z from 'zod';

import { openaiClient } from '../openai.js';
import { emailTool } from '../tools/email.js';
import { weatherTool } from '../tools/weather.js';

import type { LLMPrompt } from '../types.js';

const TOOLS = [weatherTool, emailTool];

const Validator = z.object({
  userMessage: z.string().min(1),
  withToolCall: z
    .object({
      name: z.string().min(1),
      arguments: z.string(),
    })
    .optional(),
});

export async function handlePostMessage(c: Context) {
  const { userMessage, withToolCall } = Validator.parse(await c.req.json());

  // build the prompt for the LLM
  const prompt: LLMPrompt = !withToolCall
    ? {
        role: 'user',
        content: userMessage,
      }
    : {
        role: 'system',
        content: await handleToolCall(userMessage, withToolCall),
      };

  // request a response from the LLM
  const response = await openaiClient.responses.create({
    model: 'gpt-4o-mini',
    input: [prompt],
    tools: prompt.role === 'system' ? undefined : TOOLS,
  });

  // NOTE: for demo purpose, only use the first response from the LLM
  return c.json(response.output[0]);
}

async function handleToolCall(
  userMessage: string,
  withToolCall: { name: string; arguments: string },
) {
  const tool = TOOLS.find((tool) => tool.name === withToolCall.name);
  const args = JSON.parse(withToolCall.arguments);
  const toolResult = !tool ? '' : await tool.handler(args);
  console.info(`[TOOL CALL] <${withToolCall.name}> ${toolResult}`);
  return `You are a helpful assistant that answers requests based on the user's request and the system data.

If the user's request is not related to the system data or you don't have the information to answer the question, try the best to answer with your own knowledge, if you don't have the information, say some apologetic message.

Please use markdown to format your response.

<user-request>
${userMessage}
</user-request>

<system-data>
${toolResult}
</system-data>
`;
}
