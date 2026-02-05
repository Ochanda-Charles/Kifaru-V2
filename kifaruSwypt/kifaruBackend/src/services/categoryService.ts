import { categoryRepository } from '../repositories/categoryRepository';
import { Category, CategoryInput } from '../interfaces/inventoryInterface';
import { v4 as uuidv4 } from 'uuid';

export const categoryService = {
    createCategory: async (merchantId: string, data: CategoryInput): Promise<Category> => {
        // Validation: Unique name per merchant
        const existingCategories = await categoryRepository.getCategoriesByMerchant(merchantId);
        const duplicate = existingCategories.find(c => c.name.toLowerCase() === data.name.toLowerCase());

        if (duplicate) {
            throw new Error(`Category with name '${data.name}' already exists.`);
        }

        // Ensure merchantId in data matches context
        if (data.merchant_id !== merchantId) {
            throw new Error("Merchant ID mismatch.");
        }

        return await categoryRepository.createCategory(data);
    },

    getCategoryTree: async (merchantId: string): Promise<any[]> => {
        const categories = await categoryRepository.getCategoriesByMerchant(merchantId);

        // Build Tree
        const categoryMap = new Map();
        const tree: any[] = [];

        // Initialize map
        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

        // Link children to parents
        categories.forEach(cat => {
            if (cat.parent_id) {
                const parent = categoryMap.get(cat.parent_id);
                if (parent) {
                    parent.children.push(categoryMap.get(cat.id));
                }
            } else {
                tree.push(categoryMap.get(cat.id));
            }
        });

        return tree;
    },

    updateCategory: async (id: string, merchantId: string, data: Partial<CategoryInput>): Promise<Category | null> => {
        // Validate ownership
        const category = await categoryRepository.getCategoryById(id);
        if (!category) throw new Error("Category not found");
        if (category.merchant_id !== merchantId) throw new Error("Unauthorized access to category");

        return await categoryRepository.updateCategory(id, data);
    },

    deleteCategory: async (id: string, merchantId: string): Promise<boolean> => {
        // Validate ownership
        const category = await categoryRepository.getCategoryById(id);
        if (!category) throw new Error("Category not found");
        if (category.merchant_id !== merchantId) throw new Error("Unauthorized access to category");

        // Check for products using category
        // Assuming categoryRepository has hasProducts method as per plan/updates
        const inUse = await categoryRepository.hasProducts(id);
        if (inUse) {
            throw new Error("Cannot delete category: It contains products.");
        }

        return await categoryRepository.deleteCategory(id);
    }
};
