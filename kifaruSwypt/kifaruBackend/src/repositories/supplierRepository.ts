import { sqlConfig } from '../config/sqlConfig';
import { v4 } from 'uuid';
import { Supplier, SupplierInput } from '../interfaces/inventoryInterface';

export const supplierRepository = {
    createSupplier: async (data: SupplierInput): Promise<Supplier> => {
        const id = v4();
        const query = `
    INSERT INTO Suppliers (id, merchant_id, name, contact_email, phone, address, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
        const values = [
            id,
            data.merchant_id,
            data.name,
            data.email || null,
            data.phone || null,
            data.address || null,
            data.is_active !== undefined ? data.is_active : true
        ];
        const result = await sqlConfig.query(query, values);
        return result.rows[0];
    },

    getSuppliersByMerchant: async (merchantId: string, activeOnly: boolean = false): Promise<Supplier[]> => {
        let query = 'SELECT * FROM Suppliers WHERE merchant_id = $1';
        const values: any[] = [merchantId];

        if (activeOnly) {
            query += ' AND is_active = true';
        }

        query += ' ORDER BY name ASC';
        const result = await sqlConfig.query(query, values);
        return result.rows;
    },

    getSupplierById: async (id: string): Promise<Supplier | null> => {
        const query = 'SELECT * FROM Suppliers WHERE id = $1';
        const result = await sqlConfig.query(query, [id]);
        return result.rows[0] || null;
    },

    updateSupplier: async (id: string, data: Partial<SupplierInput>): Promise<Supplier | null> => {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.email !== undefined) {
            fields.push(`contact_email = $${paramCount++}`);
            values.push(data.email);
        }
        if (data.phone !== undefined) {
            fields.push(`phone = $${paramCount++}`);
            values.push(data.phone);
        }
        if (data.address !== undefined) {
            fields.push(`address = $${paramCount++}`);
            values.push(data.address);
        }
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(data.is_active);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
      UPDATE Suppliers SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await sqlConfig.query(query, values);
        return result.rows[0] || null;
    },

    deactivateSupplier: async (id: string): Promise<boolean> => {
        const query = 'UPDATE Suppliers SET is_active = false WHERE id = $1';
        const result = await sqlConfig.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    },

    deleteSupplier: async (id: string): Promise<boolean> => {
        const query = 'DELETE FROM Suppliers WHERE id = $1';
        const result = await sqlConfig.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }
};
