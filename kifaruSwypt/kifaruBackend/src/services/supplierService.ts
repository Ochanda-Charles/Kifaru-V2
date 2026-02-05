import { supplierRepository } from '../repositories/supplierRepository';
import { Supplier, SupplierInput } from '../interfaces/inventoryInterface';

export const supplierService = {
    createSupplier: async (merchantId: string, data: SupplierInput): Promise<Supplier> => {
        // Validate Email
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw new Error("Invalid email format.");
            }
        }

        // Ensure merchantId matches
        if (data.merchant_id !== merchantId) {
            throw new Error("Merchant ID mismatch.");
        }

        return await supplierRepository.createSupplier(data);
    },

    getSuppliers: async (merchantId: string, filters: { activeOnly?: boolean } = {}): Promise<Supplier[]> => {
        return await supplierRepository.getSuppliersByMerchant(merchantId, filters.activeOnly);
    },

    updateSupplier: async (id: string, merchantId: string, data: Partial<SupplierInput>): Promise<Supplier | null> => {
        // Validate ownership
        const supplier = await supplierRepository.getSupplierById(id);
        if (!supplier) throw new Error("Supplier not found");
        if (supplier.merchant_id !== merchantId) throw new Error("Unauthorized access to supplier");

        return await supplierRepository.updateSupplier(id, data);
    },

    deactivateSupplier: async (id: string, merchantId: string): Promise<boolean> => {
        // Validate ownership
        const supplier = await supplierRepository.getSupplierById(id);
        if (!supplier) throw new Error("Supplier not found");
        if (supplier.merchant_id !== merchantId) throw new Error("Unauthorized access to supplier");

        return await supplierRepository.deactivateSupplier(id);
    }
};
