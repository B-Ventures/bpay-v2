import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import RegistrationFlow from "@/components/auth/registration-flow";
import PaymentSplitter from "@/components/payment/payment-splitter";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, CreditCard, Lock, Zap, ArrowLeft } from "lucide-react";

type CheckoutStep = 'checkout' | 'bpay-flow' | 'complete';

export default function AddonCheckoutDemo() {
  const { user } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('checkout');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleTryBpay = () => {
    if (!user) {
      setShowRegistration(true);
    } else {
      // User is logged in, proceed with bpay flow within addon context
      setCurrentStep('bpay-flow');
    }
  };

  const handleBpayComplete = (result: any) => {
    setPaymentResult(result);
    setCurrentStep('complete');
  };

  const handleBackToCheckout = () => {
    setCurrentStep('checkout');
    setPaymentResult(null);
  };

  if (currentStep === 'bpay-flow') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back button */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToCheckout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Checkout
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">bpay Payment Flow</span>
                <Badge variant="secondary" className="text-xs">Addon Mode</Badge>
              </div>
            </div>
          </div>
        </header>

        {/* bpay Payment Flow */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <PaymentSplitter
            amount={145.77}
            merchant="TechStore"
            onPaymentComplete={handleBpayComplete}
            integrationMode="addon"
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Payment Complete</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Success</Badge>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment of $145.77 has been processed using bpay's smart payment splitting.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleBackToCheckout}
                className="w-full"
              >
                Make Another Purchase
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">TechStore</h1>
              <Badge variant="secondary" className="text-xs">Addon Mode</Badge>
            </div>
            <div className="text-sm text-gray-600">
              Secure Checkout
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Premium Laptop Stand</h3>
                      <p className="text-sm text-gray-600">Adjustable Aluminum</p>
                    </div>
                  </div>
                  <span className="font-medium">$145.77</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>$145.77</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>$145.77</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Options */}
          <div className="space-y-6">
            {/* bpay Option - Highlighted */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Pay with bpay</CardTitle>
                    <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Split this payment across multiple cards and funding sources
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Smart Payment Benefits:</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Split across multiple cards automatically</li>
                    <li>• Maximize rewards and cashback</li>
                    <li>• Stay within credit limits</li>
                    <li>• Generate secure bcards</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleTryBpay}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                  size="lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Try bpay for this payment
                </Button>
              </CardContent>
            </Card>

            {/* Traditional Payment */}
            <Card className="opacity-75">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Traditional Payment
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Use a single payment method
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Card Number</label>
                    <Input 
                      placeholder="1234 5678 9012 3456" 
                      value=""
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Expiry</label>
                      <Input 
                        placeholder="MM/YY" 
                        value=""
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CVV</label>
                      <Input 
                        placeholder="123" 
                        value=""
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12" 
                  disabled
                >
                  Complete Payment - $145.77
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Flow Popup */}
      <RegistrationFlow
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        integrationMode="addon"
        onComplete={() => {
          setShowRegistration(false);
          // Stay on addon demo page after registration - user is now logged in
          // The page will automatically update to show they're authenticated
        }}
      />
    </div>
  );
}