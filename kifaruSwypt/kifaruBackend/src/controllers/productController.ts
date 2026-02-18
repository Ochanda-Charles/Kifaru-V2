import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { inventoryRepository } from '../repositories/inventoryRepository';
import { ExtendedUserRequest } from '../middlewares/VerifyToken';
import Joi from 'joi';

const createProductSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().integer().min(0).required(),
    category_id: Joi.string().uuid().allow(null),
    supplier_id: Joi.string().uuid().allow(null),
    image_url: Joi.string().uri().required(),
    sku: Joi.string().allow('', null),
    low_stock_threshold: Joi.number().integer().min(0).default(10),
    bestseller: Joi.boolean().default(false),
    new: Joi.boolean().default(true)
});

export const createProduct = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const merchant_id = req.info?.merchant_id;

        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Merchant ID missing' });
        }

        const { error, value } = createProductSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const productData = {
            ...value,
            id: uuidv4(),
            merchant_id: merchant_id
        };

        const newProduct = await inventoryRepository.createProduct(productData);

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });

    } catch (error: any) {
        console.error('Error in createProduct:', error);
        return res.status(500).json({ success: false, error: 'Server Error occurred while creating product' });
    }
};
