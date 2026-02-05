import { categoryService } from '../../../src/services/categoryService';
import { categoryRepository } from '../../../src/repositories/categoryRepository';

jest.mock('../../../src/repositories/categoryRepository');

describe('CategoryService', () => {
    const mockMerchantId = 'merchant-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCategory', () => {
        it('should create category if name is unique', async () => {
            (categoryRepository.getCategoriesByMerchant as jest.Mock).mockResolvedValue([]);
            (categoryRepository.createCategory as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'New Cat' });

            const result = await categoryService.createCategory(mockMerchantId, { name: 'New Cat', merchant_id: mockMerchantId });

            expect(result).toBeDefined();
            expect(categoryRepository.createCategory).toHaveBeenCalled();
        });

        it('should throw error if name already exists', async () => {
            (categoryRepository.getCategoriesByMerchant as jest.Mock).mockResolvedValue([{ id: 'cat-1', name: 'Existing Cat' }]);

            await expect(categoryService.createCategory(mockMerchantId, { name: 'Existing Cat', merchant_id: mockMerchantId }))
                .rejects
                .toThrow("Category with name 'Existing Cat' already exists");
        });
    });

    describe('getCategoryTree', () => {
        it('should build hierarchical tree', async () => {
            const mockCategories = [
                { id: '1', name: 'Parent', parent_id: null, children: [] },
                { id: '2', name: 'Child', parent_id: '1', children: [] }
            ];
            (categoryRepository.getCategoriesByMerchant as jest.Mock).mockResolvedValue(mockCategories);

            const tree = await categoryService.getCategoryTree(mockMerchantId);

            expect(tree).toHaveLength(1);
            expect(tree[0].id).toBe('1');
            expect(tree[0].children).toHaveLength(1);
            expect(tree[0].children[0].id).toBe('2');
        });
    });

    describe('deleteCategory', () => {
        it('should delete category if unused', async () => {
            (categoryRepository.getCategoryById as jest.Mock).mockResolvedValue({ id: 'cat-1', merchant_id: mockMerchantId });
            (categoryRepository.hasProducts as jest.Mock).mockResolvedValue(false);
            (categoryRepository.deleteCategory as jest.Mock).mockResolvedValue(true);

            const result = await categoryService.deleteCategory('cat-1', mockMerchantId);
            expect(result).toBe(true);
        });

        it('should throw error if category has products', async () => {
            (categoryRepository.getCategoryById as jest.Mock).mockResolvedValue({ id: 'cat-1', merchant_id: mockMerchantId });
            (categoryRepository.hasProducts as jest.Mock).mockResolvedValue(true);

            await expect(categoryService.deleteCategory('cat-1', mockMerchantId))
                .rejects
                .toThrow("Cannot delete category: It contains products.");
        });
    });
});
