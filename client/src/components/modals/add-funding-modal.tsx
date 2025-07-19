import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AddFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFundingModal({ isOpen, onClose }: AddFundingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm();

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setValue("cardNumber", formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setValue("expiryDate", formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric characters and limit to 4 digits
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 4);
    setValue("cvv", numericValue);
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/funding-sources", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Funding source added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funding-sources"] });
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input 
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={watch("cardNumber") || ""}
              onChange={handleCardNumberChange}
              maxLength={19}
              className="mt-1"
            />
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
                placeholder="123"
                value={watch("cvv") || ""}
                onChange={handleCvvChange}
                maxLength={4}
                className="mt-1"
              />
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
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Adding..." : "Add Source"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
