import { Store, FileText, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/components/providers/demo-mode-provider";

export default function Transactions() {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();

  // Demo transactions data
  const demoTransactions = [
    {
      id: 1,
      createdAt: "2025-01-20T12:00:00Z",
      merchant: "Demo Store",
      amount: "100.00",
      status: "completed",
      virtualCardName: "bpay Card #1",
      description: "Online purchase"
    },
    {
      id: 2,
      createdAt: "2025-01-19T15:30:00Z",
      merchant: "Demo Store",
      amount: "150.00",
      status: "completed",
      virtualCardName: "bpay Card #1",
      description: "Subscription payment"
    },
    {
      id: 3,
      createdAt: "2025-01-18T09:15:00Z",
      merchant: "Demo Store",
      amount: "150.00",
      status: "completed",
      virtualCardName: "bpay Card #2",
      description: "Grocery shopping"
    },
    {
      id: 4,
      createdAt: "2025-01-18T14:45:00Z",
      merchant: "Demo Store",
      amount: "100.00",
      status: "completed",
      virtualCardName: "bpay Card #1",
      description: "Gas station"
    },
    {
      id: 5,
      createdAt: "2025-01-18T18:20:00Z",
      merchant: "Demo Store",
      amount: "150.00",
      status: "completed",
      virtualCardName: "bpay Card #2",
      description: "Restaurant"
    }
  ];

  const { data: realTransactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user && !isDemoMode,
  });

  // Use demo data when in demo mode, real data when in normal mode (and authenticated)
  const transactions = isDemoMode ? demoTransactions : (user ? realTransactions : []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-[hsl(249,83%,65%)]" />
              Transaction History
            </CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction: any) => (
                <Card key={transaction.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Store className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {transaction.merchant}
                            </h3>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                            {transaction.virtualCardName && (
                              <div className="flex items-center">
                                <CreditCard className="h-3 w-3 mr-1" />
                                {transaction.virtualCardName}
                              </div>
                            )}
                          </div>
                          {transaction.description && (
                            <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2">
                        <div className="text-lg font-semibold text-gray-900">
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[hsl(249,83%,65%)] hover:text-[hsl(249,83%,60%)] p-2"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
