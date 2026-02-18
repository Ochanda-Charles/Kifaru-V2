
const jwt = require('jsonwebtoken');

const SECRET = 'S0m3_S3cur3_R4ndom_JWT_S3cr3t_2026!';
const API_URL = 'http://localhost:4000/api';

// Using the same user ID as before
const USER_ID = '9e5f00c5-5ae6-4e13-80f5-7e74c5615506';
const EMAIL = 'charlesochanda16@gmail.com';

const token = jwt.sign({
    merchant_id: USER_ID,
    email: EMAIL,
    isAdmin: false
}, SECRET, { expiresIn: '1h' });

async function checkDropdownData() {
    console.log("Checking Dropdown Data for User:", USER_ID);

    try {
        // Check Categories
        console.log("\n1. Fetching Categories...");
        const catRes = await fetch(`${API_URL}/inventory/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (catRes.ok) {
            const data = await catRes.json();
            // console.log("Categories Response:", JSON.stringify(data, null, 2));
            console.log("First Category:", data.data[0]);
            console.log("Has Name property?", data.data[0].hasOwnProperty('name'));
            console.log("Name value:", data.data[0].name);
        } else {
            console.log(`Categories Failed: ${catRes.status} ${await catRes.text()}`);
        }

        // Check Suppliers
        console.log("\n2. Fetching Suppliers...");
        const supRes = await fetch(`${API_URL}/inventory/suppliers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (supRes.ok) {
            const data = await supRes.json();
            console.log("Suppliers Response:", JSON.stringify(data, null, 2));
        } else {
            console.log(`Suppliers Failed: ${supRes.status} ${await supRes.text()}`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkDropdownData();
