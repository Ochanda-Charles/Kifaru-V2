import { Request, Response } from 'express';
import { inventoryRepository } from '../repositories/inventoryRepository';
import { alertRepository } from '../repositories/alertRepository';
import { adjustStockSchema, getMovementsQuerySchema, getReportQuerySchema } from '../validators/inventoryValidators';
import { ExtendedUserRequest } from '../middlewares/VerifyToken';
import { StockMovementType } from '../interfaces/inventoryInterface';


export const adjustStock = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const { error, value } = adjustStockSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const { product_id, variant_id, movement_type, quantity, reason, supplier_id, reference_id } = value;
        const performed_by = req.info?.merchant_id;

        // Calculate change based on movement type (IN/OUT) if quantity is absolute
        let change = quantity;
        if (movement_type === StockMovementType.OUT && change > 0) {
            change = -change;
        }

        const movement = await inventoryRepository.adjustStock(
            product_id,
            variant_id,
            change,
            { type: movement_type, reason, reference_id, performed_by }
        );

        return res.status(200).json({ success: true, data: movement });
    } catch (err: any) {
        console.error('Error in adjustStock:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getMovements = async (req: Request, res: Response) => {
    try {
        const { error, value } = getMovementsQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const { product_id, start_date, end_date, type } = value;

        // Note: Pagination not fully implemented in repo yet, just passing filters
        const movements = await inventoryRepository.getStockMovements(product_id, {
            startDate: start_date,
            endDate: end_date,
            type: type
        });

        return res.status(200).json({ success: true, data: movements });
    } catch (err: any) {
        console.error('Error in getMovements:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getReport = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const { error, value } = getReportQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const merchant_id = req.info?.merchant_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { type, start_date, end_date } = value;
        let data;

        switch (type) {
            case 'summary':
                data = await inventoryRepository.getInventorySummary(merchant_id);
                break;
            case 'low_stock':
                data = await inventoryRepository.getLowStockProducts(merchant_id);
                break;
            case 'movements':
                data = await inventoryRepository.getMerchantStockMovements(merchant_id, {
                    startDate: start_date ? new Date(start_date) : undefined,
                    endDate: end_date ? new Date(end_date) : undefined
                });
                break;
            case 'valuation':
            case 'value':
                data = await inventoryRepository.getInventoryValuation(merchant_id);
                break;
            default:
                data = await inventoryRepository.getInventorySummary(merchant_id);
        }

        return res.status(200).json({ success: true, data });

    } catch (err: any) {
        console.error('Error in getReport:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getAlerts = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const merchant_id = req.info?.merchant_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const alerts = await alertRepository.getAlertsByMerchant(merchant_id);
        return res.status(200).json({ success: true, data: alerts });
    } catch (err: any) {
        console.error('Error in getAlerts:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const markAlertRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const success = await alertRepository.markAlertAsRead(id);

        if (!success) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        return res.status(200).json({ success: true, message: 'Alert marked as read' });
    } catch (err: any) {
        console.error('Error in markAlertRead:', err);
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const processCheckout = async (req: Request, res: Response) => {
    const { items, paymentData, customerDetails, merchant_id, fonbnkOrderId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid cart items' });
    }

    const { transactionRepository } = await import('../repositories/transactionRepository');
    const { sqlConfig } = await import('../config/sqlConfig');

    const client = await sqlConfig.connect();
    try {
        await client.query('BEGIN');

        // 1. Verify all products exist and fetch authoritative prices from the database.
        //    Never trust prices sent by the client.
        let totalAmount = 0;
        let resolvedMerchantId = merchant_id || null;
        const verifiedItems: Array<{ productId: string; quantity: number; unitPrice: number }> = [];

        for (const item of items) {
            const productId = item.product?.id || item.product_id || item.id;
            if (!productId) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, error: 'Cart item is missing a product ID' });
            }

            const dbProduct = await inventoryRepository.getProductById(productId);
            if (!dbProduct) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, error: `Product ${productId} not found` });
            }

            // Resolve merchant_id from the first product if not provided
            if (!resolvedMerchantId && dbProduct.merchant_id) {
                resolvedMerchantId = dbProduct.merchant_id;
            }

            const unitPrice = parseFloat(dbProduct.price);
            totalAmount += unitPrice * item.quantity;
            verifiedItems.push({ productId, quantity: item.quantity, unitPrice });
        }

        // Build payment_metadata, including fonbnk_order_id if provided
        const metadata = {
            ...(paymentData || {}),
            ...(fonbnkOrderId ? { fonbnk_order_id: fonbnkOrderId } : {})
        };

        // 2. Create the transaction as PENDING — only mark COMPLETED after all stock adjustments succeed
        const transaction = await transactionRepository.createTransactionWithClient(client, {
            merchant_id: resolvedMerchantId,
            total_amount: totalAmount,
            currency: 'KES',
            status: 'PENDING',
            customer_details: customerDetails,
            payment_metadata: metadata
        });

        // 3. Adjust stock for each item within the same transaction
        for (const item of verifiedItems) {
            await inventoryRepository.adjustStockWithClient(
                client,
                item.productId,
                null,
                -item.quantity,
                {
                    type: StockMovementType.SALE,
                    reason: 'Customer Purchase',
                    reference_id: transaction.id,
                }
            );
        }

        // 4. All adjustments succeeded — mark transaction COMPLETED and commit
        await client.query(
            'UPDATE Transactions SET status = $1 WHERE id = $2',
            ['COMPLETED', transaction.id]
        );

        await client.query('COMMIT');

        return res.status(200).json({ success: true, transactionId: transaction.id });

    } catch (err: unknown) {
        await client.query('ROLLBACK');
        const message = err instanceof Error ? err.message : 'Server Error';
        console.error('Error in processCheckout, transaction rolled back:', message);
        return res.status(500).json({ success: false, error: 'Checkout failed. No changes were made.' });
    } finally {
        client.release();
    }
};
