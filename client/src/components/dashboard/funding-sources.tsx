import { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import AddFundingModal from "@/components/modals/add-funding-modal";
import { KycVerificationIncentive } from "@/components/KycVerificationIncentive";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";

export default function FundingSources() {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [showAddModal, setShowAddModal] = useState(false);

  // Demo funding sources
  const demoFundingSources = [
    {
      id: 1,
      name: "Chase Freedom",
      type: "credit_card",
      last4: "1234",
      brand: "visa",
      defaultSplitPercentage: 60,
      isActive: true,
    },
    {
      id: 2,
      name: "Bank of America",
      type: "credit_card", 
      last4: "5678",
      brand: "mastercard",
      defaultSplitPercentage: 40,
      isActive: true,
    },
    {
      id: 3,
      name: "American Express Gold",
      type: "credit_card",
      last4: "0005",
      brand: "amex",
      defaultSplitPercentage: 30,
      isActive: true,
    }
  ];

  const { data: realFundingSources = [] } = useQuery({
    queryKey: ["/api/funding-sources"],
    enabled: !!user && !isDemoMode,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscription/benefits"],
    enabled: !!user && !isDemoMode,
  });

  // Use demo data when in demo mode, real data when in normal mode (and authenticated)
  const fundingSources = isDemoMode ? demoFundingSources : (user ? realFundingSources : []);
  
  // Type guard for subscription data
  const hasValidSubscriptionData = subscriptionData && 
    typeof subscriptionData === 'object' &&
    'benefits' in subscriptionData &&
    'currentTier' in subscriptionData;

  const getBrandColor = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'from-blue-600 to-purple-600';
      case 'mastercard':
        return 'from-red-600 to-orange-600';
      case 'amex':
        return 'from-green-600 to-teal-600';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  // Get card logo component
  const getCardLogo = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return <SiVisa className="w-8 h-5 text-white" />;
      case 'mastercard':
        return <SiMastercard className="w-8 h-5 text-white" />;
      case 'amex':
        return <SiAmericanexpress className="w-8 h-5 text-white" />;
      default:
        return <span className="text-white text-xs font-bold">CARD</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KYC Verification Incentive - only for authenticated users */}
      {!isDemoMode && hasValidSubscriptionData && (
        <KycVerificationIncentive
          isKycVerified={(subscriptionData as any).benefits.isKycVerified}
          currentTier={(subscriptionData as any).currentTier}
          currentFundingSourceCount={Array.isArray(fundingSources) ? fundingSources.length : 0}
          maxFundingSources={(subscriptionData as any).benefits.maxFundingSources === -1 ? 999 : (subscriptionData as any).benefits.maxFundingSources - ((subscriptionData as any).benefits.isKycVerified ? 1 : 0)}
          onStartVerification={() => {
            // This would normally navigate to KYC verification flow
            console.log("Start KYC verification");
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Funding Sources</CardTitle>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!Array.isArray(fundingSources) || fundingSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium mb-2">No funding sources yet</p>
              <p className="text-sm mb-4">Add your first credit card or bank account to get started</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
              >
                Add Funding Source
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {Array.isArray(fundingSources) && fundingSources.map((source: any) => (
                <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-8 bg-gradient-to-r ${getBrandColor(source.brand)} rounded flex items-center justify-center mr-4`}>
                        {getCardLogo(source.brand)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{source.name}</p>
                        <p className="text-sm text-gray-600">•••• {source.last4}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={source.isActive ? "default" : "secondary"}>
                        {source.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span>Default Split: </span>
                      <span className="font-medium text-[hsl(249,83%,65%)]">
                        {source.defaultSplitPercentage}%
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[hsl(249,83%,65%)] hover:text-[hsl(249,83%,60%)]">
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddFundingModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
}
