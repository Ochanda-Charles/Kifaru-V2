
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv'; // This import might be problematic if types aren't right, but let's try.
// If dotenv fails, we can just use process.env assuming environment is loaded.
// Actually, let's stick to the existing style.

if (fs.existsSync(path.join(__dirname, '../.env'))) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

// Re-using the existing pool config logic from the previous file content
const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log('Running migrations...');

        // 1. Inventory Up (Existing)
        const inventoryUp = fs.readFileSync(path.join(__dirname, '001_inventory_up.sql'), 'utf8');
        await client.query(inventoryUp);
        console.log('001_inventory_up.sql executed.');

        // 2. Add Supplier to Products (New)
        const addSupplier = fs.readFileSync(path.join(__dirname, '002_add_supplier_to_products.sql'), 'utf8');
        await client.query(addSupplier);
        console.log('002_add_supplier_to_products.sql executed.');

        console.log('All migrations completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

runMigration();
