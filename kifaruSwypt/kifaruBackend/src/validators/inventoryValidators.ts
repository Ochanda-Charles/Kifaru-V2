import Joi from 'joi';
import { StockMovementType, AlertType } from '../interfaces/inventoryInterface';

// Category Validators
export const createCategorySchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    parent_id: Joi.string().uuid().allow(null)
});

export const updateCategorySchema = Joi.object({
    name: Joi.string(),
    description: Joi.string().allow('', null),
    parent_id: Joi.string().uuid().allow(null)
});

// Supplier Validators
export const createSupplierSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null)
});

export const updateSupplierSchema = Joi.object({
    name: Joi.string(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null)
});

// Inventory Validators
export const adjustStockSchema = Joi.object({
    product_id: Joi.string().uuid().required(),
    variant_id: Joi.string().uuid().allow(null),
    movement_type: Joi.string().valid(...Object.values(StockMovementType)).required(),
    quantity: Joi.number().integer().required(), // Can be negative for OUT/ADJUSTMENT, or handle logic in controller
    reason: Joi.string().allow('', null),
    supplier_id: Joi.string().uuid().allow(null),
    reference_id: Joi.string().allow('', null)
});

export const getMovementsQuerySchema = Joi.object({
    product_id: Joi.string().uuid().required(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    type: Joi.string().valid(...Object.values(StockMovementType)),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

export const getReportQuerySchema = Joi.object({
    type: Joi.string().valid('summary', 'movements', 'low_stock', 'value').required(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso()
});
