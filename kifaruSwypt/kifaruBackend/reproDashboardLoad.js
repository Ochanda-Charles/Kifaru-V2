
const jwt = require('jsonwebtoken');

const SECRET = 'S0m3_S3cur3_R4ndom_JWT_S3cr3t_2026!'; // Using correct secret
const API_URL = 'http://localhost:4000/api';

// User 'chalo' ID (known to have NO products)
const USER_ID = '9e5f00c5-5ae6-4e13-80f5-7e74c5615506';
const EMAIL = 'charlesochanda16@gmail.com';

const token = jwt.sign({
    merchant_id: USER_ID,
    email: EMAIL,
    isAdmin: false
}, SECRET, { expiresIn: '1h' });

async function testFetchFlow() {
    console.log("Testing Dashboard Load Flow with FIX (Independent Fetches)...");

    // Step 1: getMerchantProducts
    try {
        console.log("1. Fetching Products...");
        const prodRes = await fetch(`${API_URL}/getMerchantProducts/${USER_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!prodRes.ok) {
            if (prodRes.status === 404) {
                console.log("Product Fetch returned 404 (Expected for new user). Handling gracefully.");
            } else {
                throw new Error(`Product fetch failed: ${prodRes.status}`);
            }
        } else {
            console.log("Product Fetch Success");
        }
    } catch (error) {
        console.log(`Product Fetch Error: ${error.message}`);
    }

    // Step 2: Fetch Categories
    try {
        console.log("2. Fetching Categories...");
        const catRes = await fetch(`${API_URL}/inventory/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Category Fetch Status: ${catRes.status}`);
        if (catRes.ok) {
            console.log("SUCCESS: Categories fetched despite product 404!");
        } else {
            console.log("Category Fetch Failed.");
        }

    } catch (error) {
        console.log(`Category Fetch Error: ${error.message}`);
    }
}

testFetchFlow();
