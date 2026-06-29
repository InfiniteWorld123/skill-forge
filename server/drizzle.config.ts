import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { env } from './src/constants/env.js';

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schemas/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
