import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import CreateBcardModal from "@/components/bcard/create-bcard-modal";

export default function Bcards() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: bcards = [] } = useQuery<any[]>({
    queryKey: ["/api/virtual-cards"],
    enabled: !!user,
  });

  const getCardGradient = (index: number) => {
    const gradients = [
      'from-[hsl(249,83%,65%)] to-[hsl(258,70%,68%)]',
      'from-[hsl(258,70%,68%)] to-purple-600',
      'from-[hsl(186,94%,44%)] to-blue-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>bcards</CardTitle>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create bcard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bcards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium mb-2">No bcards yet</p>
              <p className="text-sm mb-4">Create your first bcard to start making payments</p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
              >
                Create bcard
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bcards.map((card: any, index: number) => (
                <div key={card.id} className={`bg-gradient-to-br ${getCardGradient(index)} rounded-xl p-6 text-white`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm opacity-80">bcard</p>
                      <p className="font-semibold">{card.name}</p>
                    </div>
                    <CreditCard className="h-6 w-6 opacity-80" />
                  </div>
                  <div className="mb-4">
                    <p className="text-lg font-mono tracking-wider">
                      {card.cardNumber.slice(0, 4)} •••• •••• {card.cardNumber.slice(-4)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs opacity-80">Balance</p>
                      <p className="font-semibold">${parseFloat(card.balance).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">Status</p>
                      <p className="font-semibold capitalize">{card.status}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div 
                onClick={() => setShowCreateModal(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-[hsl(249,83%,65%)] hover:text-[hsl(249,83%,65%)] transition-colors cursor-pointer"
              >
                <Plus className="h-12 w-12 mb-2" />
                <p className="font-medium">Create New bcard</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateBcardModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
