-- Create Categories Table
CREATE TABLE IF NOT EXISTS Categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(merchant_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES Categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Suppliers Table
CREATE TABLE IF NOT EXISTS Suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(merchant_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter Products Table
ALTER TABLE Products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES Categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

-- Create ProductVariants Table
CREATE TABLE IF NOT EXISTS ProductVariants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE,
    variant_name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE
);

-- Create StockMovements Table
CREATE TABLE IF NOT EXISTS StockMovements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES ProductVariants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES Suppliers(id) ON DELETE SET NULL,
    movement_type VARCHAR(20) CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'RETURN')),
    quantity_change INT NOT NULL,
    stock_before INT,
    stock_after INT,
    reason TEXT,
    reference_id VARCHAR(100),
    performed_by UUID, -- Assuming this references a user or merchant, keeping it loose for now or could reference merchants/users if we had a users table distinct from merchants
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create InventoryAlerts Table
CREATE TABLE IF NOT EXISTS InventoryAlerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(merchant_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON StockMovements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON StockMovements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_merchant_read ON InventoryAlerts(merchant_id, is_read);
