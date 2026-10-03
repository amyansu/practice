import { drizzle } from 'drizzle-orm/neon-http';
import 'dotenv/config';
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing!');
}

export const db = drizzle(process.env.DATABASE_URL);
