
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log("Adding supplier_id column to Products table...");
        await pool.query("ALTER TABLE Products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES Suppliers(id)");
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
