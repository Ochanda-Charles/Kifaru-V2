
const axios = require('axios');

async function pingBackend() {
    try {
        const res = await axios.get('http://localhost:4000/getProducts');
        console.log("Backend response status:", res.status);
        console.log("Backend response data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Backend ping failed:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    }
}

pingBackend();
