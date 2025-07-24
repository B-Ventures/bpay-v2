import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, DollarSign, Shield } from "lucide-react";

interface CreateBcardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBcardModal({ isOpen, onClose }: CreateBcardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    spendingLimit: 1000,
    interval: 'monthly' as const,
    allowedCategories: [] as string[],
    blockedCategories: [] as string[]
  });

  const createBcardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/virtual-cards", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "bcard Created Successfully!",
        description: `Your new bcard "${result.name}" is ready to use with $${result.balance} balance.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
      onClose();
      setFormData({
        name: '',
        spendingLimit: 1000,
        interval: 'monthly',
        allowedCategories: [],
        blockedCategories: []
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("Insufficient funds")) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough funds in your funding sources to create this bcard. Please add funding sources first.",
          variant: "destructive",
        });
      } else if (error.message?.includes("Issuing") && error.message?.includes("testmode")) {
        toast({
          title: "Issuing API Error",
          description: "There was an issue with Stripe Issuing. Please check your API keys or try again.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a name for your bcard.",
        variant: "destructive",
      });
      return;
    }

    createBcardMutation.mutate({
      name: formData.name,
      spendingLimit: formData.spendingLimit,
      spendingLimits: [
        {
          amount: formData.spendingLimit * 100, // Convert to cents
          interval: formData.interval
        }
      ],
      allowedCategories: formData.allowedCategories,
      blockedCategories: formData.blockedCategories
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-[hsl(249,83%,65%)]" />
            Create New bcard
          </DialogTitle>
          <DialogDescription>
            Create a new virtual card with custom spending limits and restrictions using real Stripe integration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="name">bcard Name</Label>
            <Input
              id="name"
              placeholder="e.g., Shopping Card, Travel Card"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Spending Limit */}
          <div className="space-y-2">
            <Label htmlFor="spending-limit" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Spending Limit
            </Label>
            <Input
              id="spending-limit"
              type="number"
              placeholder="1000"
              value={formData.spendingLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, spendingLimit: parseInt(e.target.value) || 0 }))}
              min="1"
              required
            />
          </div>

          {/* Limit Interval */}
          <div className="space-y-2">
            <Label htmlFor="interval">Limit Period</Label>
            <Select value={formData.interval} onValueChange={(value: any) => setFormData(prev => ({ ...prev, interval: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="all_time">One-time (Total)</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createBcardMutation.isPending}
              className="flex-1 bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
            >
              {createBcardMutation.isPending ? "Creating..." : "Create bcard"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}