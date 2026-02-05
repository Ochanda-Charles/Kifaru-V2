import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

const runMigration = async () => {
    const args = process.argv.slice(2);
    const direction = args[0]; // 'up' or 'down'

    if (direction !== 'up' && direction !== 'down') {
        console.error('Please specify "up" or "down" as an argument.');
        process.exit(1);
    }

    const client = await pool.connect();

    try {
        const filename = direction === 'up' ? '001_inventory_up.sql' : '001_inventory_down.sql';
        const filePath = path.join(__dirname, filename);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Running ${direction} migration from ${filename}...`);

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log(`Migration ${direction} completed successfully.`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Migration ${direction} failed:`, error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

runMigration();
