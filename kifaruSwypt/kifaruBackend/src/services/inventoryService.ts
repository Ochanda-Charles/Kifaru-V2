import { inventoryRepository } from '../repositories/inventoryRepository';
import { alertService } from './alertService';
import { StockMovementInput, StockMovement, InventorySummary, StockMovementType } from '../interfaces/inventoryInterface';
import { v4 as uuidv4 } from 'uuid'; // Standardizing on v4

export const inventoryService = {
    adjustStock: async (
        productId: string,
        variantId: string | null,
        change: number,
        movementData: Partial<StockMovementInput>
    ): Promise<StockMovement> => {
        // 1. Get current stock to validate
        const currentStock = await inventoryRepository.getStockByProductId(productId);
        const newQuantity = currentStock.quantity + change;

        // Business Rule: Stock cannot go negative
        if (newQuantity < 0) {
            throw new Error(`Invalid adjustment: Stock cannot go negative. Current: ${currentStock.quantity}, Change: ${change}`);
        }

        // 2. Perform Adjustment & Log Movement
        const movementDataFull: Partial<StockMovementInput> = {
            ...movementData,
            type: movementData.type || (change > 0 ? StockMovementType.IN : StockMovementType.OUT)
        };

        const movement = await inventoryRepository.adjustStock(productId, variantId, change, movementDataFull);

        // 3. Check for Low Stock Alert
        const LOW_STOCK_THRESHOLD = 10;
        if (newQuantity <= LOW_STOCK_THRESHOLD) {
            const product = await inventoryRepository.getProductById(productId);
            if (product && product.merchant_id) {
                try {
                    await alertService.triggerLowStockAlert(
                        product.merchant_id,
                        productId,
                        newQuantity,
                        LOW_STOCK_THRESHOLD
                    );
                } catch (alertError) {
                    console.error('Failed to trigger low stock alert:', alertError);
                    // Don't fail the whole adjustment if alert fails
                }
            }
        }

        return movement;
    },

    getStockMovementHistory: async (
        productId: string,
        page: number = 1,
        limit: number = 20,
        filters: { startDate?: Date, endDate?: Date, type?: StockMovementType } = {}
    ): Promise<{ data: StockMovement[], total: number, page: number, totalPages: number }> => {
        // Delegate pagination to the database — only the requested page is fetched
        const { data, total } = await inventoryRepository.getStockMovementsPaginated(
            productId,
            filters,
            { page, limit }
        );

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    generateInventoryReport: async (merchantId: string): Promise<InventorySummary> => {
        // Currently just a wrap around getInventorySummary
        return await inventoryRepository.getInventorySummary(merchantId);
    },

    checkLowStock: async (merchantId: string): Promise<void> => {
        const products = await inventoryRepository.getLowStockProducts(merchantId);

        for (const product of products) {
            await alertService.triggerLowStockAlert(merchantId, product.id, product.quantity, product.low_stock_threshold ?? 10);
        }
    }
};
