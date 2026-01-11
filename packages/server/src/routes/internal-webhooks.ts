/**
 * Internal Webhook Endpoints
 *
 * These endpoints receive webhook payloads from OpenFacilitator's own
 * webhook system to trigger internal business logic like subscription activation.
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';
import crypto from 'crypto';
import {
  createSubscription,
  getActiveSubscription,
  extendSubscription,
  type SubscriptionTier,
} from '../db/subscriptions.js';
import { getUserWalletByAddress } from '../db/user-wallets.js';
import { getDatabase } from '../db/index.js';

const router: RouterType = Router();

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/internal/webhooks/subscription
 *
 * Receives payment_link.payment webhooks and activates subscriptions.
 * The payer must use their OpenFacilitator billing wallet.
 *
 * Required headers:
 * - X-Webhook-Signature: HMAC-SHA256 signature of the payload
 *
 * Environment:
 * - SUBSCRIPTION_WEBHOOK_SECRET: The webhook secret to verify signatures
 */
router.post('/subscription', async (req: Request, res: Response) => {
  const webhookSecret = process.env.SUBSCRIPTION_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Subscription Webhook] SUBSCRIPTION_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  // Get signature from headers
  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) {
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  // Verify signature
  const rawBody = JSON.stringify(req.body);
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn('[Subscription Webhook] Invalid signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // Parse webhook payload
  const { event, payment } = req.body;

  if (event !== 'payment_link.payment') {
    // Not a payment event, ignore
    res.json({ success: true, message: 'Event ignored' });
    return;
  }

  if (!payment?.payerAddress || !payment?.transactionHash) {
    res.status(400).json({ error: 'Invalid payment data' });
    return;
  }

  const { payerAddress, transactionHash, amount } = payment;

  console.log(`[Subscription Webhook] Processing payment from ${payerAddress}`);

  // Look up user by billing wallet address
  let userId: string | null = null;

  // Try exact match first
  const userWallet = getUserWalletByAddress(payerAddress);
  if (userWallet) {
    userId = userWallet.user_id;
  } else {
    // Try case-insensitive search for EVM addresses
    const db = getDatabase();
    const stmt = db.prepare('SELECT user_id FROM user_wallets WHERE LOWER(wallet_address) = LOWER(?)');
    const wallet = stmt.get(payerAddress) as { user_id: string } | undefined;
    if (wallet) {
      userId = wallet.user_id;
    }
  }

  if (!userId) {
    console.warn(`[Subscription Webhook] No user found for wallet ${payerAddress}`);
    res.status(200).json({
      success: false,
      error: 'User not found',
      message: `No user found with billing wallet ${payerAddress}. User must pay from their OpenFacilitator billing wallet.`,
    });
    return;
  }

  // Activate or extend subscription
  const tier: SubscriptionTier = 'starter';
  const daysToAdd = 30;

  try {
    const existingSubscription = getActiveSubscription(userId);

    if (existingSubscription) {
      // Extend existing subscription
      const extended = extendSubscription(existingSubscription.id, daysToAdd, tier, transactionHash);
      if (!extended) {
        res.status(500).json({ success: false, error: 'Failed to extend subscription' });
        return;
      }

      console.log(`[Subscription Webhook] Extended subscription for user ${userId}, expires ${extended.expires_at}`);
      res.json({
        success: true,
        action: 'extended',
        userId,
        subscriptionId: extended.id,
        tier: extended.tier,
        expiresAt: extended.expires_at,
      });
      return;
    }

    // Create new subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    const subscription = createSubscription(
      userId,
      tier,
      expiresAt,
      transactionHash,
      parseInt(amount, 10) || undefined
    );

    console.log(`[Subscription Webhook] Created subscription for user ${userId}, expires ${subscription.expires_at}`);
    res.json({
      success: true,
      action: 'created',
      userId,
      subscriptionId: subscription.id,
      tier: subscription.tier,
      expiresAt: subscription.expires_at,
    });
  } catch (error) {
    console.error('[Subscription Webhook] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as internalWebhooksRouter };
