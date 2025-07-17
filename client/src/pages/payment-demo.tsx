import { useState } from "react";
import { ArrowLeft, ShoppingCart, Store } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaymentSplitter from "@/components/payment/payment-splitter";

export default function PaymentDemo() {
  const [amount, setAmount] = useState(150);
  const [merchant, setMerchant] = useState("Demo Store");
  const [showSplitter, setShowSplitter] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    setShowSplitter(false);
  };

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">${paymentResult.totalAmount}</p>
              <p className="text-sm text-gray-600">paid to {merchant}</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>bpay fee: ${paymentResult.totalFees}</p>
              <p>Transaction ID: {paymentResult.transaction.id}</p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => { setPaymentResult(null); setShowSplitter(false); }}
                className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
              >
                Make Another Payment
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Store className="text-[hsl(249,83%,65%)] h-8 w-8 mr-2" />
              <h1 className="text-2xl font-bold text-[hsl(249,83%,65%)]">Payment Demo</h1>
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showSplitter ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mock Checkout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Mock Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="merchant">Merchant Name</Label>
                  <Input 
                    id="merchant"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input 
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={() => setShowSplitter(true)}
                    className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
                    disabled={amount <= 0}
                  >
                    Pay with bpay
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How bpay Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[hsl(249,83%,65%)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Add Funding Sources</p>
                      <p className="text-sm text-gray-600">Connect your credit cards and bank accounts</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[hsl(258,70%,68%)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Configure Split</p>
                      <p className="text-sm text-gray-600">Set percentages or fixed amounts for each source</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[hsl(186,94%,44%)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Complete Payment</p>
                      <p className="text-sm text-gray-600">We charge each source and generate a virtual card</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setShowSplitter(false)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Checkout
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Split Your Payment</h2>
              <p className="text-gray-600">Configure how you want to split this payment across your funding sources</p>
            </div>
            
            <PaymentSplitter 
              amount={amount}
              merchant={merchant}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}