import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCardModal({ isOpen, onClose }: CreateCardModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: fundingSources = [] } = useQuery({
    queryKey: ["/api/funding-sources"],
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/virtual-cards", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Virtual card created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
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
    mutation.mutate({
      name: data.cardName,
      balance: data.initialBalance,
      status: 'active',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Virtual Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="cardName">Card Name</Label>
            <Input 
              id="cardName"
              placeholder="e.g., Shopping Card"
              {...register("cardName", { required: true })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="initialBalance">Initial Balance</Label>
            <Input 
              id="initialBalance"
              type="number"
              placeholder="100.00"
              min="0"
              step="0.01"
              {...register("initialBalance", { required: true })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Funding Split</Label>
            <div className="space-y-2 mt-2">
              {fundingSources.map((source: any) => (
                <div key={source.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                  <span className="text-sm">{source.name} (•••• {source.last4})</span>
                  <Input 
                    type="number"
                    placeholder={source.defaultSplitPercentage}
                    min="0"
                    max="100"
                    className="w-16"
                  />
                </div>
              ))}
              {fundingSources.length === 0 && (
                <p className="text-sm text-gray-500">No funding sources available. Add a funding source first.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
              disabled={mutation.isPending || fundingSources.length === 0}
            >
              {mutation.isPending ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
