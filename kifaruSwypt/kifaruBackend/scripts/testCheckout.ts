
import { sqlConfig } from '../src/config/sqlConfig';

async function testCheckoutFlow() {
    try {
        console.log('=== Testing Checkout Flow (Inventory Deduction) ===\n');

        // 1. Setup Data
        const merchantQuery = await sqlConfig.query('SELECT merchant_id FROM merchants LIMIT 1');
        const merchantId = merchantQuery.rows[0].merchant_id;

        const productQuery = await sqlConfig.query('SELECT id, quantity FROM products WHERE merchant_id = $1 LIMIT 1', [merchantId]);
        const product = productQuery.rows[0];
        const initialQuantity = product.quantity;

        console.log(`Product: ${product.id}`);
        console.log(`Initial Quantity: ${initialQuantity}`);

        // 2. Simulate Checkout Request
        // Note: This calls the actual API endpoint
        const checkoutData = {
            merchantId: merchantId,
            totalAmount: 100,
            customerDetails: { email: 'customer@example.com' },
            paymentData: { method: 'TEST' },
            items: [
                {
                    product: { id: product.id },
                    quantity: 2
                }
            ]
        };

        console.log('\nSending Checkout Request...');
        const response = await fetch('http://localhost:3000/inventory/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutData)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        // 3. Verify Stock Deduction
        const finalProductQuery = await sqlConfig.query('SELECT quantity FROM products WHERE id = $1', [product.id]);
        const finalQuantity = finalProductQuery.rows[0].quantity;

        console.log(`\nFinal Quantity: ${finalQuantity}`);
        console.log(`Expected Quantity: ${initialQuantity - 2}`);

        if (finalQuantity === initialQuantity - 2) {
            console.log('\n✓ Stock deduction verified successfully.');
        } else {
            console.log('\n⨯ Stock deduction failed.');
        }

        process.exit(0);
    } catch (err: any) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message);
        }
        process.exit(1);
    }
}

// Start local server first if needed? 
// The user might not have it running. 
// I'll assume they want me to test the logic directly if the server isn't up, 
// OR I can try to start it.
testCheckoutFlow();
