
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

const USER_ID = '9e5f00c5-5ae6-4e13-80f5-7e74c5615506';

async function checkDB() {
    try {
        console.log("--- CHECKING CATEGORIES ---");
        // Count Global Categories
        const globalCats = await pool.query("SELECT count(*) FROM categories WHERE merchant_id IS NULL");
        console.log(`Global Categories (NULL merchant_id): ${globalCats.rows[0].count}`);

        // Count Merchant Categories
        const merchantCats = await pool.query("SELECT count(*) FROM categories WHERE merchant_id = $1", [USER_ID]);
        console.log(`Merchant Categories: ${merchantCats.rows[0].count}`);

        // Check if Merchant categories have parents that are GLOBAL
        // We join merchant cats with global cats on parent_id = global.id
        const orphans = await pool.query(`
            SELECT c.name as child, c.parent_id 
            FROM categories c 
            WHERE c.merchant_id = $1 AND c.parent_id IS NOT NULL 
            AND c.parent_id NOT IN (SELECT id FROM categories WHERE merchant_id = $1)
            LIMIT 5
        `, [USER_ID]);

        console.log(`Potential Orphans (Children with non-merchant parents):`);
        console.table(orphans.rows);

        if (orphans.rowCount > 0 && parseInt(globalCats.rows[0].count) > 0) {
            console.log("CRITICAL: Merchant categories reference parents that are NOT in the merchant list (likely Global).");
        }

        console.log("\n--- CHECKING SUPPLIERS ---");
        // Check suppliers for this user
        const userSups = await pool.query("SELECT count(*) FROM suppliers WHERE merchant_id = $1", [USER_ID]);
        console.log(`Suppliers for Chalo: ${userSups.rows[0].count}`);

        // Check GLOBAL suppliers
        const globalSups = await pool.query("SELECT count(*) FROM suppliers WHERE merchant_id IS NULL");
        console.log(`Global Suppliers (NULL merchant_id): ${globalSups.rows[0].count}`);

        // Check ALL suppliers count
        const allSups = await pool.query("SELECT count(*) FROM suppliers");
        console.log(`Total Suppliers in DB: ${allSups.rows[0].count}`);

        if (parseInt(allSups.rows[0].count) > 0) {
            const sample = await pool.query("SELECT id, name, merchant_id FROM suppliers LIMIT 3");
            console.table(sample.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDB();
