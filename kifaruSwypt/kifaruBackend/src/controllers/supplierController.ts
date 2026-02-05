import { Request, Response } from 'express';
import { supplierRepository } from '../repositories/supplierRepository';
import { createSupplierSchema, updateSupplierSchema } from '../validators/inventoryValidators';
import { ExtendedUserRequest } from '../middlewares/VerifyToken';

export const createSupplier = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const { error, value } = createSupplierSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const merchant_id = req.info?.user_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const supplier = await supplierRepository.createSupplier({ ...value, merchant_id });
        return res.status(201).json({ success: true, data: supplier });
    } catch (err: any) {
        console.error('Error in createSupplier:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getSuppliers = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const merchant_id = req.info?.user_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const suppliers = await supplierRepository.getSuppliersByMerchant(merchant_id);
        return res.status(200).json({ success: true, data: suppliers });
    } catch (err: any) {
        console.error('Error in getSuppliers:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const supplier = await supplierRepository.getSupplierById(id);
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        return res.status(200).json({ success: true, data: supplier });
    } catch (err: any) {
        console.error('Error in getSupplierById:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { error, value } = updateSupplierSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const supplier = await supplierRepository.updateSupplier(id, value);
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        return res.status(200).json({ success: true, data: supplier });
    } catch (err: any) {
        console.error('Error in updateSupplier:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const deleted = await supplierRepository.deleteSupplier(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        return res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (err: any) {
        console.error('Error in deleteSupplier:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};
