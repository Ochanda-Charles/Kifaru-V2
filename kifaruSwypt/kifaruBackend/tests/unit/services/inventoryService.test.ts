import { inventoryService } from '../../../src/services/inventoryService';
import { inventoryRepository } from '../../../src/repositories/inventoryRepository';
import { alertService } from '../../../src/services/alertService';
import { StockMovementType } from '../../../src/interfaces/inventoryInterface';

jest.mock('../../../src/repositories/inventoryRepository');
jest.mock('../../../src/services/alertService');

describe('InventoryService', () => {
    const mockMerchantId = 'merchant-123';
    const mockProductId = 'product-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('adjustStock', () => {
        it('should increase stock for IN movement', async () => {
            (inventoryRepository.getStockByProductId as jest.Mock).mockResolvedValue({ quantity: 10 });
            (inventoryRepository.adjustStock as jest.Mock).mockResolvedValue({
                id: 'movement-1',
                product_id: mockProductId,
                change_quantity: 5,
                quantity_after: 15,
                type: StockMovementType.IN
            });

            const result = await inventoryService.adjustStock(mockProductId, null, 5, { type: StockMovementType.IN });

            expect(inventoryRepository.getStockByProductId).toHaveBeenCalledWith(mockProductId);
            expect(inventoryRepository.adjustStock).toHaveBeenCalledWith(mockProductId, null, 5, expect.objectContaining({ type: StockMovementType.IN }));
            expect(result.quantity_after).toBe(15);
        });

        it('should decrease stock for OUT movement', async () => {
            (inventoryRepository.getStockByProductId as jest.Mock).mockResolvedValue({ quantity: 10 });
            (inventoryRepository.adjustStock as jest.Mock).mockResolvedValue({
                id: 'movement-2',
                product_id: mockProductId,
                change_quantity: -3,
                quantity_after: 7,
                type: StockMovementType.OUT
            });

            const result = await inventoryService.adjustStock(mockProductId, null, -3, { type: StockMovementType.OUT });

            expect(result.quantity_after).toBe(7);
        });

        it('should throw error if OUT would cause negative stock', async () => {
            (inventoryRepository.getStockByProductId as jest.Mock).mockResolvedValue({ quantity: 2 });

            await expect(inventoryService.adjustStock(mockProductId, null, -5, { type: StockMovementType.OUT }))
                .rejects
                .toThrow('Invalid adjustment: Stock cannot go negative');

            expect(inventoryRepository.adjustStock).not.toHaveBeenCalled();
        });
    });

    describe('generateInventoryReport', () => {
        it('should calculate correct summary totals', async () => {
            const mockSummary = {
                total_products: 100,
                total_stock_value: 5000,
                low_stock_count: 5,
                out_of_stock_count: 2
            };
            (inventoryRepository.getInventorySummary as jest.Mock).mockResolvedValue(mockSummary);

            const result = await inventoryService.generateInventoryReport(mockMerchantId);

            expect(inventoryRepository.getInventorySummary).toHaveBeenCalledWith(mockMerchantId);
            expect(result).toEqual(mockSummary);
        });
    });

    describe('checkLowStock', () => {
        it('should trigger alert when stock falls below threshold', async () => {
            const mockLowStockProducts = [
                { id: 'p1', quantity: 5, merchant_id: mockMerchantId },
                { id: 'p2', quantity: 2, merchant_id: mockMerchantId }
            ];
            (inventoryRepository.getLowStockProducts as jest.Mock).mockResolvedValue(mockLowStockProducts);

            await inventoryService.checkLowStock(mockMerchantId);

            expect(inventoryRepository.getLowStockProducts).toHaveBeenCalledWith(mockMerchantId);
            expect(alertService.triggerLowStockAlert).toHaveBeenCalledTimes(2);
            expect(alertService.triggerLowStockAlert).toHaveBeenCalledWith(mockMerchantId, 'p1', 5, 10);
        });
    });
});
