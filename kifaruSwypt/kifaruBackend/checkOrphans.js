
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function checkOrphans() {
    try {
        console.log("Checking for categories without valid merchants...");
        const catOrp = await pool.query(`
      SELECT COUNT(*) FROM categories 
      WHERE merchant_id IS NULL 
      OR merchant_id NOT IN (SELECT merchant_id FROM merchants)
    `);
        console.log(`Orphaned categories: ${catOrp.rows[0].count}`);

        console.log("\nChecking for suppliers without valid merchants...");
        const supOrp = await pool.query(`
      SELECT COUNT(*) FROM suppliers 
      WHERE merchant_id IS NULL 
      OR merchant_id NOT IN (SELECT merchant_id FROM merchants)
    `);
        console.log(`Orphaned suppliers: ${supOrp.rows[0].count}`);

        if (parseInt(catOrp.rows[0].count) > 0) {
            const catSample = await pool.query(`
          SELECT id, name, merchant_id FROM categories 
          WHERE merchant_id IS NULL 
          OR merchant_id NOT IN (SELECT merchant_id FROM merchants)
          LIMIT 5
        `);
            console.log("Sample orphaned categories:");
            catSample.rows.forEach(r => console.log(`  - ${r.name} (Merchant ID: ${r.merchant_id})`));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkOrphans();
