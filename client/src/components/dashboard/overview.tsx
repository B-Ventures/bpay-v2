import { useState } from "react";
import { CreditCard, TrendingUp, Clock, Plus, Wallet, Zap, Play, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import AddFundingModal from "@/components/modals/add-funding-modal";
import CreateBcardModal from "@/components/bcard/create-bcard-modal";

export default function Overview() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateBcardModal, setShowCreateBcardModal] = useState(false);
  
  const { data: virtualCards = [] } = useQuery({
    queryKey: ["/api/virtual-cards"],
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  const totalSpent = transactions.reduce((sum: number, transaction: any) => {
    return sum + parseFloat(transaction.amount || 0);
  }, 0);

  const thisMonth = transactions
    .filter((transaction: any) => {
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount || 0), 0);

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[hsl(249,83%,65%)]/10 rounded-lg">
                <CreditCard className="text-[hsl(249,83%,65%)] h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active bcards</p>
                <p className="text-2xl font-bold text-gray-900">{virtualCards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">${thisMonth.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => setShowCreateBcardModal(true)}
                className="w-full flex items-center justify-between p-4 bg-[hsl(249,83%,65%)]/5 hover:bg-[hsl(249,83%,65%)]/10 h-auto"
                variant="ghost"
              >
                <div className="flex items-center">
                  <Plus className="text-[hsl(249,83%,65%)] h-5 w-5 mr-3" />
                  <span className="font-medium">Create bcard</span>
                </div>
                <span className="text-[hsl(249,83%,65%)]">→</span>
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-between p-4 bg-[hsl(258,70%,68%)]/5 hover:bg-[hsl(258,70%,68%)]/10 h-auto"
                variant="ghost"
              >
                <div className="flex items-center">
                  <Wallet className="text-[hsl(258,70%,68%)] h-5 w-5 mr-3" />
                  <span className="font-medium">Add Funding Source</span>
                </div>
                <span className="text-[hsl(258,70%,68%)]">→</span>
              </Button>
              <Link href="/payment-demo">
                <Button 
                  className="w-full flex items-center justify-between p-4 bg-[hsl(186,94%,44%)]/5 hover:bg-[hsl(186,94%,44%)]/10 h-auto"
                  variant="ghost"
                >
                  <div className="flex items-center">
                    <Play className="text-[hsl(186,94%,44%)] h-5 w-5 mr-3" />
                    <span className="font-medium">Payment Demo</span>
                  </div>
                  <span className="text-[hsl(186,94%,44%)]">→</span>
                </Button>
              </Link>
              <Link href="/checkout-demo">
                <Button 
                  className="w-full flex items-center justify-between p-4 bg-[hsl(20,94%,60%)]/5 hover:bg-[hsl(20,94%,60%)]/10 h-auto"
                  variant="ghost"
                >
                  <div className="flex items-center">
                    <ShoppingCart className="text-[hsl(20,94%,60%)] h-5 w-5 mr-3" />
                    <span className="font-medium">Checkout Demo</span>
                  </div>
                  <span className="text-[hsl(20,94%,60%)]">→</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 3).map((transaction: any, index: number) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      transaction.status === 'completed' ? 'bg-green-500' : 
                      transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {transaction.status === 'completed' ? 'Payment completed' : 
                       transaction.status === 'pending' ? 'Payment pending' : 'Transaction created'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddFundingModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      <CreateBcardModal 
        isOpen={showCreateBcardModal} 
        onClose={() => setShowCreateBcardModal(false)} 
      />
    </div>
  );
}
