
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

const USER_ID = '9e5f00c5-5ae6-4e13-80f5-7e74c5615506';

async function clearProducts() {
    try {
        const res = await pool.query("DELETE FROM products WHERE merchant_id = $1", [USER_ID]);
        console.log(`Deleted ${res.rowCount} products for Chalo.`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

clearProducts();
