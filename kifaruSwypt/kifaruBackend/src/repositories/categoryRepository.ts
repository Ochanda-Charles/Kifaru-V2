import { sqlConfig } from '../config/sqlConfig';
import { v4 } from 'uuid';
import { Category, CategoryInput } from '../interfaces/inventoryInterface';

export const categoryRepository = {
    createCategory: async (data: CategoryInput): Promise<Category> => {
        const id = v4();
        const query = `
      INSERT INTO Categories (id, merchant_id, name, description, parent_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const values = [id, data.merchant_id, data.name, data.description || null, data.parent_id || null];
        const result = await sqlConfig.query(query, values);
        return result.rows[0];
    },

    getCategoriesByMerchant: async (merchantId: string): Promise<Category[]> => {
        const query = 'SELECT * FROM Categories WHERE merchant_id = $1 ORDER BY name ASC';
        const result = await sqlConfig.query(query, [merchantId]);
        return result.rows;
    },

    getCategoryById: async (id: string): Promise<Category | null> => {
        const query = 'SELECT * FROM Categories WHERE id = $1';
        const result = await sqlConfig.query(query, [id]);
        return result.rows[0] || null;
    },

    updateCategory: async (id: string, data: Partial<CategoryInput>): Promise<Category | null> => {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(data.description);
        }
        if (data.parent_id !== undefined) {
            fields.push(`parent_id = $${paramCount++}`);
            values.push(data.parent_id);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
      UPDATE Categories SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await sqlConfig.query(query, values);
        return result.rows[0] || null;
    },

    deleteCategory: async (id: string): Promise<boolean> => {
        const query = 'DELETE FROM Categories WHERE id = $1';
        const result = await sqlConfig.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    },

    hasProducts: async (categoryId: string): Promise<boolean> => {
        const query = 'SELECT COUNT(*) as count FROM Products WHERE category_id = $1';
        const result = await sqlConfig.query(query, [categoryId]);
        return parseInt(result.rows[0].count) > 0;
    }
};
