import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import PaymentSplitter from "@/components/payment/payment-splitter";
import { ShoppingCart, CreditCard, Lock, Zap, ArrowLeft, CheckCircle } from "lucide-react";

type CheckoutStep = 'checkout' | 'split' | 'bcard' | 'merchant' | 'complete';

export default function AddonCheckoutDemo() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('checkout');
  const [paymentSplits, setPaymentSplits] = useState<any>(null);
  const [generatedBcard, setGeneratedBcard] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const amount = 145.77;
  const merchant = "TechStore";

  const handleTryBpay = () => {
    // Skip authentication for demo - allow direct access to bpay flow
    setCurrentStep('split');
  };

  const handleSplitConfigured = (result: any) => {
    // If result has splits, it means we got the splits configuration
    if (result && Array.isArray(result)) {
      setPaymentSplits(result);
      setCurrentStep('bcard');
      simulateBcardGeneration(result);
    } else {
      // This is a payment result from the API
      setPaymentSplits(result.splits || []);
      setCurrentStep('bcard');
      simulateBcardGeneration(result.splits || []);
    }
  };

  const [currentAuthIndex, setCurrentAuthIndex] = useState<number>(-1);
  const [waitingForOtp, setWaitingForOtp] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>("");

  const proceedToNextCard = () => {
    setWaitingForOtp(false);
    setOtpValue("");
    
    const nextIndex = currentAuthIndex + 1;
    if (nextIndex < paymentSplits.length) {
      setCurrentAuthIndex(nextIndex);
      // Process the current card
      setTimeout(() => {
        const split = paymentSplits[nextIndex];
        const progress = ((nextIndex * 2 + 2) / (paymentSplits.length * 2 + 1)) * 100;
        setGeneratedBcard((prev: any) => ({
          ...prev,
          progress,
          currentStep: `Processing ${split.name} (${split.percentage ? split.percentage + '%' : '$' + split.amount}) - $${((amount * (split.percentage || 0)) / 100).toFixed(2)}`
        }));
        
        // Move to next card authentication after processing
        setTimeout(() => {
          if (nextIndex + 1 < paymentSplits.length) {
            setCurrentAuthIndex(nextIndex + 1);
            setWaitingForOtp(true);
            const nextSplit = paymentSplits[nextIndex + 1];
            const authProgress = ((nextIndex + 1) * 2 + 1) / (paymentSplits.length * 2 + 1) * 100;
            setGeneratedBcard((prev: any) => ({
              ...prev,
              progress: authProgress,
              currentStep: `Authenticating ${nextSplit.name}... Please complete 3D Secure verification`
            }));
          } else {
            // All cards processed, create bcard
            completeCardGeneration();
          }
        }, 1500);
      }, 500);
    }
  };

  const completeCardGeneration = () => {
    const finalProgress = ((paymentSplits.length * 2 + 1) / (paymentSplits.length * 2 + 1)) * 100;
    setGeneratedBcard((prev: any) => ({
      ...prev,
      progress: finalProgress,
      currentStep: "Creating your bcard..."
    }));
    
    setTimeout(() => {
      const mockBcard = {
        cardNumber: "4242 4242 4242 4242",
        expiryMonth: "12",
        expiryYear: "2025",
        cvv: "123",
        cardholderName: "Demo User",
        balance: amount.toFixed(2)
      };
      
      setGeneratedBcard({
        ...mockBcard,
        progress: 100,
        currentStep: "bcard created successfully!",
        complete: true
      });
      
      setTimeout(() => {
        setCurrentStep('merchant');
      }, 2000);
    }, 2000);
  };

  const simulateBcardGeneration = (splits: any) => {
    setPaymentSplits(splits);
    setCurrentAuthIndex(0);
    setWaitingForOtp(true);
    
    // Start with first card authentication
    setGeneratedBcard({
      progress: ((0 * 2 + 1) / (splits.length * 2 + 1)) * 100,
      currentStep: `Authenticating ${splits[0].name}... Please complete 3D Secure verification`,
      error: null,
      failedStep: null
    });

  };

  const handleMerchantComplete = () => {
    setPaymentResult({
      totalAmount: amount.toFixed(2),
      totalFees: (amount * 0.029).toFixed(2),
      transaction: { id: `tx_${Math.random().toString(36).substr(2, 9)}` }
    });
    setCurrentStep('complete');
  };

  const resetDemo = () => {
    setCurrentStep('checkout');
    setPaymentSplits(null);
    setGeneratedBcard(null);
    setPaymentResult(null);
  };

  const handleBackToCheckout = () => {
    resetDemo();
  };

  // Step 2: Payment Split Configuration
  if (currentStep === 'split') {
    return (
      <div className="min-h-screen bg-gray-50">
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
                <span className="font-semibold">bpay Payment Split</span>
                <Badge variant="secondary" className="text-xs">Step 2/5</Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <PaymentSplitter
            amount={amount}
            merchant={merchant}
            onPaymentSuccess={handleSplitConfigured}
          />
        </div>
      </div>
    );
  }

  // Step 3: bcard Generation Progress
  if (currentStep === 'bcard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Generating Your bcard</span>
              <Badge variant="secondary" className="text-xs">Step 3/5</Badge>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Processing Funding Sources & Generating bcard</CardTitle>
              <p className="text-sm text-gray-600 text-center">Collecting ${amount.toFixed(2)} from your funding sources and loading onto new bcard...</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedBcard && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${generatedBcard.progress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-gray-600">{generatedBcard.currentStep}</p>
                  <p className="text-center text-sm text-gray-500">
                    Progress: {Math.round(generatedBcard.progress || 0)}%
                  </p>

                  {/* 3D Secure OTP Input */}
                  {waitingForOtp && paymentSplits && currentAuthIndex >= 0 && currentAuthIndex < paymentSplits.length && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-blue-900 mb-2">3D Secure Authentication Required</h3>
                        <p className="text-blue-700 text-sm mb-4">
                          Authenticating {paymentSplits[currentAuthIndex].name} (••••{paymentSplits[currentAuthIndex].last4})
                        </p>
                        <div className="bg-white rounded border p-4 mb-4">
                          <p className="text-xs text-gray-600 mb-3">
                            Enter the OTP sent to your phone ending in ••••5678
                          </p>
                          <div className="flex justify-center mb-4">
                            <Input
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-48 text-center text-lg tracking-widest"
                              maxLength={6}
                            />
                          </div>
                          <Button 
                            onClick={proceedToNextCard}
                            disabled={otpValue.length !== 6}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {otpValue.length !== 6 ? 'Enter 6-digit OTP' : 'Verify & Continue'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Demo: Enter any 6 digits to simulate successful verification
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 4: Return to Merchant Checkout with Auto-filled bcard
  if (currentStep === 'merchant') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">{merchant} Checkout</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">bcard Auto-Filled</Badge>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Original Checkout Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <p className="text-sm text-green-600">✓ bcard details auto-filled by bpay</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Card Number</label>
                    <input 
                      type="text" 
                      value={generatedBcard?.cardNumber || ""}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-green-50 border-green-300 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date</label>
                      <input 
                        type="text" 
                        value={generatedBcard ? `${generatedBcard.expiryMonth}/${generatedBcard.expiryYear}` : ""}
                        readOnly
                        className="w-full px-3 py-2 border rounded-lg bg-green-50 border-green-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV</label>
                      <input 
                        type="text" 
                        value={generatedBcard?.cvv || ""}
                        readOnly
                        className="w-full px-3 py-2 border rounded-lg bg-green-50 border-green-300 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                    <input 
                      type="text" 
                      value="Demo User"
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-green-50 border-green-300"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleMerchantComplete}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                size="lg"
              >
                Complete Payment - ${amount.toFixed(2)}
              </Button>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Premium Tech Course</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>bcard Active:</strong> This payment will be charged to your bcard, which was funded from your split payment sources.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Payment Complete
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Payment Complete</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Step 5/5</Badge>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Complete!</h2>
            <p className="text-gray-600 mb-6">
              {merchant} successfully charged your bpay-generated bcard for ${amount.toFixed(2)}. bpay handled the funding source collection behind the scenes.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>How it worked:</strong></p>
                <p>• bpay collected ${amount.toFixed(2)} from your funding sources (60/40 split)</p>
                <p>• bpay generated a bcard loaded with the collected funds</p>
                <p>• Card details were auto-filled into {merchant}'s payment form</p>
                <p>• You completed payment normally - {merchant} charges the bcard</p>
                <p>• {merchant} processed payment without knowing about bpay's backend</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={resetDemo}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Make Another Purchase
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


    </div>
  );
}