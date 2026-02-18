
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function findMerchant() {
    try {
        const res = await pool.query("SELECT merchant_id, username FROM merchants WHERE email = 'charlesochanda16@gmail.com'");
        console.log(JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findMerchant();
