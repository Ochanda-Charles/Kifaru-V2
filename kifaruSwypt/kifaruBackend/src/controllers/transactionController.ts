import { Response } from 'express';
import { ExtendedUserRequest } from '../middlewares/VerifyToken';
import { transactionRepository } from '../repositories/transactionRepository';

/**
 * GET /inventory/transactions?page=1&limit=20&status=COMPLETED
 * List transactions for the authenticated merchant, paginated.
 */
export const getTransactions = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const merchant_id = req.info?.merchant_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;
        const status = (req.query.status as string)?.toUpperCase();

        const [transactions, total] = await Promise.all([
            transactionRepository.getTransactionsByMerchant(merchant_id, limit, offset, status),
            transactionRepository.getTransactionCount(merchant_id, status)
        ]);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err: any) {
        console.error('Error fetching transactions:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
};

/**
 * GET /inventory/transactions/:id
 * Get a single transaction by ID (scoped to the authenticated merchant).
 */
export const getTransactionById = async (req: ExtendedUserRequest, res: Response) => {
    try {
        const merchant_id = req.info?.merchant_id;
        if (!merchant_id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const id = req.params.id as string;
        const transaction = await transactionRepository.getTransactionById(id, merchant_id as string);

        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        return res.status(200).json({ success: true, data: transaction });

    } catch (err: any) {
        console.error('Error fetching transaction:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
    }
};
