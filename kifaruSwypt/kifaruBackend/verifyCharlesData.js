
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function verifyCharlesData() {
    try {
        const client = await pool.connect();
        try {
            // Get Charles ID
            const charRes = await client.query("SELECT merchant_id, email FROM merchants WHERE email = 'ochanda.charles.16@gmail.com'");
            if (charRes.rows.length === 0) {
                console.log("Charles not found!");
                return;
            }
            const charlesId = charRes.rows[0].merchant_id;
            console.log(`Charles ID: ${charlesId}`);

            // Get Categories
            const catRes = await client.query("SELECT count(*), json_agg(name) as names FROM categories WHERE merchant_id = $1", [charlesId]);
            console.log(`Categories (${catRes.rows[0].count}):`, catRes.rows[0].names);

            // Get Suppliers
            const supRes = await client.query("SELECT count(*), json_agg(name) as names FROM suppliers WHERE merchant_id = $1", [charlesId]);
            console.log(`Suppliers (${supRes.rows[0].count}):`, supRes.rows[0].names);

        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verifyCharlesData();
