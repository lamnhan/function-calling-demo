import type { LLMTool } from '../types.js';

export const emailTool: LLMTool = {
  type: 'function',
  name: 'send_email',
  description: 'Send an email to a given recipient with a subject and message.',
  parameters: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'The recipient email address.',
      },
      subject: {
        type: 'string',
        description: 'Email subject line.',
      },
      body: {
        type: 'string',
        description: 'Body of the email message.',
      },
    },
    required: ['to', 'subject', 'body'],
    additionalProperties: false,
  },
  strict: true,
  handler: sendEmail,
};

async function sendEmail(payload: {
  to: string;
  subject: string;
  body: string;
}) {
  // NOTE: for the sake of the demo, we'll just return a success message after a delay
  const result = {
    noteForLLM: 'The email is sent successfully using the email tool.',
    emailPayload: payload,
  };
  return new Promise<string>((resolve) => {
    setTimeout(() => resolve(JSON.stringify(result, null, 2)), 2000);
  });
}
