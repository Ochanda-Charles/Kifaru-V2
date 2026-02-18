
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function checkData() {
    try {
        console.log("Checking Categories...");
        const catRes = await pool.query("SELECT id, merchant_id, name FROM categories");
        console.log("Categories found:", catRes.rowCount);
        catRes.rows.forEach(row => console.log(`- ${row.name} (Merchant: ${row.merchant_id})`));

        console.log("\nChecking Suppliers...");
        const supRes = await pool.query("SELECT id, merchant_id, name FROM suppliers");
        console.log("Suppliers found:", supRes.rowCount);
        supRes.rows.forEach(row => console.log(`- ${row.name} (Merchant: ${row.merchant_id})`));

        console.log("\nChecking Merchants...");
        const merRes = await pool.query("SELECT merchant_id, username, email FROM merchants");
        console.log("Merchants found:", merRes.rowCount);
        merRes.rows.forEach(row => console.log(`- ${row.username} (${row.merchant_id})`));

    } catch (err) {
        console.error("Error checking data:", err);
    } finally {
        await pool.end();
    }
}

checkData();
