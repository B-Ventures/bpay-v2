import { Store, ArrowLeft, ShoppingCart, CreditCard, Percent, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function MerchantPortal() {
  const { user } = useAuth();
  
  const { data: merchants = [] } = useQuery({
    queryKey: ["/api/merchants"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Store className="text-[hsl(249,83%,65%)] h-8 w-8 mr-2" />
              <h1 className="text-2xl font-bold text-[hsl(249,83%,65%)]">bpay Merchant Portal</h1>
            </div>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Merchant Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="text-blue-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">$45,231</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="text-green-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">bpay Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">234</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Percent className="text-purple-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">bpay Adoption</p>
                    <p className="text-2xl font-bold text-gray-900">18%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Users className="text-yellow-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">1,432</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">JavaScript Widget</h4>
                  <p className="text-sm text-gray-600 mb-4">Add bpay checkout option to your website</p>
                  <div className="bg-gray-50 rounded-md p-3 text-sm font-mono text-gray-800 mb-4">
                    {`<script src="https://js.bpay.com/v1/bpay.js"></script>`}
                  </div>
                  <Button className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]">
                    Get Integration Code
                  </Button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">API Integration</h4>
                  <p className="text-sm text-gray-600 mb-4">Full API access for custom implementations</p>
                  <div className="bg-gray-50 rounded-md p-3 text-sm font-mono text-gray-800 mb-4">
                    API Key: {merchants[0]?.apiKey || 'bpay_test_4eC39HqLyjWDarjhD7J6'}
                  </div>
                  <Button className="bg-[hsl(258,70%,68%)] hover:bg-[hsl(258,70%,63%)]">
                    View Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent bpay Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
                <p>No transactions yet. Start integrating bpay to see transaction data.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
