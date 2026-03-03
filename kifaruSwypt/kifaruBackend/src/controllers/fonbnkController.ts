import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { sqlConfig } from '../config/sqlConfig';

const FONBNK_WIDGET_BASE = process.env.FONBNK_BASE_URL || 'https://sandbox-pay.fonbnk.com';
const DEFAULT_MERCHANT_WALLET = '0xb0e52a9da92a7815d493f683f2719d797e92ff43';
const DEFAULT_CURRENCY = 'KES';

const COMPLETED_STATUSES = new Set([
    'completed',
    'complete',
    'payout_successful',
    'swap_seller_confirmed',
]);

const FAILED_STATUSES = new Set([
    'failed',
    'payout_failed',
    'swap_expired',
    'swap_buyer_rejected',
    'swap_seller_rejected',
]);

const pickString = (...values: any[]): string | null => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return null;
};

const pickNumber = (...values: any[]): number | null => {
    for (const value of values) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return null;
};

const mapStatus = (status: string | null): 'COMPLETED' | 'FAILED' | 'PENDING' => {
    if (!status) return 'PENDING';
    const s = status.toLowerCase();
    if (COMPLETED_STATUSES.has(s)) return 'COMPLETED';
    if (FAILED_STATUSES.has(s)) return 'FAILED';
    return 'PENDING';
};

const verifyWebhookSignature = (
    payload: any,
    secret: string,
    receivedSignature?: string | null
): boolean => {
    if (!secret || !receivedSignature) return true;

    const body = JSON.stringify(payload);

    // Current Fonbnk v2 docs:
    // x-signature === SHA256(JSON.stringify(body) + SHA256(secret))
    const hashedSecret = crypto.createHash('sha256').update(secret, 'utf8').digest('hex');
    const v2Signature = crypto.createHash('sha256').update(body).update(hashedSecret).digest('hex');

    // Backward compatibility for legacy handlers that used HMAC.
    const legacyHmacSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    return receivedSignature === v2Signature || receivedSignature === legacyHmacSignature;
};

const parseWebhookPayload = (payload: any) => {
    const order = payload?.data?.order || {};

    const orderId = pickString(
        payload?.orderId,
        payload?.data?.orderId,
        order?.orderId,
        order?.id
    );
    const orderParams = pickString(
        payload?.orderParams,
        payload?.merchantOrderParams,
        order?.merchantOrderParams
    );
    const status = pickString(payload?.status, payload?.data?.status, order?.status);

    const localCurrencyAmount = pickNumber(
        payload?.localCurrencyAmount,
        payload?.data?.localCurrencyAmount,
        order?.deposit?.cashout?.amountAfterFees,
        order?.deposit?.cashout?.amountBeforeFees
    );
    const cryptoAmount = pickNumber(
        payload?.cryptoAmount,
        payload?.data?.cryptoAmount,
        order?.payout?.cashout?.amountAfterFees,
        order?.payout?.cashout?.amountBeforeFees
    );

    const asset = pickString(
        payload?.asset,
        payload?.data?.asset,
        order?.payout?.currencyCode
    );
    const network = pickString(
        payload?.network,
        payload?.data?.network,
        order?.payout?.transaction?.meta?.network
    );
    const walletAddress = pickString(
        payload?.walletAddress,
        payload?.data?.walletAddress,
        order?.payout?.transaction?.meta?.walletAddress,
        order?.payout?.transaction?.meta?.address
    );

    const customerPhone = pickString(
        payload?.phoneNumber,
        payload?.phone,
        payload?.msisdn,
        payload?.data?.phoneNumber,
        payload?.data?.phone,
        payload?.data?.msisdn
    );
    const carrier = pickString(
        payload?.carrier,
        payload?.carrierName,
        payload?.data?.carrier,
        payload?.data?.carrierName
    );

    return {
        orderId,
        orderParams,
        status,
        localCurrencyAmount,
        cryptoAmount,
        asset,
        network,
        walletAddress,
        customerPhone,
        carrier,
    };
};

/**
 * Generate a signed Fonbnk Pay Widget URL.
 *
 * Auth: JWT (HS256) signed with the "URL signature secret" from Fonbnk dashboard.
 * Each request gets a unique JWT (uid in payload) since Fonbnk rejects duplicate signatures.
 */
