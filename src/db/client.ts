import 'dotenv/config';
import { Client } from '@planetscale/database';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import * as schema from './schema';

const client = new Client({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

export const db = drizzle(client, { schema });
