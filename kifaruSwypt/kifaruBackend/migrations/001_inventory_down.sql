-- Drop Indexes
DROP INDEX IF EXISTS idx_inventory_alerts_merchant_read;
DROP INDEX IF EXISTS idx_stock_movements_created_at;
DROP INDEX IF EXISTS idx_stock_movements_product_id;

-- Drop Tables (Order matters due to foreign keys)
DROP TABLE IF EXISTS InventoryAlerts;
DROP TABLE IF EXISTS StockMovements;
DROP TABLE IF EXISTS ProductVariants;

-- Revert Products Table Changes
ALTER TABLE Products
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS low_stock_threshold,
DROP COLUMN IF EXISTS sku;

-- Drop Remaining Tables
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Categories;
