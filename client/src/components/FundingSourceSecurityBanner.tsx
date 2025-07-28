import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, CreditCard } from "lucide-react";

interface FundingSourceSecurityBannerProps {
  currentTier: string;
  currentCount: number;
  maxAllowed: number | string;
  nameVerificationRequired: boolean;
}

export function FundingSourceSecurityBanner({ 
  currentTier, 
  currentCount, 
  maxAllowed, 
  nameVerificationRequired 
}: FundingSourceSecurityBannerProps) {
  const isAtLimit = typeof maxAllowed === 'number' && currentCount >= maxAllowed;
  const tierDisplayName = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);

  return (
    <div className="space-y-3">
      {/* Tier Status Banner */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {tierDisplayName} Plan
              </Badge>
              <span className="text-sm">
                {currentCount} of {maxAllowed === -1 ? 'unlimited' : maxAllowed} funding sources used
              </span>
            </div>
            {currentTier === 'free' && (
              <span className="text-xs text-blue-600">
                Upgrade for more sources
              </span>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Security Requirements */}
      {nameVerificationRequired && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <Users className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Security Requirement:</strong> The name on your funding source must match your account name for fraud prevention.
          </AlertDescription>
        </Alert>
      )}

      {/* Limit Warning */}
      {isAtLimit && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CreditCard className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Limit Reached:</strong> You've reached the maximum number of funding sources for your {tierDisplayName} plan. 
            {currentTier === 'free' && " Upgrade to Pro for 5 sources or Premium for unlimited sources."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}