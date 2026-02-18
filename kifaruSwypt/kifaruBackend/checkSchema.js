
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'merchants'");
        const cols = res.rows.map(r => r.column_name);
        console.log("COLUMNS_START");
        console.log(cols.join("|"));
        console.log("COLUMNS_END");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
