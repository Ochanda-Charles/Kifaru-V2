
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function findMerchantAndData() {
    try {
        // Find a merchant to test with
        const merRes = await pool.query("SELECT merchant_id, username, email FROM merchants LIMIT 5");
        if (merRes.rowCount === 0) {
            console.log("No merchants found.");
            return;
        }

        for (const merchant of merRes.rows) {
            const { merchant_id, username, email } = merchant;
            console.log(`\n--- Merchant: ${username} (${email}) [ID: ${merchant_id}] ---`);

            const catRes = await pool.query("SELECT id, name FROM categories WHERE merchant_id = $1", [merchant_id]);
            console.log(`Categories: ${catRes.rowCount}`);
            catRes.rows.forEach(r => console.log(`  - ${r.name}`));

            const supRes = await pool.query("SELECT id, name FROM suppliers WHERE merchant_id = $1", [merchant_id]);
            console.log(`Suppliers: ${supRes.rowCount}`);
            supRes.rows.forEach(r => console.log(`  - ${r.name}`));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findMerchantAndData();
