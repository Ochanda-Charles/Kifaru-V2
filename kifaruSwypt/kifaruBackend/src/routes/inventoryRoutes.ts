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
router.post('/inventory/adjust', verifyToken, asyncHandler(adjustStock));
router.get('/inventory/movements', verifyToken, asyncHandler(getMovements));
router.get('/inventory/report', verifyToken, asyncHandler(getReport));
router.get('/inventory/alerts', verifyToken, asyncHandler(getAlerts));
router.put('/inventory/alerts/:id/read', verifyToken, asyncHandler(markAlertRead));

// Public Checkout Endpoint
router.post('/inventory/checkout', asyncHandler(processCheckout));

export default router;
