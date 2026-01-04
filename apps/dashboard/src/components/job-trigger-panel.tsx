'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface JobTriggerConfig {
  manual: {
    enabled: boolean;
  };
  webhook: {
    enabled: boolean;
    endpoint: string;
    baseCost: number;
    markup: number;
    publishToMarketplace: boolean;
    showWorkflowPublicly: boolean;
  };
  scheduled: {
    enabled: boolean;
    cron?: string;
    nextRun?: string;
  };
}

export interface JobParameters {
  name: string;
  type: string;
  required: boolean;
}

export type AutomationMode = 'stop' | 'loop' | 'continuous';

export interface JobTriggerPanelProps {
  config: JobTriggerConfig;
  onConfigChange: (config: JobTriggerConfig) => void;
  parameters?: JobParameters[];
  automationMode?: AutomationMode;
  onAutomationModeChange?: (mode: AutomationMode) => void;
  className?: string;
}

// ============================================================================
// CollapsibleSection Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  preview?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

function CollapsibleSection({
  title,
  preview,
  defaultExpanded = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        type="button"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-3">
          {!expanded && preview && (
            <span className="text-sm text-muted-foreground">{preview}</span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TriggerOption Component
// ============================================================================

interface TriggerOptionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label: string;
  description: string;
  children?: ReactNode;
}

function TriggerOption({ enabled, onToggle, label, description, children }: TriggerOptionProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 cursor-pointer group">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => onToggle(checked === true)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <div className="font-medium group-hover:text-primary transition-colors">{label}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </label>

      {enabled && children && (
        <div
          className={cn(
            'ml-7 p-4 bg-secondary/30 border border-border rounded-lg',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WebhookSettings Component
// ============================================================================

interface WebhookSettingsProps {
  endpoint: string;
  baseCost: number;
  markup: number;
  onMarkupChange: (markup: number) => void;
  publishToMarketplace: boolean;
  onPublishToMarketplaceChange: (publish: boolean) => void;
  showWorkflowPublicly: boolean;
  onShowWorkflowPubliclyChange: (show: boolean) => void;
}

function WebhookSettings({
  endpoint,
  baseCost,
  markup,
  onMarkupChange,
  publishToMarketplace,
  onPublishToMarketplaceChange,
  showWorkflowPublicly,
  onShowWorkflowPubliclyChange,
}: WebhookSettingsProps) {
  const [copied, setCopied] = useState(false);
  const totalCost = baseCost + markup;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-5">
      {/* Endpoint */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Endpoint</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={endpoint}
              readOnly
              className="pr-10 font-mono text-xs bg-background"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Base cost</span>
          <span className="font-mono">{formatCurrency(baseCost)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your markup</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={markup}
              onChange={(e) => onMarkupChange(parseFloat(e.target.value) || 0)}
              className="w-20 h-7 text-sm font-mono text-right"
            />
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total per run</span>
            <span className="font-mono font-semibold text-primary">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Visibility Options */}
      <div className="space-y-4 pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={publishToMarketplace}
            onCheckedChange={(checked) => onPublishToMarketplaceChange(checked === true)}
            className="mt-0.5"
          />
          <div>
            <div className="text-sm font-medium group-hover:text-primary transition-colors">
              Publish to Marketplace
            </div>
            <div className="text-xs text-muted-foreground">
              List in public marketplace
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={showWorkflowPublicly}
            onCheckedChange={(checked) => onShowWorkflowPubliclyChange(checked === true)}
            className="mt-0.5"
          />
          <div>
            <div className="text-sm font-medium group-hover:text-primary transition-colors">
              Show workflow publicly
            </div>
            <div className="text-xs text-muted-foreground">
              Let visitors see the resources used
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

// ============================================================================
// ScheduledSettings Component
// ============================================================================

interface ScheduledSettingsProps {
  cron?: string;
  onCronChange: (cron: string) => void;
  nextRun?: string;
}

function ScheduledSettings({ cron, onCronChange, nextRun }: ScheduledSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Schedule (cron expression)</label>
        <Input
          value={cron || ''}
          onChange={(e) => onCronChange(e.target.value)}
          placeholder="0 9 * * *"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Example: &quot;0 9 * * *&quot; runs daily at 9:00 AM
        </p>
      </div>

      {nextRun && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Next run:</span>
          <span className="font-medium">{nextRun}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main JobTriggerPanel Component
// ============================================================================

export function JobTriggerPanel({
  config,
  onConfigChange,
  parameters = [],
  automationMode = 'stop',
  onAutomationModeChange,
  className,
}: JobTriggerPanelProps) {
  // Generate preview text for triggers
  const getTriggersPreview = () => {
    const enabled: string[] = [];
    if (config.manual.enabled) enabled.push('Manual');
    if (config.webhook.enabled) enabled.push('Webhook');
    if (config.scheduled.enabled) enabled.push('Scheduled');
    return enabled.length > 0 ? enabled.join(', ') + ' enabled' : 'No triggers enabled';
  };

  // Generate preview text for parameters
  const getParametersPreview = () => {
    if (parameters.length === 0) return 'No parameters defined';
    return `${parameters.length} parameter${parameters.length > 1 ? 's' : ''} defined`;
  };

  // Generate preview text for automation
  const getAutomationPreview = () => {
    switch (automationMode) {
      case 'stop':
        return 'Stop (run once)';
      case 'loop':
        return 'Loop';
      case 'continuous':
        return 'Continuous';
      default:
        return 'Stop (run once)';
    }
  };

  // Update config handlers
  const updateManual = (enabled: boolean) => {
    onConfigChange({
      ...config,
      manual: { ...config.manual, enabled },
    });
  };

  const updateWebhook = (updates: Partial<JobTriggerConfig['webhook']>) => {
    onConfigChange({
      ...config,
      webhook: { ...config.webhook, ...updates },
    });
  };

  const updateScheduled = (updates: Partial<JobTriggerConfig['scheduled']>) => {
    onConfigChange({
      ...config,
      scheduled: { ...config.scheduled, ...updates },
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Triggers Section */}
      <CollapsibleSection
        title="Triggers"
        preview={getTriggersPreview()}
        defaultExpanded={true}
      >
        <div className="space-y-5">
          {/* Manual Trigger */}
          <TriggerOption
            enabled={config.manual.enabled}
            onToggle={updateManual}
            label="Manual"
            description='Click the "Run" button to run the job yourself'
          />

          {/* Webhook (x402) Trigger */}
          <TriggerOption
            enabled={config.webhook.enabled}
            onToggle={(enabled) => updateWebhook({ enabled })}
            label="Webhook (x402)"
            description="External systems can call this job and pay per use"
          >
            <WebhookSettings
              endpoint={config.webhook.endpoint}
              baseCost={config.webhook.baseCost}
              markup={config.webhook.markup}
              onMarkupChange={(markup) => updateWebhook({ markup })}
              publishToMarketplace={config.webhook.publishToMarketplace}
              onPublishToMarketplaceChange={(publishToMarketplace) =>
                updateWebhook({ publishToMarketplace })
              }
              showWorkflowPublicly={config.webhook.showWorkflowPublicly}
              onShowWorkflowPubliclyChange={(showWorkflowPublicly) =>
                updateWebhook({ showWorkflowPublicly })
              }
            />
          </TriggerOption>

          {/* Scheduled Trigger */}
          <TriggerOption
            enabled={config.scheduled.enabled}
            onToggle={(enabled) => updateScheduled({ enabled })}
            label="Scheduled"
            description="Run automatically on a recurring schedule"
          >
            <ScheduledSettings
              cron={config.scheduled.cron}
              onCronChange={(cron) => updateScheduled({ cron })}
              nextRun={config.scheduled.nextRun}
            />
          </TriggerOption>
        </div>
      </CollapsibleSection>

      {/* Parameters Section */}
      <CollapsibleSection
        title="Parameters"
        preview={getParametersPreview()}
        defaultExpanded={false}
      >
        {parameters.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parameters defined</p>
        ) : (
          <div className="space-y-3">
            {parameters.map((param, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
              >
                <div>
                  <span className="font-medium">{param.name}</span>
                  <span className="text-muted-foreground ml-2 text-sm">({param.type})</span>
                </div>
                {param.required && (
                  <span className="text-xs text-primary font-medium">Required</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Automation Section */}
      <CollapsibleSection
        title="Automation"
        preview={getAutomationPreview()}
        defaultExpanded={false}
      >
        <div className="space-y-3">
          {(['stop', 'loop', 'continuous'] as AutomationMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={automationMode === mode}
                onCheckedChange={(checked) => {
                  if (checked && onAutomationModeChange) {
                    onAutomationModeChange(mode);
                  }
                }}
                className="rounded-full"
              />
              <div>
                <div className="font-medium capitalize group-hover:text-primary transition-colors">
                  {mode === 'stop' ? 'Stop (run once)' : mode}
                </div>
                <div className="text-xs text-muted-foreground">
                  {mode === 'stop' && 'Execute the job once and stop'}
                  {mode === 'loop' && 'Restart the job after it completes'}
                  {mode === 'continuous' && 'Keep the job running continuously'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ============================================================================
// Default Export with Example Usage
// ============================================================================

export default JobTriggerPanel;

