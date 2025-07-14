import type { Responses } from 'openai/resources/responses';

export type LLMPrompt = Responses.ResponseInput[0];

export type LLMTool = Responses.FunctionTool & {
  // biome-ignore lint/suspicious/noExplicitAny: intended
  handler: (args: any) => Promise<string>;
};
