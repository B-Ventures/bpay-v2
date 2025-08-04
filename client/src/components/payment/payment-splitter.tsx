import { useState, useEffect } from "react";
import { CreditCard, Plus, Minus, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";

interface PaymentSplitterProps {
  amount: number;
  merchant: string;
  onPaymentSuccess?: (result: any) => void;
}

export default function PaymentSplitter({ amount, merchant, onPaymentSuccess }: PaymentSplitterProps) {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();
  const [splits, setSplits] = useState<any[]>([]);
  const [splitMode, setSplitMode] = useState<'percentage' | 'fixed'>('percentage');

  // Demo mode funding sources when not authenticated - with sufficient balances for fees
  const demoFundingSources = [
    {
      id: 1,
      name: "Chase Freedom Unlimited",
      type: "credit_card",
      last4: "4242",
      brand: "visa",
      balance: "1200.00",
      creditLimit: "8000.00",
      availableCredit: "6800.00",
      defaultSplitPercentage: 60,
      stripePaymentMethodId: "pm_1U3gVeQWS6DLmVIA",
      rewardsRate: "1.5% cashback"
    },
    {
      id: 2,
      name: "Bank of America Cash Rewards",
      type: "credit_card", 
      last4: "5555",
      brand: "mastercard",
      balance: "850.00",
      creditLimit: "5000.00", 
      availableCredit: "4150.00",
      defaultSplitPercentage: 40,
      stripePaymentMethodId: "pm_DtorEf1PNjZ2DmZ9",
      rewardsRate: "3% on gas & dining"
    },
    {
      id: 3,
      name: "Wells Fargo Active Cash",
      type: "credit_card",
      last4: "3782",
      brand: "amex",
      balance: "600.00",
      creditLimit: "4000.00",
      availableCredit: "3400.00", 
      defaultSplitPercentage: 0,
      stripePaymentMethodId: "pm_AmexTest123456789",
      rewardsRate: "2% on everything"
    },
    {
      id: 4,
      name: "Checking Account",
      type: "bank_account",
      last4: "7890",
      brand: "bank",
      balance: "2500.75",
      accountType: "checking",
      bankName: "Capital One",
      defaultSplitPercentage: 0,
      stripePaymentMethodId: "pm_BankTest987654321"
    }
  ];

  const demoVirtualCards = [
    {
      id: 1,
      name: "bpay Virtual Card",
      balance: "1000.00",
      status: "active"
    }
  ];

  const { data: fundingSources = [] as any[] } = useQuery({
    queryKey: ["/api/funding-sources"],
    enabled: !!user,
  });

  const { data: virtualCards = [] as any[] } = useQuery({
    queryKey: ["/api/virtual-cards"],
    enabled: !!user,
  });

  // Fetch subscription data for fee calculation
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscription/benefits"],
    enabled: !!user,
  });

  // Use demo data when not authenticated or in demo mode, real data when authenticated
  const activeFundingSources: any[] = !user ? demoFundingSources : (isDemoMode ? demoFundingSources : fundingSources || []);
  const activeVirtualCards: any[] = !user ? demoVirtualCards : (isDemoMode ? demoVirtualCards : virtualCards || []);

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

  const processingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/process-payment", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Payment Successful",
        description: `Payment of $${amount} processed successfully!`,
      });
      onPaymentSuccess?.(result);
    },
    onError: (error: any) => {
      // Check if this is an insufficient funds error
      if (error.message?.includes("Insufficient funds")) {
        const errorData = error.details || {};
        const insufficientSources = errorData.insufficientSources || [];
        
        // Create detailed error message
        let errorMessage = `Insufficient funds: Need $${errorData.totalRequired?.toFixed(2) || amount} but only have $${errorData.totalAvailable?.toFixed(2) || '0'}`;
        
        if (insufficientSources.length > 0) {
          errorMessage += `\n\nFunding sources with insufficient balance:`;
          insufficientSources.forEach((source: any) => {
            errorMessage += `\n• ${source.name}: Need $${source.requiredAmount?.toFixed(2)} but only have $${source.availableBalance}`;
          });
        }
        
        toast({
          title: "Insufficient Funds in Funding Sources",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (activeFundingSources.length > 0 && splits.length === 0) {
      // Initialize with default splits
      const defaultSplits = activeFundingSources.map((source: any) => ({
        fundingSourceId: source.id,
        stripePaymentMethodId: source.stripePaymentMethodId,
        percentage: parseFloat(source.defaultSplitPercentage) || 0,
        fixedAmount: 0,
        name: source.name,
        last4: source.last4,
        brand: source.brand,
      }));
      setSplits(defaultSplits);
    }
  }, [activeFundingSources]);

  const updateSplit = (index: number, field: string, value: number) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const addSplit = () => {
    if (activeFundingSources.length > splits.length) {
      const availableSources = activeFundingSources.filter(
        (source: any) => !splits.some(split => split.fundingSourceId === source.id)
      );
      
      if (availableSources.length > 0) {
        const newSplit = {
          fundingSourceId: availableSources[0].id,
          stripePaymentMethodId: availableSources[0].stripePaymentMethodId,
          percentage: 0,
          fixedAmount: 0,
          name: availableSources[0].name,
          last4: availableSources[0].last4,
          brand: availableSources[0].brand,
        };
        setSplits([...splits, newSplit]);
      }
    }
  };

  const removeSplit = (index: number) => {
    const newSplits = splits.filter((_, i) => i !== index);
    setSplits(newSplits);
  };

  const getTotalPercentage = () => {
    return splits.reduce((sum, split) => sum + split.percentage, 0);
  };

  const getTotalFixed = () => {
    return splits.reduce((sum, split) => sum + split.fixedAmount, 0);
  };

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

  const processPayment = () => {
    const validSplits = splits.filter(split => 
      splitMode === 'percentage' ? split.percentage > 0 : split.fixedAmount > 0
    );

    if (validSplits.length === 0) {
      toast({
        title: "Invalid Splits",
        description: "Please configure at least one payment split",
        variant: "destructive",
      });
      return;
    }

    // Check balance validation for demo mode
    if (!user) {
      // Demo mode - validate against demo card balances
      let totalRequired = 0;
      const insufficientSources: any[] = [];
      
      validSplits.forEach(split => {
        const source = activeFundingSources.find((fs: any) => fs.id === split.fundingSourceId);
        if (source) {
          const requiredAmount = splitMode === 'percentage' 
            ? (split.percentage / 100) * totalAmount 
            : split.fixedAmount;
          const availableBalance = parseFloat(source.balance || source.availableCredit || '0');
          
          totalRequired += requiredAmount;
          
          if (availableBalance < requiredAmount) {
            insufficientSources.push({
              name: source.name,
              requiredAmount,
              availableBalance: source.balance || source.availableCredit || '0'
            });
          }
        }
      });
      
      if (insufficientSources.length > 0) {
        let errorMessage = `Insufficient funds: Need $${totalRequired.toFixed(2)}`;
        errorMessage += `\n\nFunding sources with insufficient balance:`;
        insufficientSources.forEach((source: any) => {
          errorMessage += `\n• ${source.name}: Need $${source.requiredAmount.toFixed(2)} but only have $${source.availableBalance}`;
        });
        
        toast({
          title: "Insufficient Funds in Funding Sources",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // Demo mode success - proceed to bcard generation
      toast({
        title: "Split Configuration Complete",
        description: `Ready to generate bcard for $${amount} payment`,
      });
      
      // Return the splits array for bcard generation flow
      onPaymentSuccess?.(validSplits);
      return;
    }

    // Authenticated mode - use API
    const selectedBcard = activeVirtualCards[0];
    
    if (!selectedBcard) {
      toast({
        title: "No bcard Available", 
        description: "Please create a bcard first",
        variant: "destructive",
      });
      return;
    }

    processingMutation.mutate({
      amount: amount.toString(),
      merchant,
      virtualCardId: selectedBcard.id,
      splits: validSplits,
    });
  };

  // Calculate fees based on subscription tier
  const feePercentage = (subscriptionData as any)?.benefits?.feePercentage || 2.9;
  const feeAmount = amount * (feePercentage / 100);
  const totalAmount = amount + feeAmount;
  const isValidSplit = splitMode === 'percentage' ? 
    getTotalPercentage() === 100 : 
    getTotalFixed() === totalAmount;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Merchant:</span>
              <span className="font-medium">{merchant}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>bpay Fee ({feePercentage}%):</span>
              <span className="font-medium">${feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-[hsl(249,83%,65%)]">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Configuration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configure Payment Split</CardTitle>
            <Select value={splitMode} onValueChange={(value: 'percentage' | 'fixed') => setSplitMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {splits.map((split, index) => (
              <div key={split.fundingSourceId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className={`w-12 h-8 bg-gradient-to-r ${getBrandColor(split.brand)} rounded flex items-center justify-center`}>
                  {getCardLogo(split.brand)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{split.name}</p>
                  <p className="text-sm text-gray-600">•••• {split.last4}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {splitMode === 'percentage' ? (
                    <>
                      <Input
                        type="number"
                        value={split.percentage}
                        onChange={(e) => updateSplit(index, 'percentage', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-600">$</span>
                      <Input
                        type="number"
                        value={split.fixedAmount}
                        onChange={(e) => updateSplit(index, 'fixedAmount', parseFloat(e.target.value) || 0)}
                        className="w-24"
                        min="0"
                        step="0.01"
                      />
                    </>
                  )}
                </div>
                {splits.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSplit(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {activeFundingSources.length > splits.length && (
              <Button
                variant="outline"
                onClick={addSplit}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Source
              </Button>
            )}
          </div>
          
          {/* Split Validation */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {splitMode === 'percentage' ? 'Total Percentage:' : 'Total Amount:'}
              </span>
              <span className={`font-bold ${isValidSplit ? 'text-green-600' : 'text-red-600'}`}>
                {splitMode === 'percentage' ? 
                  `${getTotalPercentage()}%` : 
                  `$${getTotalFixed().toFixed(2)}`
                }
              </span>
            </div>
            {!isValidSplit && (
              <p className="text-sm text-red-600 mt-1">
                {splitMode === 'percentage' ? 
                  'Total percentage must equal 100%' : 
                  `Total amount must equal $${totalAmount.toFixed(2)}`
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Payment */}
      <Button
        onClick={processPayment}
        disabled={!isValidSplit || processingMutation.isPending || splits.length === 0}
        className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] py-4 text-lg font-semibold"
      >
        {processingMutation.isPending ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
      </Button>
    </div>
  );
}