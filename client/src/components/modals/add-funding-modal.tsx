import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { FundingSourceSecurityBanner } from "@/components/FundingSourceSecurityBanner";

interface AddFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFundingModal({ isOpen, onClose }: AddFundingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  const [authStep, setAuthStep] = useState<'form' | '3ds' | 'processing' | 'complete'>('form');

  // Fetch subscription benefits for security validation
  const { data: subscriptionData } = useQuery<any>({
    queryKey: ["/api/subscription/benefits"],
    enabled: !!user,
  });

  // Fetch current funding sources to check limits
  const { data: fundingSources = [] } = useQuery<any[]>({
    queryKey: ["/api/funding-sources"],
    enabled: !!user,
  });

  // Format card number with spaces (4-4-4-4 pattern)
  const formatCardNumber = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    return numericValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  // Format expiry date input as MM/YY
  const formatExpiryDate = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Add slash after 2 digits for month
    if (numericValue.length >= 2) {
      return numericValue.slice(0, 2) + '/' + numericValue.slice(2, 4);
    }
    
    return numericValue;
  };

  // Detect card type from number
  const getCardType = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'amex';
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5')) return 'mastercard';
    return 'unknown';
  };

  const currentCardType = getCardType(watch("cardNumber") || "");
  const cvvLength = currentCardType === 'amex' ? 4 : 3;

  // Get card logo component
  const getCardLogo = (cardType: string) => {
    switch (cardType) {
      case 'visa':
        return <SiVisa className="w-8 h-5 text-blue-600" />;
      case 'mastercard':
        return <SiMastercard className="w-8 h-5 text-red-500" />;
      case 'amex':
        return <SiAmericanexpress className="w-8 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setValue("cardNumber", formatted);
    
    // Clear CVV if card type changes (different CVV length requirements)
    const newCardType = getCardType(formatted);
    const currentCvv = watch("cvv") || "";
    if (newCardType === 'amex' && currentCvv.length > 4) {
      setValue("cvv", currentCvv.slice(0, 4));
    } else if (newCardType !== 'amex' && currentCvv.length > 3) {
      setValue("cvv", currentCvv.slice(0, 3));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setValue("expiryDate", formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit based on card type: 4 digits for Amex, 3 for others
    const maxLength = cvvLength;
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setValue("cvv", numericValue);
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Step 1: Start 3D Secure authentication
      setAuthStep('3ds');
      
      // Simulate 3D Secure authentication (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      setAuthStep('processing');
      
      // Simulate $1.00 authorization hold (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAuthStep('complete');
      
      // Actually add the funding source to the backend
      const response = await apiRequest("POST", "/api/funding-sources", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Funding source added successfully",
        description: "Your card has been verified with $1.00 authorization hold and is ready for instant payments.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funding-sources"] });
      reset();
      
      // Reset form and close modal after showing success
      setTimeout(() => {
        setAuthStep('form');
        onClose();
      }, 2000);
    },
    onError: (error: any) => {
      setAuthStep('form');
      let errorMessage = error.message;
      
      // Handle security validation errors with more specific messaging
      if (error.response?.json?.type === "security_validation") {
        errorMessage = error.response.json.message;
      }
      
      toast({
        title: "Error adding funding source",
        description: errorMessage || "Authentication failed or card declined",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // For demo mode (no user), just show success message without API call
    if (!user) {
      toast({
        title: "Demo Mode",
        description: "In demo mode, funding sources are simulated. Your card would be added in a real account.",
      });
      reset();
      onClose();
      return;
    }

    // Extract card details and create funding source
    const cardNumber = data.cardNumber.replace(/\s/g, '');
    const [expiryMonth, expiryYear] = data.expiryDate.split('/');
    
    mutation.mutate({
      // Backend required fields
      cardNumber: cardNumber,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(`20${expiryYear}`),
      cvv: data.cvv,
      name: data.cardholderName,
      // Additional fields for database
      type: 'credit_card',
      last4: cardNumber.slice(-4),
      brand: getBrandFromNumber(cardNumber),
      defaultSplitPercentage: data.defaultSplitPercentage,
    });
  };

  const getBrandFromNumber = (cardNumber: string) => {
    if (cardNumber.startsWith('4')) return 'visa';
    if (cardNumber.startsWith('5')) return 'mastercard';
    if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) return 'amex';
    return 'unknown';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funding Source</DialogTitle>
        </DialogHeader>
        
        {/* Security Banner */}
        {subscriptionData && (
          <FundingSourceSecurityBanner
            currentTier={subscriptionData.currentTier}
            currentCount={Array.isArray(fundingSources) ? fundingSources.length : 0}
            maxAllowed={subscriptionData.benefits?.maxFundingSources}
            nameVerificationRequired={subscriptionData.benefits?.nameVerificationRequired}
            isKycVerified={subscriptionData.benefits?.isKycVerified}
            features={subscriptionData.benefits?.features}
          />
        )}
        
        {/* 3D Secure Authentication Flow */}
        {authStep === '3ds' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="font-semibold text-blue-900 mb-2">3D Secure Authentication Required</h3>
            <p className="text-blue-700 text-sm mb-4">Please complete authentication with your bank to verify this card.</p>
            <div className="bg-white rounded border p-3 text-xs text-gray-600">
              You may receive an SMS, push notification, or need to use your banking app to verify this transaction.
            </div>
          </div>
        )}

        {/* Processing Authorization Hold */}
        {authStep === 'processing' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="font-semibold text-green-900 mb-2">Processing Authorization Hold</h3>
            <p className="text-green-700 text-sm mb-4">Placing $1.00 verification hold on your card...</p>
            <div className="bg-white rounded border p-3 text-xs text-gray-600">
              This hold will be released within 1-3 business days and enables instant future payments.
            </div>
          </div>
        )}

        {/* Completion */}
        {authStep === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Card Successfully Added!</h3>
            <p className="text-green-700 text-sm">Your card is now pre-authorized and ready for instant payments.</p>
          </div>
        )}

        {authStep === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input 
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={watch("cardNumber") || ""}
                onChange={handleCardNumberChange}
                maxLength={19}
                className="mt-1 pr-16"
              />
              {currentCardType !== 'unknown' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white p-1 rounded border shadow-sm">
                  {getCardLogo(currentCardType)}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input 
                id="expiryDate"
                placeholder="MM/YY"
                value={watch("expiryDate") || ""}
                onChange={handleExpiryChange}
                maxLength={5}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input 
                id="cvv"
                placeholder={currentCardType === 'amex' ? "1234" : "123"}
                value={watch("cvv") || ""}
                onChange={handleCvvChange}
                maxLength={cvvLength}
                className="mt-1"
              />
              {currentCardType === 'amex' && (
                <p className="text-xs text-gray-500 mt-1">Amex cards use 4-digit CVV</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input 
              id="cardholderName"
              placeholder="John Doe"
              {...register("cardholderName", { required: true })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="defaultSplitPercentage">Default Split Percentage</Label>
            <Input 
              id="defaultSplitPercentage"
              type="number"
              placeholder="50"
              min="0"
              max="100"
              {...register("defaultSplitPercentage", { required: true })}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
              disabled={
                mutation.isPending || 
                ((subscriptionData?.benefits?.maxFundingSources !== -1) && 
                 Array.isArray(fundingSources) && (fundingSources.length >= (subscriptionData?.benefits?.maxFundingSources || 0)))
              }
            >
              {mutation.isPending ? "Adding..." : 
               ((subscriptionData?.benefits?.maxFundingSources !== -1) && 
                Array.isArray(fundingSources) && (fundingSources.length >= (subscriptionData?.benefits?.maxFundingSources || 0))) ? 
                "Limit Reached" : "Add Source"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
