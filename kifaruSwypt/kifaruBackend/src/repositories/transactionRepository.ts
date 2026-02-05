import { sqlConfig } from '../config/sqlConfig';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
    id: string;
    total_amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    customer_details: any;
    payment_metadata: any;
    created_at: Date;
}

export const transactionRepository = {
    createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
        const id = uuidv4();
        const query = `
            INSERT INTO Transactions (id, total_amount, currency, status, customer_details, payment_metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            id,
            data.total_amount,
            data.currency || 'KES',
            data.status || 'COMPLETED',
            JSON.stringify(data.customer_details || {}),
            JSON.stringify(data.payment_metadata || {})
        ];

        const result = await sqlConfig.query(query, values);
        return result.rows[0];
    }
};
