import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

export const sqlConfig = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
    ssl: {
    rejectUnauthorized: false
  }
});
