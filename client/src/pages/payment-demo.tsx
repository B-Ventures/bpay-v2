import { useState } from "react";
import { ArrowLeft, ShoppingCart, Store, CreditCard, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaymentSplitter from "@/components/payment/payment-splitter";

type PaymentStep = 'checkout' | 'split' | 'bcard' | 'merchant' | 'complete';

export default function PaymentDemo() {
  const [amount, setAmount] = useState(150);
  const [merchant, setMerchant] = useState("Demo Store");
  const [currentStep, setCurrentStep] = useState<PaymentStep>('checkout');
  const [paymentSplits, setPaymentSplits] = useState<any>(null);
  const [generatedBcard, setGeneratedBcard] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleSplitConfigured = (splits: any) => {
    setPaymentSplits(splits);
    setCurrentStep('bcard');
    
    // Simulate realistic bcard generation process
    simulateBcardGeneration(splits);
  };

  const simulateBcardGeneration = (splits: any) => {
    let progress = 0;
    const totalSteps = splits.length + 1; // Each funding source + final bcard creation
    
    const updateProgress = (step: number, message: string) => {
      progress = (step / totalSteps) * 100;
      setGeneratedBcard(prev => ({
        ...prev,
        progress,
        currentStep: message
      }));
    };

    // Step 1: Initialize
    updateProgress(0, "Initializing payment process...");
    
    // Simulate deducting from each funding source
    splits.forEach((split: any, index: number) => {
      setTimeout(() => {
        updateProgress(index + 1, `Processing ${split.type} (${split.percentage ? split.percentage + '%' : '$' + split.amount})...`);
      }, (index + 1) * 1500);
    });

    // Final step: Create bcard
    setTimeout(() => {
      updateProgress(totalSteps, "Creating your bcard...");
      
      // Complete bcard generation
      setTimeout(() => {
        const mockBcard = {
          id: `bcard_${Date.now()}`,
          number: "4555 1234 5678 9012",
          expiry: "12/28",
          cvv: "123",
          balance: amount,
          merchant: merchant,
          status: "active",
          progress: 100,
          currentStep: "Complete"
        };
        setGeneratedBcard(mockBcard);
        setCurrentStep('merchant');
      }, 1000);
    }, splits.length * 1500 + 1000);
  };

  const handleMerchantCheckout = (result: any) => {
    setPaymentResult(result);
    setCurrentStep('complete');
  };

  const resetDemo = () => {
    setCurrentStep('checkout');
    setPaymentSplits(null);
    setGeneratedBcard(null);
    setPaymentResult(null);
  };

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
        {/* Step 1: Checkout */}
        {currentStep === 'checkout' && (
          <div className="grid md:grid-cols-2 gap-8">
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
                    onClick={() => setCurrentStep('split')}
                    className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
                    disabled={amount <= 0}
                  >
                    Pay with bpay
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                      <p className="font-medium">Configure Payment Split</p>
                      <p className="text-sm text-gray-600">Set percentages or fixed amounts for each funding source</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[hsl(258,70%,68%)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Generate bcard</p>
                      <p className="text-sm text-gray-600">We process splits and create a virtual card instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[hsl(186,94%,44%)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Auto-fill Checkout</p>
                      <p className="text-sm text-gray-600">bcard details automatically populate merchant checkout</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Payment Split Configuration */}
        {currentStep === 'split' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('checkout')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Checkout
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Configure Payment Split</h2>
              <p className="text-gray-600">Set how you want to split this ${amount} payment across your funding sources</p>
            </div>
            
            <PaymentSplitter 
              amount={amount}
              merchant={merchant}
              onPaymentSuccess={handleSplitConfigured}
            />
          </div>
        )}

        {/* Step 3: bcard Generation */}
        {currentStep === 'bcard' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Generating Your bcard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[hsl(249,83%,65%)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold">Processing Your Payment Split</h3>
                  <p className="text-gray-600">
                    {generatedBcard?.currentStep || "Preparing to charge your funding sources..."}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[hsl(249,83%,65%)] h-3 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${generatedBcard?.progress || 0}%` }}
                  ></div>
                </div>

                {/* Payment Split Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Processing Steps:</h4>
                  <div className="space-y-3">
                    {paymentSplits && paymentSplits.map((split: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            (generatedBcard?.progress || 0) > (index + 1) * (100 / (paymentSplits.length + 1))
                              ? 'bg-green-500 text-white'
                              : (generatedBcard?.progress || 0) >= index * (100 / (paymentSplits.length + 1))
                              ? 'bg-[hsl(249,83%,65%)] text-white animate-pulse'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {(generatedBcard?.progress || 0) > (index + 1) * (100 / (paymentSplits.length + 1)) ? '✓' : index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{split.name}</p>
                            <p className="text-sm text-gray-600">{split.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {split.percentage ? `${split.percentage}%` : `$${split.amount}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${split.percentage ? ((amount * split.percentage) / 100).toFixed(2) : split.amount}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Final bcard creation step */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          (generatedBcard?.progress || 0) === 100
                            ? 'bg-green-500 text-white'
                            : (generatedBcard?.progress || 0) > 80
                            ? 'bg-[hsl(249,83%,65%)] text-white animate-pulse'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {(generatedBcard?.progress || 0) === 100 ? '✓' : '🔄'}
                        </div>
                        <div>
                          <p className="font-medium">Create bcard</p>
                          <p className="text-sm text-gray-600">Loading ${amount} onto new card</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[hsl(249,83%,65%)]">${amount}</p>
                        <p className="text-sm text-gray-600">Full balance</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Balance Collection */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">💰 Collecting Funds</h4>
                  <div className="text-sm">
                    <p className="text-blue-800">
                      <strong>Collected:</strong> ${(() => {
                        const currentProgress = generatedBcard?.progress || 0;
                        const completedSources = Math.floor((currentProgress / 100) * paymentSplits?.length || 0);
                        let collected = 0;
                        if (paymentSplits) {
                          for (let i = 0; i < completedSources; i++) {
                            const split = paymentSplits[i];
                            collected += split.percentage ? (amount * split.percentage) / 100 : parseFloat(split.amount);
                          }
                        }
                        return collected.toFixed(2);
                      })()}
                    </p>
                    <p className="text-blue-800">
                      <strong>Remaining:</strong> ${(amount - parseFloat((() => {
                        const currentProgress = generatedBcard?.progress || 0;
                        const completedSources = Math.floor((currentProgress / 100) * paymentSplits?.length || 0);
                        let collected = 0;
                        if (paymentSplits) {
                          for (let i = 0; i < completedSources; i++) {
                            const split = paymentSplits[i];
                            collected += split.percentage ? (amount * split.percentage) / 100 : parseFloat(split.amount);
                          }
                        }
                        return collected.toFixed(2);
                      })())).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p><strong>Processing for:</strong> {merchant}</p>
                  <p><strong>Total Amount:</strong> ${amount}</p>
                  <p><strong>Expected Time:</strong> {paymentSplits ? `${paymentSplits.length * 1.5 + 1}` : '3-5'} seconds</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Merchant Checkout Auto-fill */}
        {currentStep === 'merchant' && generatedBcard && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Merchant Checkout</h2>
              <p className="text-gray-600">Your bcard details have been automatically filled in the checkout form</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Generated bcard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    bcard Generated
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(258,70%,68%)] p-6 rounded-lg text-white">
                    <div className="mb-4">
                      <p className="text-sm opacity-90">bcard ID</p>
                      <p className="font-mono text-xs">{generatedBcard.id}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm opacity-90">Card Number</p>
                      <p className="font-mono text-lg tracking-wider">{generatedBcard.number}</p>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm opacity-90">Expiry</p>
                        <p className="font-mono">{generatedBcard.expiry}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">CVV</p>
                        <p className="font-mono">{generatedBcard.cvv}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Balance: ${generatedBcard.balance}</p>
                    <p>Merchant: {generatedBcard.merchant}</p>
                    <p>Status: {generatedBcard.status}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Mock Merchant Checkout */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2" />
                    {merchant} Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="checkout-card">Card Number</Label>
                    <Input 
                      id="checkout-card"
                      value={generatedBcard.number}
                      disabled
                      className="mt-1 bg-green-50 border-green-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="checkout-expiry">Expiry</Label>
                      <Input 
                        id="checkout-expiry"
                        value={generatedBcard.expiry}
                        disabled
                        className="mt-1 bg-green-50 border-green-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout-cvv">CVV</Label>
                      <Input 
                        id="checkout-cvv"
                        value={generatedBcard.cvv}
                        disabled
                        className="mt-1 bg-green-50 border-green-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="checkout-amount">Amount</Label>
                    <Input 
                      id="checkout-amount"
                      value={`$${amount}`}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        const mockResult = {
                          totalAmount: amount,
                          totalFees: (amount * 0.029).toFixed(2),
                          transaction: { id: `txn_${Date.now()}` }
                        };
                        handleMerchantCheckout(mockResult);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Complete Purchase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 5: Payment Complete */}
        {currentStep === 'complete' && paymentResult && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-600">Payment Successful!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
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
                    onClick={resetDemo}
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
        )}
      </div>
    </div>
  );
}