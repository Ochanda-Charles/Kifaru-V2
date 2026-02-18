
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function checkSuppliers() {
    const merchantId = '9e5f00c5-5ae6-4e13-80f5-7e74c5615506';
    try {
        const res = await pool.query("SELECT * FROM suppliers WHERE merchant_id = $1", [merchantId]);
        console.log(`Suppliers for ${merchantId}:`, res.rowCount);
        res.rows.forEach(r => console.log(`- ${r.name} (${r.id})`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSuppliers();
