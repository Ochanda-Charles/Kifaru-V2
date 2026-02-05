-- Create Transactions Table
CREATE TABLE IF NOT EXISTS Transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    status VARCHAR(20) DEFAULT 'COMPLETED', -- Assuming reliable success from frontend for now
    customer_details JSONB DEFAULT '{}',
    payment_metadata JSONB DEFAULT '{}', -- Store transactionId etc from Swypt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON Transactions(created_at);
