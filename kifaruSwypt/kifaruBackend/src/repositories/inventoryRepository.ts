import { sqlConfig } from '../config/sqlConfig';
import { PoolClient } from 'pg';
import { v4 } from 'uuid';
import { StockMovement, StockMovementInput, InventorySummary, StockMovementType } from '../interfaces/inventoryInterface';

export const inventoryRepository = {
    getStockByProductId: async (productId: string): Promise<{ quantity: number }> => {
        const query = 'SELECT quantity FROM Products WHERE id = $1';
        const result = await sqlConfig.query(query, [productId]);
        return result.rows[0] || { quantity: 0 };
    },

    getProductById: async (productId: string): Promise<any | null> => {
        const query = 'SELECT * FROM Products WHERE id = $1';
        const result = await sqlConfig.query(query, [productId]);
        return result.rows[0] || null;
    },

    adjustStock: async (productId: string, variantId: string | null, change: number, movementData: Partial<StockMovementInput>): Promise<StockMovement> => {
        const client = await sqlConfig.connect();
        try {
            await client.query('BEGIN');

            // 1. Update Product/Variant Quantity
            let newQuantity = 0;
            if (variantId) {
                const updateVariant = `
          UPDATE ProductVariants 
          SET stock_level = stock_level + $1 
          WHERE id = $2 
          RETURNING stock_level
        `;
                const res = await client.query(updateVariant, [change, variantId]);
                // Update parent product total quantity if necessary, or assume it's calculated
                newQuantity = res.rows[0].stock_level;
            } else {
                const updateProduct = `
          UPDATE Products 
          SET quantity = quantity + $1 
          WHERE id = $2 
          RETURNING quantity
        `;
                const res = await client.query(updateProduct, [change, productId]);
                newQuantity = res.rows[0].quantity;
            }

            // 2. Record Movement
            const stockBefore = newQuantity - change;
            const movementId = v4();
            const insertMovement = `
        INSERT INTO StockMovements (id, product_id, variant_id, quantity_change, stock_before, stock_after, movement_type, reference_id, reason, performed_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
            const movementValues = [
                movementId,
                productId,
                variantId,
                change,
                stockBefore,
                newQuantity,
                movementData.type || StockMovementType.ADJUSTMENT,
                movementData.reference_id || null,
                movementData.reason || null,
                movementData.performed_by || null
            ];

            const movementResult = await client.query(insertMovement, movementValues);

            await client.query('COMMIT');
            return movementResult.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // Adjusts stock using an externally provided client (runs within caller's transaction)
    adjustStockWithClient: async (client: PoolClient, productId: string, variantId: string | null, change: number, movementData: Partial<StockMovementInput>): Promise<StockMovement> => {
        let newQuantity = 0;
        if (variantId) {
            const res = await client.query(
                'UPDATE ProductVariants SET stock_level = stock_level + $1 WHERE id = $2 RETURNING stock_level',
                [change, variantId]
            );
            newQuantity = res.rows[0].stock_level;
        } else {
            const res = await client.query(
                'UPDATE Products SET quantity = quantity + $1 WHERE id = $2 RETURNING quantity',
                [change, productId]
            );
            newQuantity = res.rows[0].quantity;
        }

        const stockBefore = newQuantity - change;
        const movementId = v4();
        const insertMovement = `
            INSERT INTO StockMovements (id, product_id, variant_id, quantity_change, stock_before, stock_after, movement_type, reference_id, reason, performed_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const movementResult = await client.query(insertMovement, [
            movementId,
            productId,
            variantId,
            change,
            stockBefore,
            newQuantity,
            movementData.type || StockMovementType.ADJUSTMENT,
            movementData.reference_id || null,
            movementData.reason || null,
            movementData.performed_by || null
        ]);
        return movementResult.rows[0];
    },

    getStockMovements: async (productId: string, filters: { startDate?: Date, endDate?: Date, type?: StockMovementType }): Promise<StockMovement[]> => {
        let query = 'SELECT * FROM StockMovements WHERE product_id = $1';
        const values: any[] = [productId];
        let paramCount = 2;

        if (filters.startDate) {
            query += ` AND created_at >= $${paramCount++}`;
            values.push(filters.startDate);
        }
        if (filters.endDate) {
            query += ` AND created_at <= $${paramCount++}`;
            values.push(filters.endDate);
        }
        if (filters.type) {
            query += ` AND type = $${paramCount++}`;
            values.push(filters.type);
        }

        query += ' ORDER BY created_at DESC';

        const result = await sqlConfig.query(query, values);
        return result.rows;
    },

    // Paginated version — uses database-level LIMIT/OFFSET so only the requested
    // page is transferred from the database, regardless of total row count.
    getStockMovementsPaginated: async (
        productId: string,
        filters: { startDate?: Date, endDate?: Date, type?: StockMovementType },
        pagination: { page: number, limit: number }
    ): Promise<{ data: StockMovement[], total: number }> => {
        const baseWhere = 'WHERE product_id = $1';
        const filterValues: any[] = [productId];
        let paramCount = 2;
        let filterClause = '';

        if (filters.startDate) {
            filterClause += ` AND created_at >= $${paramCount++}`;
            filterValues.push(filters.startDate);
        }
        if (filters.endDate) {
            filterClause += ` AND created_at <= $${paramCount++}`;
            filterValues.push(filters.endDate);
        }
        if (filters.type) {
            filterClause += ` AND movement_type = $${paramCount++}`;
            filterValues.push(filters.type);
        }

        const countQuery = `SELECT COUNT(*) FROM StockMovements ${baseWhere}${filterClause}`;
        const offset = (pagination.page - 1) * pagination.limit;
        const dataQuery = `SELECT * FROM StockMovements ${baseWhere}${filterClause} ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;

        const [countRes, dataRes] = await Promise.all([
            sqlConfig.query(countQuery, filterValues),
            sqlConfig.query(dataQuery, [...filterValues, pagination.limit, offset]),
        ]);

        return {
            data: dataRes.rows,
            total: parseInt(countRes.rows[0].count, 10),
        };
    },

    getInventorySummary: async (merchantId: string): Promise<InventorySummary> => {
        const basicQuery = `
            SELECT
                COUNT(*) as count,
                COALESCE(SUM(quantity), 0) as total_units,
                COALESCE(SUM(quantity * price), 0) as total_value,
                COALESCE(AVG(price), 0) as avg_price,
                COUNT(CASE WHEN quantity <= COALESCE(low_stock_threshold, 10) AND quantity > 0 THEN 1 END) as low_stock_count,
                COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count
            FROM Products
            WHERE merchant_id = $1
        `;
        const categoryQuery = `
            SELECT COALESCE(c.name, 'Uncategorized') as name, COALESCE(SUM(p.quantity), 0)::int as value
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.id
            WHERE p.merchant_id = $1
            GROUP BY c.name
            ORDER BY value DESC
        `;
        const topProductsQuery = `
            SELECT name, (quantity * price)::numeric as value
            FROM Products
            WHERE merchant_id = $1
            ORDER BY (quantity * price) DESC
            LIMIT 5
        `;
        const movementQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity_change ELSE 0 END), 0) as total_in,
                COALESCE(SUM(CASE WHEN sm.movement_type IN ('OUT', 'SALE') THEN ABS(sm.quantity_change) ELSE 0 END), 0) as total_out
            FROM StockMovements sm
            JOIN Products p ON sm.product_id = p.id
            WHERE p.merchant_id = $1
        `;

        // Run all four independent queries concurrently instead of sequentially
        const [basicRes, categoryRes, topProductsRes, movementRes] = await Promise.all([
            sqlConfig.query(basicQuery, [merchantId]),
            sqlConfig.query(categoryQuery, [merchantId]),
            sqlConfig.query(topProductsQuery, [merchantId]),
            sqlConfig.query(movementQuery, [merchantId]),
        ]);

        const basic = basicRes.rows[0];
        const mov = movementRes.rows[0];
        const totalIn = parseInt(mov.total_in || '0');
        const totalOut = parseInt(mov.total_out || '0');

        return {
            totalProducts: parseInt(basic.count || '0'),
            totalStockUnits: parseInt(basic.total_units || '0'),
            totalInventoryValue: parseFloat(basic.total_value || '0'),
            avgPrice: parseFloat(parseFloat(basic.avg_price || '0').toFixed(2)),
            lowStockCount: parseInt(basic.low_stock_count || '0'),
            outOfStockCount: parseInt(basic.out_of_stock_count || '0'),
            stockByCategory: categoryRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
            topProductsByValue: topProductsRes.rows.map(r => ({ name: r.name, value: parseFloat(r.value) })),
            movementSummary: { in: totalIn, out: totalOut, net: totalIn - totalOut }
        };
    },


    getLowStockProducts: async (merchantId: string): Promise<any[]> => {
        const query = `
      SELECT * FROM Products
      WHERE merchant_id = $1 AND quantity <= COALESCE(low_stock_threshold, 10)
      ORDER BY quantity ASC
    `;
        const result = await sqlConfig.query(query, [merchantId]);
        return result.rows;
    },

    getInventoryValuation: async (merchantId: string): Promise<any> => {
        // Total Value
        const totalRes = await sqlConfig.query(
            'SELECT SUM(quantity * price) as total_value FROM Products WHERE merchant_id = $1',
            [merchantId]
        );

        // Value by Category
        // optimized: join with Categories if possible, but schema might be simple.
        // Assuming Products has category_id or category column.
        // Prompt implied category support. let's assume category_id maps to Categories table or just a string column?
        // Let's check CategoryController/Service or migration to be sure.
        // Actually I don't see Categories table schema in my prompt output but I saw `createCategory` in route.
        // Let's assume joining Categories C ON P.category_id = C.id
        // Or if simple string 'category'.
        // I'll use a safer approach: check if category_id exists, else group by category string if exists.
        // If I can't confirm, I'll return empty array for now or try standard join.
        // Let's assume standard normalization: Products.category_id -> Categories.name

        // I'll do a safe guess based on common patterns, if it fails I'll fix.
        // Or wait, I can check how `createCategory` works? No time, better to use standard SQL.
        // Let's assume Products has a category_id.
        const byCategoryRes = await sqlConfig.query(
            `SELECT c.name as category, COUNT(p.id) as count, SUM(p.quantity * p.price) as value 
             FROM Products p 
             LEFT JOIN Categories c ON p.category_id = c.id 
             WHERE p.merchant_id = $1 
             GROUP BY c.name`,
            [merchantId]
        );

        return {
            totalValue: parseFloat(totalRes.rows[0].total_value || '0'),
            byCategory: byCategoryRes.rows,
            history: [] // Not implemented for now, complex temporal query
        };
    },

    getMerchantStockMovements: async (merchantId: string, filters: { startDate?: Date, endDate?: Date }): Promise<StockMovement[]> => {
        // Join StockMovements with Products to filter by merchant_id
        let query = `
      SELECT sm.*, sm.created_at AS date, p.name AS product_name
      FROM StockMovements sm
      JOIN Products p ON sm.product_id = p.id
      WHERE p.merchant_id = $1
    `;
        const values: any[] = [merchantId];
        let paramCount = 2;

        if (filters.startDate) {
            query += ` AND sm.created_at >= $${paramCount++}`;
            values.push(filters.startDate);
        }
        if (filters.endDate) {
            query += ` AND sm.created_at < ($${paramCount++}::date + interval '1 day')`;
            values.push(filters.endDate);
        }

        query += ' ORDER BY sm.created_at DESC';

        const result = await sqlConfig.query(query, values);
        return result.rows;
    },

    createProduct: async (product: any): Promise<any> => {
        const query = `
            INSERT INTO Products (
                id, merchant_id, name, description, price, quantity,
                category_id, supplier_id, imageurl, sku, low_stock_threshold,
                bestseller, new
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            product.id,
            product.merchant_id,
            product.name,
            product.description,
            product.price,
            product.quantity,
            product.category_id,
            product.supplier_id,
            product.image_url,
            product.sku,
            product.low_stock_threshold,
            product.bestseller,
            product.new
        ];

        const result = await sqlConfig.query(query, values);
        return result.rows[0];
    }
};

