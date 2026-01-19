import { Router, type Request, type Response, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin } from '../utils/admin.js';
import {
  createRewardAddress,
  getRewardAddressesByUser,
  isUserEnrolledInRewards,
} from '../db/reward-addresses.js';
import { isFacilitatorOwner } from '../db/facilitators.js';

const router: IRouter = Router();

/**
 * GET /status
 * Get the current user's rewards status
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const isEnrolled = isUserEnrolledInRewards(userId);
    const isUserAdmin = isAdmin(userId);
    const isOwner = isFacilitatorOwner(userId);
    const addresses = getRewardAddressesByUser(userId);

    res.json({
      isEnrolled,
      isAdmin: isUserAdmin,
      isFacilitatorOwner: isOwner,
      addresses,
    });
  } catch (error) {
    console.error('Error getting rewards status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get rewards status',
    });
  }
});

// Validation schema for enrollment
const enrollSchema = z.object({
  chain_type: z.enum(['solana', 'evm']),
  address: z.string().min(1, 'Address is required'),
});

/**
 * POST /enroll
 * Enroll a wallet address for rewards tracking
 * NOTE: This endpoint will be called from Phase 3's address management UI
 * after address verification is implemented. For now, it exists but is not
 * exposed to users via UI.
 */
router.post('/enroll', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const parseResult = enrollSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: parseResult.error.errors[0]?.message || 'Invalid request body',
      });
      return;
    }

    const { chain_type, address } = parseResult.data;

    // Create the reward address
    const created = createRewardAddress({
      user_id: userId,
      chain_type,
      address,
    });

    if (!created) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Address already enrolled or duplicate entry',
      });
      return;
    }

    res.status(201).json(created);
  } catch (error) {
    console.error('Error enrolling address:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to enroll address',
    });
  }
});

export const rewardsRouter = router;
