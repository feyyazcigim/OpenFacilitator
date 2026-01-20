'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddressBreakdownProps {
  addresses: Array<{
    id: string;
    address: string;
    chain_type: 'solana' | 'evm' | 'facilitator';
    volume: string;
    uniquePayers: number;
  }>;
  totalVolume: string;
}

function ChainBadge({ chainType }: { chainType: 'solana' | 'evm' | 'facilitator' }) {
  if (chainType === 'solana') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
        S
      </span>
    );
  }
  if (chainType === 'facilitator') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
        F
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold">
      E
    </span>
  );
}

function formatUSDC(amount: string): string {
  const value = Number(amount) / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AddressBreakdown({ addresses, totalVolume }: AddressBreakdownProps) {
  const totalVolumeNum = Number(totalVolume);

  if (addresses.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tracked Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No addresses tracked. Register an address to start earning rewards.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tracked Addresses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {addresses.map((addr) => {
          const volumeNum = Number(addr.volume);
          // Guard against division by zero
          const percentage = totalVolumeNum > 0 ? (volumeNum / totalVolumeNum) * 100 : 0;
          const displayAddress = addr.chain_type === 'facilitator' ? 'Facilitator Ownership' : truncateAddress(addr.address);

          return (
            <div
              key={addr.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <ChainBadge chainType={addr.chain_type} />
                <span className="font-mono text-sm">{displayAddress}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{formatUSDC(addr.volume)}</span>
                <span className="text-muted-foreground w-14 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
