import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import RegistrationFlow from "@/components/auth/registration-flow";
import PaymentSplitter from "@/components/payment/payment-splitter";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, CreditCard, Lock, Zap, X, ArrowLeft } from "lucide-react";

type CheckoutStep = 'checkout' | 'bpay-flow' | 'complete';

export default function BannerCheckoutDemo() {
  const { user } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showBpayBanner, setShowBpayBanner] = useState(true);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('checkout');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleTryBpay = () => {
    if (!user) {
      setShowRegistration(true);
    } else {
      // User is logged in, proceed with bpay flow within banner context
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
        <header className="bg-blue-600 text-white py-3 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCheckout}
                className="text-white hover:bg-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Merchant
              </Button>
              <Separator orientation="vertical" className="h-6 bg-blue-400" />
              <Zap className="h-5 w-5" />
              <span className="font-semibold">bpay Extension Payment Flow</span>
              <Badge variant="secondary" className="bg-blue-500 text-white text-xs">Extension Mode</Badge>
            </div>
          </div>
        </header>

        {/* bpay Payment Flow */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <PaymentSplitter
            amount={145.77}
            merchant="TechStore"
            onPaymentComplete={handleBpayComplete}
            integrationMode="banner"
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white py-4 px-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <Zap className="h-6 w-6" />
            <h1 className="text-xl font-bold">bpay Payment Complete</h1>
            <Badge variant="secondary" className="bg-green-500 text-white text-xs">Extension Mode</Badge>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment of $145.77 has been processed using bpay extension's smart payment splitting.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleBackToCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Return to Merchant Site
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to bpay Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* bpay Extension Banner - Only shows at top */}
      {showBpayBanner && (
        <div className="bg-blue-600 text-white py-3 px-4 relative">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5" />
              <span className="font-medium">bpay Extension</span>
              <Badge variant="secondary" className="bg-blue-500 text-white text-xs">Extension Mode</Badge>
              <span className="text-sm opacity-90">
                Split this $145.77 payment across multiple funding sources
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleTryBpay}
                size="sm"
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium"
              >
                Try bpay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBpayBanner(false)}
                className="text-white hover:bg-blue-500 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Original Merchant Site - Unmodified */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">TechStore</h1>
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

          {/* Right Column - Standard Payment Form (Unchanged) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Enter your payment details securely
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
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input 
                        placeholder="MM/YY" 
                        value=""
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Security Code</label>
                      <Input 
                        placeholder="123" 
                        value=""
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cardholder Name</label>
                    <Input 
                      placeholder="John Doe" 
                      value=""
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <Button 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white" 
                  disabled
                >
                  Complete Payment - $145.77
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Your payment information is secured with 256-bit SSL encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Flow Popup */}
      <RegistrationFlow
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        integrationMode="banner"
        onComplete={() => {
          setShowRegistration(false);
          // Stay on banner demo page after registration - user is now logged in
          // The page will automatically update to show they're authenticated
        }}
      />
    </div>
  );
}