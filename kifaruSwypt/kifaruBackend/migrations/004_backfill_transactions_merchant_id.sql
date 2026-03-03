-- Backfill orphan transactions that were created without merchant_id.
-- We infer merchant_id from StockMovements.reference_id -> Products.merchant_id.
WITH inferred AS (
    SELECT
        t.id AS transaction_id,
        (
            SELECT p.merchant_id
            FROM StockMovements sm
            JOIN Products p ON p.id = sm.product_id
            WHERE sm.reference_id = t.id::text
            GROUP BY p.merchant_id
            ORDER BY COUNT(*) DESC, p.merchant_id
            LIMIT 1
        ) AS merchant_id
    FROM Transactions t
    WHERE t.merchant_id IS NULL
)
UPDATE Transactions t
SET merchant_id = i.merchant_id
FROM inferred i
WHERE t.id = i.transaction_id
  AND t.merchant_id IS NULL
  AND i.merchant_id IS NOT NULL;
