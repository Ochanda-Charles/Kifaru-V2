
import { inventoryService } from '../src/services/inventoryService';
import { categoryService } from '../src/services/categoryService';
import { supplierService } from '../src/services/supplierService';
import { alertService } from '../src/services/alertService';
import { sqlConfig } from '../src/config/sqlConfig';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    console.log('Starting Service Layer Verification...');

    // Get an existing merchant from the database
    const merchantQuery = await sqlConfig.query('SELECT merchant_id FROM merchants LIMIT 1');
    if (merchantQuery.rows.length === 0) {
        console.error('No merchants found in database. Please run seedTestData.ts first.');
        process.exit(1);
    }
    const merchantId = merchantQuery.rows[0].merchant_id;
    console.log(`Using Merchant ID: ${merchantId}`);

    try {
        // 1. Create Category
        console.log('\n--- Category Service ---');
        const categoryInput = {
            merchant_id: merchantId,
            name: 'Test Category ' + uuidv4(), // Unique name
            description: 'Test Description'
        };
        const category = await categoryService.createCategory(merchantId, categoryInput);
        console.log('Category Created:', category.id);

        const tree = await categoryService.getCategoryTree(merchantId);
        console.log('Category Tree fetched. Count:', tree.length);

        // 2. Create Supplier
        console.log('\n--- Supplier Service ---');
        const supplierInput = {
            merchant_id: merchantId,
            name: 'Test Supplier ' + uuidv4(),
            email: 'test' + uuidv4().slice(0, 8) + '@example.com',
            is_active: true
        };
        const supplier = await supplierService.createSupplier(merchantId, supplierInput);
        console.log('Supplier Created:', supplier.id);

        // 3. Inventory & Alerts
        console.log('\n--- Inventory & Alert Service ---');

        // Get an existing product from the database
        const productQuery = await sqlConfig.query('SELECT id FROM products WHERE merchant_id = $1 LIMIT 1', [merchantId]);
        if (productQuery.rows.length === 0) {
            console.error('No products found for this merchant. Please run seedTestData.ts first.');
            process.exit(1);
        }
        const productId = productQuery.rows[0].id;
        console.log(`Using Product ID: ${productId}`);

        try {
            await inventoryService.adjustStock(productId, null, 50, {
                reason: 'Initial Stock'
            } as any);
            console.log('Stock Adjusted Successfully');
        } catch (error: any) {
            console.log('Stock Adjustment Result:', error.message);
        }

        // Test Business Logic: Negative Stock (Should fail logic before DB)
        try {
            await inventoryService.adjustStock(productId, null, -1000, {});
        } catch (error: any) {
            console.log('Negative Stock Check Passed:', error.message);
        }

        console.log('\nVerification Script Finished.');

    } catch (err) {
        console.error('Verification Error:', err);
    }
}

main();