export const getWidgetUrl = async (req: Request, res: Response) => {
    try {
        const { amount, merchantWalletAddress, merchant_id } = req.body;

        if (!amount || isNaN(Number(amount))) {
            return res.status(400).json({ success: false, error: 'Valid amount is required' });
        }

        // Resolve wallet address: request body → DB lookup → hardcoded default
        let walletAddress = merchantWalletAddress;
        if (!walletAddress && merchant_id) {
            const result = await sqlConfig.query(
                'SELECT wallet_address FROM merchants WHERE merchant_id = $1',
                [merchant_id]
            );
            walletAddress = result.rows[0]?.wallet_address;
        }
        walletAddress = walletAddress || DEFAULT_MERCHANT_WALLET;

        const source = process.env.FONBNK_SOURCE;
        const signatureSecret = process.env.FONBNK_URL_SIGNATURE_SECRET;

        if (!source || !signatureSecret) {
            return res.status(500).json({ success: false, error: 'Fonbnk credentials not configured' });
        }

        // Per Fonbnk docs: "You can also provide URL configuration parameters
        // in the JWT token payload." Including address in the signed JWT
        // cryptographically binds the wallet to the signature, which is required
        // for the address/freezeWallet params to be accepted.
        const signature = jwt.sign(
            { uid: uuid(), address: walletAddress },
            signatureSecret,
            { algorithm: 'HS256' }
        );
        const orderParams = uuid();

        // Build widget URL with all on-ramp params
        const params = new URLSearchParams({
            source,
            signature,
            network: 'CELO',
            asset: 'USDT',
            address: walletAddress,
            amount: String(amount),
            orderParams,
            currency: 'local',
            countryIsoCode: 'KE',
            paymentChannel: 'mobile_money',
            freezeWallet: '1',
            freezeAmount: '1',
            flow: 'onramp'
        });

        // Use /auto-order — Fonbnk recommended path; auto-redirects to the
        // appropriate page based on which params are provided
        const widgetUrl = `${FONBNK_WIDGET_BASE}/auto-order?${params.toString()}`;

        console.log('[Fonbnk] wallet:', JSON.stringify(walletAddress), 'type:', typeof walletAddress, 'length:', walletAddress?.length);
        console.log('[Fonbnk] source:', source);
        console.log('[Fonbnk] widgetUrl:', widgetUrl);

        return res.status(200).json({
            success: true,
            data: { widgetUrl, orderParams }
        });

    } catch (err: any) {
        console.error('Fonbnk widget URL error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to generate payment URL' });
    }
};

