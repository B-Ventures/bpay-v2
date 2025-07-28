import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, CreditCard, Percent, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CreateBcardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FundingSource {
  id: number;
  name: string;
  type: string;
  last4: string;
  balance: string; // Decimal comes as string from database
}

export default function CreateBcardModal({ isOpen, onClose }: CreateBcardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [step, setStep] = useState<'details' | 'funding'>('details');
  const [bcardName, setBcardName] = useState('');
  const [bcardAmount, setBcardAmount] = useState<number>(100);
  const [fundingSplits, setFundingSplits] = useState<Record<number, number>>({});
  
  // Auto-populate cardholder name from user registration
  const cardholderName = user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'bpay User' : 'bpay User';
  
  // Fetch subscription data for fee calculation
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscription/benefits"],
    enabled: isOpen,
  });

  // Calculate fees based on subscription tier
  const feePercentage = subscriptionData?.benefits?.feePercentage || 2.9; // Default to 2.9%
  const fees = bcardAmount * (feePercentage / 100);
  const totalAmountWithFees = bcardAmount + fees;

  // Fetch funding sources
  const { data: fundingSources = [], isLoading: loadingFunding } = useQuery<FundingSource[]>({
    queryKey: ["/api/funding-sources"],
    enabled: isOpen && step === 'funding',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBcardName('');
      setBcardAmount(100);
      setFundingSplits({});
      setStep('details');
    }
  }, [isOpen]);

  // Calculate total percentage allocated
  const totalAllocated = Object.values(fundingSplits).reduce((sum, percent) => sum + (percent || 0), 0);
  const remainingPercent = 100 - totalAllocated;

  // Calculate amounts for each funding source (including fees)
  const fundingAmounts = Object.entries(fundingSplits).reduce((acc, [sourceId, percent]) => {
    acc[parseInt(sourceId)] = (totalAmountWithFees * (percent || 0)) / 100;
    return acc;
  }, {} as Record<number, number>);

  const createBcardMutation = useMutation({
    mutationFn: async () => {
      // Validate splits add up to 100%
      if (Math.abs(totalAllocated - 100) > 0.01) {
        throw new Error('Funding splits must add up to 100%');
      }

      // Check if funding sources have sufficient balance
      const insufficientSources = Object.entries(fundingSplits)
        .filter(([_, percent]) => percent > 0)
        .map(([sourceId, percent]) => {
          const source = fundingSources.find(s => s.id === parseInt(sourceId));
          const requiredAmount = fundingAmounts[parseInt(sourceId)];
          const availableBalance = parseFloat(source?.balance || '0');
          return {
            sourceId: parseInt(sourceId),
            sourceName: source?.name || 'Unknown',
            required: requiredAmount,
            available: availableBalance,
            insufficient: requiredAmount > availableBalance
          };
        })
        .filter(s => s.insufficient);

      if (insufficientSources.length > 0) {
        const details = insufficientSources.map(s => 
          `${s.sourceName}: needs $${s.required.toFixed(2)}, has $${s.available.toFixed(2)}`
        ).join('; ');
        throw new Error(`Insufficient funds in funding sources. ${details}`);
      }

      // Prepare funding split data
      const selectedSources = Object.entries(fundingSplits)
        .filter(([_, percent]) => percent > 0)
        .map(([sourceId, percent]) => ({
          fundingSourceId: parseInt(sourceId),
          percentage: percent,
          amount: fundingAmounts[parseInt(sourceId)]
        }));

      const response = await apiRequest("POST", "/api/virtual-cards", {
        name: bcardName,
        cardholderName: cardholderName,
        balance: bcardAmount,
        fundingSources: selectedSources,
        spendingLimit: bcardAmount, // Set spending limit to initial balance
        interval: 'monthly'
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "bcard Created Successfully!",
        description: `Your new bcard "${result.name}" is ready with $${bcardAmount} balance.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funding-sources"] });
      onClose();
    },
    onError: (error: any) => {
      if (error.message?.includes("Insufficient funds")) {
        toast({
          title: "Insufficient Funds",
          description: "Some funding sources don't have enough balance for the requested amounts.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Create bcard",
          description: error.message || "An error occurred while creating your bcard.",
          variant: "destructive",
        });
      }
    },
  });

  const handleNext = () => {
    if (!bcardName.trim()) {
      toast({
        title: "bcard Name Required",
        description: "Please enter a name for your bcard.",
        variant: "destructive",
      });
      return;
    }

    if (bcardAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0.",
        variant: "destructive",
      });
      return;
    }

    setStep('funding');
  };

  const handleBack = () => {
    setStep('details');
  };

  const handleSplitChange = (sourceId: number, percent: string) => {
    const numPercent = Math.max(0, Math.min(100, parseFloat(percent) || 0));
    setFundingSplits(prev => ({
      ...prev,
      [sourceId]: numPercent
    }));
  };

  const handleCreateBcard = () => {
    createBcardMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create New bcard
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? 'Set up your new virtual card with a name and balance amount.'
              : 'Choose how to fund your bcard by splitting across your available funding sources.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-6">
            {/* Cardholder Name (Auto-populated) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cardholder Name
              </Label>
              <Input
                value={cardholderName}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">
                Name is automatically set from your account registration.
              </p>
            </div>

            {/* bcard Name */}
            <div className="space-y-2">
              <Label htmlFor="bcardName">bcard Name (Alias)</Label>
              <Input
                id="bcardName"
                placeholder="e.g., Shopping Card, Travel Card"
                value={bcardName}
                onChange={(e) => setBcardName(e.target.value)}
              />
            </div>

            {/* bcard Amount */}
            <div className="space-y-2">
              <Label htmlFor="bcardAmount">bcard Balance Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="bcardAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  className="pl-8"
                  value={bcardAmount}
                  onChange={(e) => setBcardAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Amount to be loaded onto your bcard from your funding sources.
              </p>
            </div>

            {/* Security Info */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Real Stripe Test Mode bcard</p>
                  <p className="text-xs text-green-700 mt-1">
                    Using authentic Stripe Issuing APIs in test mode. This creates real virtual cards with genuine card numbers, CVV, and expiry dates for testing.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next: Select Funding
              </Button>
            </div>
          </div>
        )}

        {step === 'funding' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">bcard Amount:</span>
                  <span className="font-medium text-blue-900">${bcardAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">bpay Fee (2.9%):</span>
                  <span className="font-medium text-orange-600">+${fees.toFixed(2)}</span>
                </div>
                <hr className="border-blue-300" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">Total to Deduct:</span>
                  <span className="text-xl font-bold text-blue-900">${totalAmountWithFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Allocated:</span>
                  <span className="text-sm font-medium text-blue-700">{totalAllocated.toFixed(1)}% ({remainingPercent.toFixed(1)}% remaining)</span>
                </div>
              </div>
            </div>

            {loadingFunding ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading funding sources...</p>
              </div>
            ) : fundingSources.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No funding sources available. Please add funding sources first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Funding Split Percentages
                </h3>
                
                {fundingSources.map((source: FundingSource) => {
                  const requiredAmount = fundingAmounts[source.id] || 0;
                  const availableBalance = parseFloat(source.balance || '0');
                  const hasInsufficientFunds = requiredAmount > availableBalance && fundingSplits[source.id] > 0;
                  
                  return (
                  <div key={source.id} className={`border rounded-lg p-4 ${hasInsufficientFunds ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-gray-500">
                          {source.type} •••• {source.last4} • Balance: ${availableBalance.toFixed(2)}
                        </p>
                        {hasInsufficientFunds && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Insufficient funds: needs ${requiredAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div>
                        <Label className="text-xs">Percentage (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={fundingSplits[source.id] || ''}
                          onChange={(e) => handleSplitChange(source.id, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Amount ($)</Label>
                        <Input
                          value={(fundingAmounts[source.id] || 0).toFixed(2)}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleCreateBcard}
                disabled={Math.abs(totalAllocated - 100) > 0.01 || createBcardMutation.isPending || fundingSources.length === 0}
              >
                {createBcardMutation.isPending ? "Creating bcard..." : "Create bcard"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}