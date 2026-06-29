import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../shared/constants/env.js';

export const db = drizzle(env.DATABASE_URL);