/**
 * Webhook endpoint for Fonbnk payment notifications.
 * Configure this URL in your Fonbnk merchant dashboard.
 *
 * Supports both:
 * - Current v2 signature header: x-signature
 * - Legacy header: x-fonbnk-signature
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body || {};
        console.log('Fonbnk webhook received:', JSON.stringify(payload, null, 2));

        // Verify webhook signature (uses API signature secret from Fonbnk dashboard)
        const signatureSecret = process.env.FONBNK_API_SIGNATURE_SECRET;
        const receivedSignatureHeader = (req.headers['x-signature'] || req.headers['x-fonbnk-signature']) as string | string[] | undefined;
        const receivedSignature = Array.isArray(receivedSignatureHeader)
            ? receivedSignatureHeader[0]
            : receivedSignatureHeader;

        if (!verifyWebhookSignature(payload, signatureSecret || '', receivedSignature)) {
            console.error('Fonbnk webhook signature mismatch');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        if (signatureSecret && receivedSignature) {
            console.log('Fonbnk webhook signature verified');
        }

        const {
            orderId,
            orderParams,
            status,
            localCurrencyAmount,
            cryptoAmount,
            network,
            asset,
            walletAddress,
            customerPhone,
            carrier,
        } = parseWebhookPayload(payload);
        const dbStatus = mapStatus(status);

        console.log(`Order ${orderId}: status=${status}, fiat=${localCurrencyAmount}, crypto=${cryptoAmount} ${asset} on ${network} -> ${walletAddress}`);
        console.log(`[Fonbnk] customer phone: ${customerPhone}, carrier: ${carrier}`);

        const webhookData = {
            event: payload?.event || 'order-status-change',
            orderId,
            orderParams,
            status,
            localCurrencyAmount,
            cryptoAmount,
            network,
            asset,
            walletAddress,
            customerPhone,
            carrier,
            received_at: new Date().toISOString(),
        };

        let updatedRows = 0;

        // 1) Preferred match by known order identifiers
        const matchConditions: string[] = [];
        const matchValues: any[] = [dbStatus, JSON.stringify(webhookData)];
        if (orderId) {
            matchValues.push(orderId);
            matchConditions.push(`payment_metadata->>'fonbnk_order_id' = $${matchValues.length}`);
        }
        if (orderParams) {
            matchValues.push(orderParams);
            matchConditions.push(`payment_metadata->>'fonbnk_order_params' = $${matchValues.length}`);
        }

        if (matchConditions.length > 0) {
            const customerUpdate = customerPhone
                ? `, customer_details = jsonb_set(
                        COALESCE(customer_details, '{}'::jsonb),
                        '{phone}',
                        $${matchValues.length + 1}::jsonb,
                        true
                    )`
                : '';

            if (customerPhone) {
                matchValues.push(JSON.stringify(customerPhone));
            }

            const updateByOrderQuery = `
                UPDATE Transactions
                SET status = $1,
                    payment_metadata = jsonb_set(
                        COALESCE(payment_metadata, '{}'::jsonb),
                        '{fonbnk_webhook}',
                        $2::jsonb,
                        true
                    )${customerUpdate}
                WHERE ${matchConditions.join(' OR ')}
                RETURNING id`;

            const orderMatch = await sqlConfig.query(updateByOrderQuery, matchValues);
            updatedRows += orderMatch.rowCount || 0;
            console.log(`Transaction update by order id/params: ${orderMatch.rowCount} row(s) affected`);
        }

        // 2) Fallback match by amount (and wallet when available)
        if (updatedRows === 0 && localCurrencyAmount !== null) {
            console.log('[Fonbnk] No direct order match, trying amount-based fallback...');

            const fallbackParams: any[] = [dbStatus, JSON.stringify(webhookData), localCurrencyAmount];
            const walletFilter = walletAddress
                ? `AND EXISTS (
                        SELECT 1
                        FROM merchants m
                        WHERE m.merchant_id = t.merchant_id
                          AND LOWER(COALESCE(m.wallet_address, '')) = LOWER($4)
                    )`
                : '';
            if (walletAddress) fallbackParams.push(walletAddress);

            const fallback = await sqlConfig.query(
                `
                WITH candidate AS (
                    SELECT t.id
                    FROM Transactions t
                    WHERE t.created_at > NOW() - INTERVAL '2 hours'
                      AND ABS(t.total_amount - $3::numeric) <= 1
                      AND (t.payment_metadata->>'fonbnk_webhook') IS NULL
                      ${walletFilter}
                    ORDER BY t.created_at DESC
                    LIMIT 1
                )
                UPDATE Transactions t
                SET status = $1,
                    payment_metadata = jsonb_set(
                        COALESCE(t.payment_metadata, '{}'::jsonb),
                        '{fonbnk_webhook}',
                        $2::jsonb,
                        true
                    )
                FROM candidate c
                WHERE t.id = c.id
                RETURNING t.id
                `,
                fallbackParams
            );

            updatedRows += fallback.rowCount || 0;
            console.log(`Fallback update: ${fallback.rowCount} row(s) affected`);
        }

        // 3) Last fallback: create a new transaction from webhook if we can map to a merchant wallet
        if (updatedRows === 0 && localCurrencyAmount !== null && walletAddress) {
            const merchant = await sqlConfig.query(
                `SELECT merchant_id
                 FROM merchants
                 WHERE LOWER(COALESCE(wallet_address, '')) = LOWER($1)
                 LIMIT 1`,
                [walletAddress]
            );

            const merchantId = merchant.rows[0]?.merchant_id;
            if (merchantId) {
                const paymentMetadata = {
                    ...(orderId ? { fonbnk_order_id: orderId } : {}),
                    ...(orderParams ? { fonbnk_order_params: orderParams } : {}),
                    fonbnk_webhook: webhookData,
                };

                const inserted = await sqlConfig.query(
                    `
                    INSERT INTO Transactions (
                        id, merchant_id, total_amount, currency, status, customer_details, payment_metadata
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb
                    )
                    RETURNING id
                    `,
                    [
                        uuid(),
                        merchantId,
                        localCurrencyAmount,
                        DEFAULT_CURRENCY,
                        dbStatus,
                        JSON.stringify(customerPhone ? { phone: customerPhone } : {}),
                        JSON.stringify(paymentMetadata),
                    ]
                );
                updatedRows += inserted.rowCount || 0;
                console.log(`[Fonbnk] Inserted transaction ${inserted.rows[0]?.id} from webhook fallback`);
            } else {
                console.warn('[Fonbnk] Could not map webhook wallet to a merchant. No transaction created.');
            }
        }

        // Acknowledge receipt
        return res.status(200).json({ received: true });

    } catch (err: any) {
        console.error('Fonbnk webhook error:', err.message);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
};
