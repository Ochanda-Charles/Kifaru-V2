import { sqlConfig } from '../config/sqlConfig';
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
    id: string;
    merchant_id?: string;
    total_amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    customer_details: any;
    payment_metadata: any;
    created_at: Date;
}

const INSERT_TRANSACTION_QUERY = `
    INSERT INTO Transactions (id, merchant_id, total_amount, currency, status, customer_details, payment_metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
`;

export const transactionRepository = {
    createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
        const id = uuidv4();
        const values = [
            id,
            data.merchant_id || null,
            data.total_amount,
            data.currency || 'KES',
            data.status || 'COMPLETED',
            JSON.stringify(data.customer_details || {}),
            JSON.stringify(data.payment_metadata || {})
        ];
        const result = await sqlConfig.query(INSERT_TRANSACTION_QUERY, values);
        return result.rows[0];
    },

    // Use this variant when running inside an externally managed DB transaction
    createTransactionWithClient: async (client: PoolClient, data: Partial<Transaction>): Promise<Transaction> => {
        const id = uuidv4();
        const values = [
            id,
            data.merchant_id || null,
            data.total_amount,
            data.currency || 'KES',
            data.status || 'PENDING',
            JSON.stringify(data.customer_details || {}),
            JSON.stringify(data.payment_metadata || {})
        ];
        const result = await client.query(INSERT_TRANSACTION_QUERY, values);
        return result.rows[0];
    },

    getTransactionsByMerchant: async (
        merchant_id: string,
        limit: number = 20,
        offset: number = 0,
        status?: string
    ): Promise<Transaction[]> => {
        let query = `
            SELECT DISTINCT t.*
            FROM Transactions t
            LEFT JOIN StockMovements sm ON sm.reference_id = t.id::text
            LEFT JOIN Products p ON p.id = sm.product_id
            WHERE (
                t.merchant_id = $1
                OR (t.merchant_id IS NULL AND p.merchant_id = $1)
            )
        `;
        const values: any[] = [merchant_id];

        if (status && ['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
            values.push(status);
            query += ` AND t.status = $${values.length}`;
        }

        values.push(limit, offset);
        query += ` ORDER BY t.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;

        const result = await sqlConfig.query(query, values);
        return result.rows;
    },

    getTransactionCount: async (merchant_id: string, status?: string): Promise<number> => {
        let query = `
            SELECT COUNT(DISTINCT t.id)::int as count
            FROM Transactions t
            LEFT JOIN StockMovements sm ON sm.reference_id = t.id::text
            LEFT JOIN Products p ON p.id = sm.product_id
            WHERE (
                t.merchant_id = $1
                OR (t.merchant_id IS NULL AND p.merchant_id = $1)
            )
        `;
        const values: any[] = [merchant_id];

        if (status && ['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
            values.push(status);
            query += ` AND t.status = $${values.length}`;
        }

        const result = await sqlConfig.query(query, values);
        return result.rows[0].count;
    },

    getTransactionById: async (id: string, merchant_id: string): Promise<Transaction | null> => {
        const result = await sqlConfig.query(
            `
            SELECT DISTINCT t.*
            FROM Transactions t
            LEFT JOIN StockMovements sm ON sm.reference_id = t.id::text
            LEFT JOIN Products p ON p.id = sm.product_id
            WHERE t.id = $1
              AND (
                t.merchant_id = $2
                OR (t.merchant_id IS NULL AND p.merchant_id = $2)
              )
            LIMIT 1
            `,
            [id, merchant_id]
        );
        return result.rows[0] || null;
    }
};
