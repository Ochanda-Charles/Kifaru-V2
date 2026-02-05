import { sqlConfig } from '../config/sqlConfig';
import { v4 } from 'uuid';
import { InventoryAlert, AlertInput } from '../interfaces/inventoryInterface';

export const alertRepository = {
    createAlert: async (data: AlertInput): Promise<InventoryAlert> => {
        const id = v4();
        const query = `
      INSERT INTO InventoryAlerts (id, merchant_id, product_id, alert_type, message, is_read)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const values = [
            id,
            data.merchant_id,
            data.product_id || null,
            data.type,
            data.message,
            data.is_read || false
        ];
        const result = await sqlConfig.query(query, values);
        return result.rows[0];
    },

    getAlertsByMerchant: async (merchantId: string, unreadOnly: boolean = false): Promise<InventoryAlert[]> => {
        let query = 'SELECT * FROM InventoryAlerts WHERE merchant_id = $1';
        const values: any[] = [merchantId];

        if (unreadOnly) {
            query += ' AND is_read = false';
        }

        query += ' ORDER BY created_at DESC';

        const result = await sqlConfig.query(query, values);
        return result.rows;
    },

    markAlertAsRead: async (alertId: string): Promise<boolean> => {
        const query = 'UPDATE InventoryAlerts SET is_read = true WHERE id = $1';
        const result = await sqlConfig.query(query, [alertId]);
        return (result.rowCount ?? 0) > 0;
    },

    markAllAlertsAsRead: async (merchantId: string): Promise<boolean> => {
        const query = 'UPDATE InventoryAlerts SET is_read = true WHERE merchant_id = $1 AND is_read = false';
        const result = await sqlConfig.query(query, [merchantId]);
        return (result.rowCount ?? 0) > 0;
    }
};
