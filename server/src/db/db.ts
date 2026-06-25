import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../constants/env.js';

export const db = drizzle(env.DATABASE_URL);
