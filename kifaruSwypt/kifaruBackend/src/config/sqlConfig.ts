import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

// Check if PG_DATABASE contains a full connection string
const isConnectionString = process.env.PG_DATABASE?.startsWith('postgres://') || process.env.PG_DATABASE?.startsWith('postgresql://');

export const sqlConfig = new Pool(
  isConnectionString
    ? {
      connectionString: process.env.PG_DATABASE,
      ssl: {
        rejectUnauthorized: false
      }
    }
    : {
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
      ssl: {
        rejectUnauthorized: false
      }
    }
);
