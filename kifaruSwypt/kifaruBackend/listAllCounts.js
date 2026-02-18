
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function listAllCounts() {
    try {
        const res = await pool.query(`
      SELECT m.merchant_id, m.email, m.username,
             (SELECT COUNT(*) FROM categories c WHERE c.merchant_id = m.merchant_id) as category_count,
             (SELECT COUNT(*) FROM suppliers s WHERE s.merchant_id = m.merchant_id) as supplier_count
      FROM merchants m
    `);
        console.log("Merchant Data Counts:");
        const fs = require('fs');
        const output = res.rows.map(r => ({
            merchant: r.username,
            email: r.email,
            categories: r.category_count,
            suppliers: r.supplier_count,
            id: r.merchant_id
        }));
        fs.writeFileSync('counts.json', JSON.stringify(output, null, 2));
        console.log("Counts written to counts.json");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listAllCounts();
