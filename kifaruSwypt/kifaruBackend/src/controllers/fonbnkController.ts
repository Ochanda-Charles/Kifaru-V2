import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { sqlConfig } from '../config/sqlConfig';

const FONBNK_WIDGET_BASE = process.env.FONBNK_BASE_URL || 'https://sandbox-pay.fonbnk.com';
const DEFAULT_MERCHANT_WALLET = '0xb0e52a9da92a7815d493f683f2719d797e92ff43';

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

        // Build widget URL with all on-ramp params
        const params = new URLSearchParams({
            source,
            signature,
            network: 'CELO',
            asset: 'USDT',
            address: walletAddress,
            amount: String(amount),
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
            data: { widgetUrl }
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
 * Fonbnk signs webhooks with an HMAC-SHA256 of the raw JSON body
 * using the client secret, sent in the x-fonbnk-signature header.
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log('Fonbnk webhook received:', JSON.stringify(payload, null, 2));

        // Verify webhook signature (uses API signature secret, not URL signature secret)
        const signatureSecret = process.env.FONBNK_API_SIGNATURE_SECRET;
        const receivedSignature = req.headers['x-fonbnk-signature'] as string | undefined;

        if (signatureSecret && receivedSignature) {
            const expectedSignature = crypto
                .createHmac('sha256', signatureSecret)
                .update(JSON.stringify(payload))
                .digest('hex');

            if (receivedSignature !== expectedSignature) {
                console.error('Fonbnk webhook signature mismatch');
                return res.status(401).json({ error: 'Invalid signature' });
            }
            console.log('Fonbnk webhook signature verified');
        }

        const { orderId, status, localCurrencyAmount, cryptoAmount, network, asset, walletAddress } = payload;
        // Extract customer phone — Fonbnk may use different field names
        const customerPhone = payload.phoneNumber || payload.phone || payload.msisdn || null;
        const carrier = payload.carrier || payload.carrierName || null;

        console.log(`Order ${orderId}: status=${status}, fiat=${localCurrencyAmount}, crypto=${cryptoAmount} ${asset} on ${network} -> ${walletAddress}`);
        console.log(`[Fonbnk] customer phone: ${customerPhone}, carrier: ${carrier}`);

        // Update matching transaction status in the database
        if (orderId && status) {
            const dbStatus = status === 'completed' ? 'COMPLETED' : status === 'failed' ? 'FAILED' : 'PENDING';

            const webhookData = {
                orderId, status, localCurrencyAmount, cryptoAmount,
                network, asset, walletAddress, customerPhone, carrier,
                received_at: new Date().toISOString()
            };

            // Also store customer phone in customer_details if available
            const customerUpdate = customerPhone
                ? `, customer_details = jsonb_set(
                       COALESCE(customer_details, '{}'::jsonb),
                       '{phone}',
                       $4::jsonb
                   )`
                : '';

            const query = `
                UPDATE Transactions
                SET status = $1,
                    payment_metadata = jsonb_set(
                        COALESCE(payment_metadata, '{}'::jsonb),
                        '{fonbnk_webhook}',
                        $2::jsonb
                    )${customerUpdate}
                WHERE payment_metadata->>'fonbnk_order_id' = $3`;

            const values: any[] = [dbStatus, JSON.stringify(webhookData), orderId];
            if (customerPhone) values.push(JSON.stringify(customerPhone));

            const result = await sqlConfig.query(query, values);

            console.log(`Transaction update: ${result.rowCount} row(s) affected for orderId=${orderId}`);

            // If no match by fonbnk_order_id, try to match by amount + recent timestamp as fallback
            if (result.rowCount === 0 && localCurrencyAmount) {
                console.log('[Fonbnk] No match by order_id, trying amount-based fallback...');
                const fallback = await sqlConfig.query(
                    `UPDATE Transactions
                     SET status = $1,
                         payment_metadata = jsonb_set(
                             COALESCE(payment_metadata, '{}'::jsonb),
                             '{fonbnk_webhook}',
                             $2::jsonb
                         )
                     WHERE total_amount = $3
                       AND status = 'PENDING'
                       AND created_at > NOW() - INTERVAL '30 minutes'
                       AND (payment_metadata->>'fonbnk_webhook') IS NULL
                     ORDER BY created_at DESC
                     LIMIT 1`,
                    [dbStatus, JSON.stringify(webhookData), parseFloat(localCurrencyAmount)]
                );
                console.log(`Fallback update: ${fallback.rowCount} row(s) affected`);
            }
        }

        // Acknowledge receipt
        return res.status(200).json({ received: true });

    } catch (err: any) {
        console.error('Fonbnk webhook error:', err.message);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
};
