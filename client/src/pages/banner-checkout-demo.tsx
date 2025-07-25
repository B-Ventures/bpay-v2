import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import RegistrationFlow from "@/components/auth/registration-flow";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, CreditCard, Lock, Zap, X } from "lucide-react";

export default function BannerCheckoutDemo() {
  const { user } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showBpayBanner, setShowBpayBanner] = useState(true);

  const handleTryBpay = () => {
    if (!user) {
      setShowRegistration(true);
    } else {
      // User is logged in, proceed with bpay checkout
      window.location.href = "/payment-demo";
    }
  };

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
          // Redirect to payment demo after registration
          setTimeout(() => {
            window.location.href = "/payment-demo";
          }, 1000);
        }}
      />
    </div>
  );
}