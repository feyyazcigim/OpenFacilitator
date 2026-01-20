'use client';

import { differenceInDays } from 'date-fns';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from './progress-bar';
import { RewardEstimate } from './reward-estimate';
import { AddressBreakdown } from './address-breakdown';
import type { Campaign, VolumeBreakdown } from '@/lib/api';

interface ProgressDashboardProps {
  campaign: Campaign;
  userVolume: string;
  totalPoolVolume: string;
  isFacilitatorOwner: boolean;
  volumeBreakdown: VolumeBreakdown | null;
}

function formatUSDC(amount: string): string {
  const value = Number(amount) / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProgressDashboard({
  campaign,
  userVolume,
  totalPoolVolume,
  isFacilitatorOwner,
  volumeBreakdown,
}: ProgressDashboardProps) {
  const now = new Date();
  const endsAt = new Date(campaign.ends_at);
  const hasEnded = now >= endsAt;
  const daysRemaining = Math.max(0, differenceInDays(endsAt, now));

  const userVolumeNum = Number(userVolume) / 1_000_000;
  const thresholdNum = Number(campaign.threshold_amount) / 1_000_000;
  const poolAmountNum = Number(campaign.pool_amount) / 1_000_000;
  const totalVolumeNum = Number(totalPoolVolume) / 1_000_000;
  const multiplier = isFacilitatorOwner ? campaign.multiplier_facilitator : 1;

  // Apply multiplier to user volume for calculation
  const effectiveVolume = userVolumeNum * multiplier;
  const metThreshold = userVolumeNum >= thresholdNum;
  const remainingToThreshold = Math.max(0, thresholdNum - userVolumeNum);

  // Calculate user's share only if there's pool volume
  const userShare = totalVolumeNum > 0 ? effectiveVolume / totalVolumeNum : 0;
  const estimatedReward = userShare * poolAmountNum;

  // Campaign ended state
  if (hasEnded) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Campaign Ended</h3>
          <p className="text-muted-foreground">
            Rewards are being calculated. Check back soon for your final reward amount.
          </p>
          {metThreshold && (
            <p className="mt-4 text-green-600 dark:text-green-400 font-medium">
              You met the threshold and are eligible for rewards!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
          <ProgressBar
            current={userVolume}
            threshold={campaign.threshold_amount}
            className="mb-4"
          />

          {/* Threshold Status Message */}
          <div
            className={`rounded-lg p-4 mt-4 ${
              metThreshold
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            }`}
          >
            {metThreshold ? (
              <p className="font-medium text-green-700 dark:text-green-400">
                You've reached the threshold! You're eligible for rewards.
              </p>
            ) : (
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Keep going! {formatUSDC((remainingToThreshold * 1_000_000).toString())} more to qualify for rewards.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reward Estimate */}
      <Card>
        <CardContent className="py-4">
          <RewardEstimate
            estimatedReward={estimatedReward}
            metThreshold={metThreshold}
            hasMultiplier={isFacilitatorOwner && campaign.multiplier_facilitator > 1}
            multiplier={campaign.multiplier_facilitator}
          />
        </CardContent>
      </Card>

      {/* Days Remaining */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Address Breakdown */}
      {volumeBreakdown && (
        <AddressBreakdown
          addresses={volumeBreakdown.addresses}
          totalVolume={volumeBreakdown.totalVolume}
        />
      )}
    </div>
  );
}
