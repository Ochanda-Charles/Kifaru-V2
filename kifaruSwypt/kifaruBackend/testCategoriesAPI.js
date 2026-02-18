
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

async function testCategories() {
    const merchantId = '9e5f00c5-5ae6-4e13-80f5-7e74c5615506';
    const token = jwt.sign({ merchant_id: merchantId, userName: 'chalo' }, SECRET);

    try {
        const res = await fetch('http://localhost:4000/api/inventory/categories', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data sample:", JSON.stringify(data.data ? data.data.slice(0, 2) : data, null, 2));
        console.log("Total items:", data.data ? data.data.length : 'N/A');
    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

testCategories();
