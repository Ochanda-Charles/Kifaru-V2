import { Router } from 'express';
import { verifyToken } from '../middlewares/VerifyToken';
import {
    getWidgetUrl,
    handleWebhook,
    syncOrders
} from '../controllers/fonbnkController';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Generate signed Fonbnk Pay Widget URL for on-ramp (KES → USDT on Celo)
router.post('/widget-url', asyncHandler(getWidgetUrl));

// Webhook endpoint for Fonbnk payment notifications
router.post('/webhook', asyncHandler(handleWebhook));

// Sync completed orders from Fonbnk API into local Transactions table
router.get('/sync-orders', verifyToken, asyncHandler(syncOrders));

export default router;
