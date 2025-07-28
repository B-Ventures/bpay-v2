import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Check, Lock } from "lucide-react";

interface KycVerificationIncentiveProps {
  isKycVerified: boolean;
  currentTier: string;
  currentFundingSourceCount: number;
  maxFundingSources: number;
  onStartVerification?: () => void;
}

export function KycVerificationIncentive({ 
  isKycVerified, 
  currentTier,
  currentFundingSourceCount,
  maxFundingSources,
  onStartVerification 
}: KycVerificationIncentiveProps) {
  
  // Only show for free tier users
  if (currentTier !== 'free') return null;

  const bonusEarned = isKycVerified;
  const effectiveMax = maxFundingSources + (bonusEarned ? 1 : 0);
  const canEarnBonus = !bonusEarned && currentFundingSourceCount >= maxFundingSources;

  return (
    <Card className={`border-2 ${bonusEarned ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className={`h-5 w-5 ${bonusEarned ? 'text-green-600' : 'text-amber-600'}`} />
            ID Verification Rewards
          </CardTitle>
          {bonusEarned && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              ✓ Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bonusEarned ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">Congratulations! You've unlocked verification rewards:</span>
              </div>
              <div className="pl-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Plus className="h-3 w-3 text-green-600" />
                  <span>+1 Bonus funding source ({effectiveMax} total)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span>Can add funding sources in any name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Enhanced account security & trust</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Complete ID verification to unlock:</span>
              </div>
              <div className="pl-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Plus className="h-3 w-3 text-amber-600" />
                  <span>+1 Bonus funding source (3 total)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-amber-600" />
                  <span>Add funding sources in other names</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-amber-600" />
                  <span>No name matching required</span>
                </div>
              </div>
              {canEarnBonus && (
                <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>You've reached your funding source limit!</strong> Complete ID verification to add one more source.
                  </p>
                  <Button 
                    onClick={onStartVerification}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Start ID Verification
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}