import { Router } from 'express';
import { verifyToken } from '../middlewares/VerifyToken';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} from '../controllers/supplierController';
import {
    adjustStock,
    getMovements,
    getReport,
    getAlerts,
    markAlertRead,
    processCheckout
} from '../controllers/inventoryController';
import { createProduct } from '../controllers/productController';
import { getTransactions, getTransactionById } from '../controllers/transactionController';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Categories
router.post('/categories', verifyToken, asyncHandler(createCategory));
router.get('/categories', verifyToken, asyncHandler(getCategories));
router.get('/categories/:id', verifyToken, asyncHandler(getCategoryById));
router.put('/categories/:id', verifyToken, asyncHandler(updateCategory));
router.delete('/categories/:id', verifyToken, asyncHandler(deleteCategory));

// Suppliers
router.post('/suppliers', verifyToken, asyncHandler(createSupplier));
router.get('/suppliers', verifyToken, asyncHandler(getSuppliers));
router.get('/suppliers/:id', verifyToken, asyncHandler(getSupplierById));
router.put('/suppliers/:id', verifyToken, asyncHandler(updateSupplier));
router.delete('/suppliers/:id', verifyToken, asyncHandler(deleteSupplier));

// Inventory
router.post('/products', verifyToken, asyncHandler(createProduct));
router.post('/adjust', verifyToken, asyncHandler(adjustStock));
router.get('/movements', verifyToken, asyncHandler(getMovements));
router.get('/report', verifyToken, asyncHandler(getReport));
router.get('/alerts', verifyToken, asyncHandler(getAlerts));
router.put('/alerts/:id/read', verifyToken, asyncHandler(markAlertRead));

// Transactions
router.get('/transactions', verifyToken, asyncHandler(getTransactions));
router.get('/transactions/:id', verifyToken, asyncHandler(getTransactionById));

// Public Checkout Endpoint
router.post('/checkout', asyncHandler(processCheckout));

// Diagnostic: check raw transaction count (remove in production)
router.get('/transactions-debug', verifyToken, asyncHandler(async (req: any, res: any) => {
    const { sqlConfig } = await import('../config/sqlConfig');
    const merchant_id = req.info?.merchant_id;

    const [allCount, merchantCount, sample] = await Promise.all([
        sqlConfig.query('SELECT COUNT(*)::int as count FROM Transactions'),
        sqlConfig.query('SELECT COUNT(*)::int as count FROM Transactions WHERE merchant_id = $1', [merchant_id]),
        sqlConfig.query('SELECT id, merchant_id, total_amount, status, created_at FROM Transactions ORDER BY created_at DESC LIMIT 5'),
    ]);

    res.json({
        your_merchant_id: merchant_id,
        total_transactions_in_db: allCount.rows[0].count,
        transactions_for_your_merchant: merchantCount.rows[0].count,
        latest_5_transactions: sample.rows,
    });
}));

export default router;
