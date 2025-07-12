import type { Context } from 'hono';
import type { HTTPResponseError } from 'hono/types';
import { ZodError } from 'zod';

export function handleNotFound(c: Context) {
  return c.json(
    {
      message: 'Not Found',
    },
    404,
  );
}

export function handleError(err: Error | HTTPResponseError, c: Context) {
  if (err instanceof ZodError) {
    return c.json(
      {
        message: 'Validation Error',
        error: JSON.parse(err.message),
      },
      400,
    );
  } else {
    return c.json(
      {
        message: 'Internal Server Error',
        error: err.message,
      },
      500,
    );
  }
}
