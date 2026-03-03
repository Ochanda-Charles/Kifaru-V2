-- Add merchant_id to Transactions so we can associate transactions with merchants
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON Transactions(merchant_id);
