import { sqlConfig } from '../src/config/sqlConfig';

async function checkDatabase() {
    try {
        console.log('=== Database Connection Test ===\n');

        // Test connection
        const connectionTest = await sqlConfig.query('SELECT NOW()');
        console.log('✓ Database connection successful');
        console.log('  Server time:', connectionTest.rows[0].now);

        // Check if merchants table exists
        console.log('\n=== Checking Tables ===\n');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('merchants', 'categories', 'suppliers', 'products', 'stockmovements', 'inventoryalerts')
            ORDER BY table_name;
        `;
        const tables = await sqlConfig.query(tablesQuery);
        console.log('Existing tables:', tables.rows.map(r => r.table_name).join(', '));

        // Check for any merchants
        const merchantCheck = await sqlConfig.query('SELECT * FROM merchants LIMIT 5');
        console.log('\n=== Sample Merchants ===');
        if (merchantCheck.rows.length > 0) {
            console.log(`  Found ${merchantCheck.rows.length} merchants`);
            console.log('  Columns:', Object.keys(merchantCheck.rows[0]).join(', '));
            merchantCheck.rows.forEach((m, i) => {
                console.log(`  ${i + 1}. ID: ${m.merchant_id || m.id}`);
            });
        } else {
            console.log('  No merchants found in database');
        }

        // Check for products
        const productCheck = await sqlConfig.query('SELECT COUNT(*) as count FROM products');
        console.log('\n=== Products ===');
        console.log(`  Total products: ${productCheck.rows[0].count}`);

        process.exit(0);
    } catch (err) {
        console.error('Database check failed:', err);
        process.exit(1);
    }
}

checkDatabase();
