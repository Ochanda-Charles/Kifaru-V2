export interface CategoryInput {
    merchant_id: string;
    name: string;
    description?: string;
    parent_id?: string | null;
}

export interface Category extends CategoryInput {
    id: string;
    created_at: Date;
    updated_at: Date;
}

export interface SupplierInput {
    merchant_id: string;
    name: string;
    contact_email?: string;
    phone?: string;
    address?: string;
    is_active?: boolean;
}

// id, created_at, updated_at inherited from SupplierInput if it extended something, but it doesn't.
// Actually Supplier extends SupplierInput.
// The error was likely due to re-declaring them or some mixup in previous edit.
// Let's just define Supplier correctly.
export interface Supplier extends SupplierInput {
    id: string;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}

export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    RETURN = 'RETURN',
    SALE = 'SALE'
}

export interface StockMovementInput {
    product_id: string;
    variant_id?: string | null;
    change_quantity: number;
    type: StockMovementType;
    reference_id?: string; // Order ID, etc.
    reason?: string;
    performed_by?: string; // User ID
}

export interface StockMovement extends StockMovementInput {
    id: string;
    created_at: Date;
    quantity_after: number;
}

export interface InventorySummary {
    total_products: number;
    total_stock_value: number; // calculated if price is available
    low_stock_count: number;
    out_of_stock_count: number;
}

export enum AlertType {
    LOW_STOCK = 'LOW_STOCK',
    OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export interface AlertInput {
    merchant_id: string;
    product_id?: string;
    type: AlertType;
    message: string;
    is_read?: boolean;
}

export interface InventoryAlert extends AlertInput {
    id: string;
    created_at: Date;
}
