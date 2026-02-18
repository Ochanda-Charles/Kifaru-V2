
const jwt = require('jsonwebtoken');

const SECRET = 'S0m3_S3cur3_R4ndom_JWT_S3cr3t_2026!';
const API_URL = 'http://localhost:4000/api';

// User 'charles' ID from previous debug
const USER_ID = 'd946a45d-5649-47bb-8cf0-44dc50cb964b';
const EMAIL = 'ochanda.charles.16@gmail.com';

const token = jwt.sign({
    merchant_id: USER_ID,
    email: EMAIL,
    isAdmin: false
}, SECRET, { expiresIn: '1h' });

async function testAddSupplier() {
    console.log("Testing Add Supplier...");
    console.log(`Token: ${token.substring(0, 20)}...`);

    // Case 1: With merchant_id: null (Simulating current bug)
    try {
        console.log("\n1. Sending payload WITH merchant_id: null");
        const res = await fetch(`${API_URL}/inventory/suppliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Repro Supplier",
                contact_email: "repro@test.com",
                status: "Active",
                merchant_id: null
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(JSON.stringify(errData));
        }
        console.log("SUCCESS (Unexpected for Case 1)");
    } catch (err) {
        console.log("Expected Error:", err.message);
    }

    // Case 2: Without merchant_id (Simulating Fix)
    try {
        console.log("\n2. Sending payload WITHOUT merchant_id");
        const res = await fetch(`${API_URL}/inventory/suppliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Repro Supplier Fixed",
                contact_email: "repro_fixed@test.com",
                is_active: true
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(JSON.stringify(errData));
        }
        const data = await res.json();
        console.log("SUCCESS:", data);
    } catch (err) {
        console.log("Error in Case 2:", err.message);
    }
}

testAddSupplier();
