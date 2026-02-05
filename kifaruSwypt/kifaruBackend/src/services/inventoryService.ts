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
        // Repo doesn't support pagination natively yet in signature, it returns all.
        // We can do in-memory pagination for MVP or update Repo.
        // Task says "Add pagination". Ideally update repo, but let's wrap for now or update repo signature?
        // Prompt asked to "Add pagination" in service.
        const allMovements = await inventoryRepository.getStockMovements(productId, filters);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const data = allMovements.slice(startIndex, endIndex);
        const total = allMovements.length;

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
        // Find products below threshold
        const products = await inventoryRepository.getLowStockProducts(merchantId);

        for (const product of products) {
            // Threshold is hardcoded 10 in repo default, or passed.
            // Trigger alert
            await alertService.triggerLowStockAlert(merchantId, product.id, product.quantity, 10);
        }
    }
};
