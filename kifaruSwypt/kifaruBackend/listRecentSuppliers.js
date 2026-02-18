
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function listAllSuppliers() {
    try {
        const res = await pool.query("SELECT id, merchant_id, name, created_at FROM suppliers ORDER BY created_at DESC LIMIT 10");
        console.log("Recent Suppliers:");
        res.rows.forEach(r => console.log(`- ${r.name} (Merchant: ${r.merchant_id}) [Created: ${r.created_at}]`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listAllSuppliers();
