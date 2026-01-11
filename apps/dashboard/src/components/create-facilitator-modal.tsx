'use client';

import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, type Facilitator } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const SUBSCRIPTION_PAYMENT_URL = process.env.NEXT_PUBLIC_SUBSCRIPTION_PAYMENT_URL || 'https://pay.openfacilitator.io/pay/9H_WKcSOnPAQNJlglx348';

interface CreateFacilitatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (facilitator: Facilitator) => void;
  walletBalance?: string;
}

export function CreateFacilitatorModal({
  open,
  onOpenChange,
  onSuccess,
  walletBalance,
}: CreateFacilitatorModalProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check subscription status
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.getSubscriptionStatus(),
    enabled: open,
  });

  const hasActiveSubscription = subscription?.active;

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; customDomain: string }) => {
      // Create the facilitator (subscription already active via payment link)
      const facilitator = await api.createFacilitator({
        ...data,
        subdomain: data.customDomain.replace(/\./g, '-'),
      });

      // Set up the domain on Railway
      await api.setupDomain(facilitator.id);

      return facilitator;
    },
    onSuccess: (facilitator) => {
      queryClient.invalidateQueries({ queryKey: ['facilitators'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['billingWallet'] });
      onSuccess(facilitator);
      onOpenChange(false);
      setName('');
      setDomain('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to create facilitator',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!name.trim() || !domain.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      customDomain: domain.trim(),
    });
  };

  const handleSubscribe = () => {
    // Open payment link - webhook will activate subscription
    window.open(SUBSCRIPTION_PAYMENT_URL, '_blank');
  };

  // Loading state
  if (subscriptionLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No subscription - show subscribe prompt
  if (!hasActiveSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscribe to Create Facilitators</DialogTitle>
            <DialogDescription>
              A subscription is required to create and manage your own facilitators.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Monthly subscription</span>
                <span className="font-semibold">$5.00 USDC</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Create unlimited facilitators with your own domains.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Has subscription - show create form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Facilitator</DialogTitle>
          <DialogDescription>
            Set up a new x402 facilitator with your own domain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Internal name for your reference
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              placeholder="pay.yourdomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
            />
            <p className="text-xs text-muted-foreground">
              You'll need to configure DNS after creation
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !domain.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Facilitator'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
