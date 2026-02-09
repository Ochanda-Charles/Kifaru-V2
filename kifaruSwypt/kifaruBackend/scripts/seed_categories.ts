
import { sqlConfig } from '../src/config/sqlConfig'; // Adjust path if necessary. currently in scripts/
import { v4 as uuidv4 } from 'uuid';

const commonCategories = [
    {
        name: 'Fresh Food',
        subcategories: ['Fruits & Vegetables', 'Meat & Poultry', 'Dairy & Eggs', 'Fish & Seafood', 'Bakery']
    },
    {
        name: 'Food Cupboard',
        subcategories: ['Grains, Rice & Pasta', 'Cereals & Breakfast', 'Sugar & Flour', 'Spices & Sauces', 'Canned Goods', 'Snacks & Crisps']
    },
    {
        name: 'Beverages',
        subcategories: ['Water', 'Soft Drinks', 'Tea & Coffee', 'Juices', 'Beer, Wine & Spirits']
    },
    {
        name: 'Household',
        subcategories: ['Cleaning Supplies', 'Laundry', 'Paper Products', 'Air Fresheners', 'Kitchenware']
    },
    {
        name: 'Personal Care',
        subcategories: ['Bath & Body', 'Hair Care', 'Oral Care', 'Deodorants', 'Skincare']
    },
    {
        name: 'Baby & Kids',
        subcategories: ['Diapers & Wipes', 'Baby Food', 'Baby Care']
    },
    {
        name: 'Electronics',
        subcategories: ['Kitchen Appliances', 'Home Entertainment', 'Accessories']
    }
];

const seedCategories = async () => {
    try {
        console.log('Starting Category Seed...');
        const pool = await sqlConfig.connect();

        // 1. Get a merchant ID to associate these global categories with (or create a system merchant)
        // For now, we'll try to get the first available merchant, or insert them with a NULL merchant_id if schema allows (schema says NOT NULL).
        // Naivas implementation: Categories usually belong to a merchant. 
        // We will fetch ALL merchants and seed these categories for ALL of them (or just the first one for testing).
        // Better approach: Let's fetch the specific merchant the user is using (we don't know it here easily).
        // Alternative: Just pick the first merchant found.

        const merchantRes = await pool.query('SELECT merchant_id FROM merchants LIMIT 1');
        if (merchantRes.rows.length === 0) {
            console.log('No merchants found. Please create a merchant first.');
            process.exit(1);
        }
        const merchantIds = (await pool.query('SELECT merchant_id FROM merchants')).rows.map(r => r.merchant_id);

        // Seed for ALL existing merchants to be safe/helpful
        for (const merchantId of merchantIds) {
            console.log(`Seeding categories for merchant: ${merchantId}`);

            for (const cat of commonCategories) {
                // Check if category exists
                const existingCat = await pool.query(
                    'SELECT id FROM Categories WHERE name = $1 AND merchant_id = $2',
                    [cat.name, merchantId]
                );

                let parentId;
                if (existingCat.rows.length > 0) {
                    parentId = existingCat.rows[0].id;
                } else {
                    parentId = uuidv4();
                    await pool.query(
                        'INSERT INTO Categories (id, merchant_id, name, description) VALUES ($1, $2, $3, $4)',
                        [parentId, merchantId, cat.name, 'Standard Category']
                    );
                }

                for (const sub of cat.subcategories) {
                    const existingSub = await pool.query(
                        'SELECT id FROM Categories WHERE name = $1 AND parent_id = $2 AND merchant_id = $3',
                        [sub, parentId, merchantId]
                    );

                    if (existingSub.rows.length === 0) {
                        await pool.query(
                            'INSERT INTO Categories (id, merchant_id, name, parent_id, description) VALUES ($1, $2, $3, $4, $5)',
                            [uuidv4(), merchantId, sub, parentId, 'Standard Subcategory']
                        );
                    }
                }
            }
        }

        console.log('Category Seeding Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
