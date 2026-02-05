import { alertRepository } from '../repositories/alertRepository';
import { AlertType, InventoryAlert } from '../interfaces/inventoryInterface';

export const alertService = {
    triggerLowStockAlert: async (merchantId: string, productId: string, currentStock: number, threshold: number): Promise<InventoryAlert | null> => {
        // Optional: Check if an unread low stock alert already exists for this product to avoid spam
        // For now, per requirements: "Alert created when stock <= threshold"

        // Simple optimization: check if we already have an unread alert for this product? 
        // repo doesn't support 'getAlertByProduct' well efficiently without filtering, 
        // but let's assume we just create it as per strict requirement.

        const alertData = {
            merchant_id: merchantId,
            product_id: productId,
            type: AlertType.LOW_STOCK,
            message: `Product stock is low (${currentStock}). Threshold is ${threshold}.`,
            is_read: false
        };

        return await alertRepository.createAlert(alertData);
    },

    getUnreadAlerts: async (merchantId: string): Promise<InventoryAlert[]> => {
        return await alertRepository.getAlertsByMerchant(merchantId, true);
    },

    dismissAlert: async (alertId: string): Promise<boolean> => {
        return await alertRepository.markAlertAsRead(alertId);
    },

    dismissAllAlerts: async (merchantId: string): Promise<boolean> => {
        return await alertRepository.markAllAlertsAsRead(merchantId);
    }
};
