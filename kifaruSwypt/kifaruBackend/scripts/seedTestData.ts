import { sqlConfig } from '../src/config/sqlConfig';
import { v4 as uuidv4 } from 'uuid';

async function seedTestData() {
    try {
        console.log('=== Seeding Test Data ===\n');

        // 1. Create a test merchant
        const merchantId = uuidv4();
        const merchantEmail = `test-${Date.now()}@example.com`;

        console.log('Creating test merchant...');
        await sqlConfig.query(`
            INSERT INTO merchants (merchant_id, username, email, password_hash, wallet_address)
            VALUES ($1, $2, $3, $4, $5)
        `, [merchantId, 'test-merchant', merchantEmail, 'test-hash', '0xTestWallet']);
        console.log('✓ Merchant created:', merchantId);

        // 2. Create a test product
        const productId = uuidv4();
        console.log('\nCreating test product...');
        await sqlConfig.query(`
            INSERT INTO products (id, merchant_id, name, description, price, quantity)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [productId, merchantId, 'Test Product', 'A test product for inventory validation', 100.00, 50]);
        console.log('✓ Product created:', productId);

        console.log('\n=== Test Data Summary ===');
        console.log(`Merchant ID: ${merchantId}`);
        console.log(`Product ID: ${productId}`);
        console.log(`\nYou can now run: pnpm exec ts-node scripts/verifyServices.ts`);

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedTestData();
