import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { handleError, handleNotFound } from './exception.js';

import { handlePostMessage } from './routes/message.js';

const app = new Hono();

app.use('*', cors());

app.notFound(handleNotFound);
app.onError(handleError);

app.post('/message', handlePostMessage);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
