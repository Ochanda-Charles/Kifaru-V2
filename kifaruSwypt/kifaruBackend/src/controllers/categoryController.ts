import { Request, Response } from 'express';
import { categoryRepository } from '../repositories/categoryRepository';
import { createCategorySchema, updateCategorySchema } from '../validators/inventoryValidators';
import { ExtendedUserRequest } from '../middlewares/VerifyToken';

export const createCategory = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const { error, value } = createCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const merchant_id = req.info?.user_id; // Assuming user_id is the merchant_id
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const category = await categoryRepository.createCategory({ ...value, merchant_id });
        return res.status(201).json({ success: true, data: category });
    } catch (err: any) {
        console.error('Error in createCategory:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getCategories = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const merchant_id = req.info?.user_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const categories = await categoryRepository.getCategoriesByMerchant(merchant_id);
        return res.status(200).json({ success: true, data: categories });
    } catch (err: any) {
        console.error('Error in getCategories:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const category = await categoryRepository.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        return res.status(200).json({ success: true, data: category });
    } catch (err: any) {
        console.error('Error in getCategoryById:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { error, value } = updateCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const category = await categoryRepository.updateCategory(id, value);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        return res.status(200).json({ success: true, data: category });
    } catch (err: any) {
        console.error('Error in updateCategory:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const deleted = await categoryRepository.deleteCategory(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (err: any) {
        console.error('Error in deleteCategory:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};
