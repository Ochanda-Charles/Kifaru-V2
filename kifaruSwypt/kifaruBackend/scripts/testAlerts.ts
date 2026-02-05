
import { sqlConfig } from '../src/config/sqlConfig';
import { inventoryService } from '../src/services/inventoryService';

async function testAlertTrigger() {
    try {
        console.log('=== Testing Low Stock Alert Trigger ===\n');

        // 1. Setup Data
        const merchantQuery = await sqlConfig.query('SELECT merchant_id FROM merchants LIMIT 1');
        const merchantId = merchantQuery.rows[0].merchant_id;

        const productQuery = await sqlConfig.query('SELECT id, quantity FROM products WHERE merchant_id = $1 LIMIT 1', [merchantId]);
        const product = productQuery.rows[0];

        console.log(`Product: ${product.id}`);
        console.log(`Current Quantity: ${product.quantity}`);

        // 2. Adjust stock to exactly 11 (one above threshold)
        console.log('\nAdjusting stock to 11...');
        await inventoryService.adjustStock(product.id, null, 11 - product.quantity, {
            reason: 'Reset for alert test'
        } as any);

        // 3. Clear existing alerts for this product to be sure
        await sqlConfig.query('DELETE FROM inventoryalerts WHERE product_id = $1', [product.id]);

        // 4. Adjust stock to 9 (below 10)
        console.log('Adjusting stock to 9 (should trigger alert)...');
        await inventoryService.adjustStock(product.id, null, -2, {
            reason: 'Trigger alert test',
            merchant_id: merchantId
        } as any);

        // 5. Check alerts table
        const alertsRes = await sqlConfig.query('SELECT * FROM inventoryalerts WHERE product_id = $1 ORDER BY created_at DESC', [product.id]);

        console.log(`\nFound ${alertsRes.rows.length} alerts.`);
        if (alertsRes.rows.length > 0) {
            console.log('Alert Message:', alertsRes.rows[0].message);
            console.log('✓ Alert trigger verified successfully.');
        } else {
            console.log('⨯ Alert trigger failed. (Check threshold logic in service)');
        }

        process.exit(0);
    } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testAlertTrigger();
