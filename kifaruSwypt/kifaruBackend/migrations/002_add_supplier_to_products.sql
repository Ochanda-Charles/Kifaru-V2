-- Add supplier_id to Products table
ALTER TABLE Products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES Suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON Products(supplier_id);
