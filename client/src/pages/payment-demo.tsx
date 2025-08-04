import { useState } from "react";
import { ArrowLeft, ShoppingCart, Store, CreditCard, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaymentSplitter from "@/components/payment/payment-splitter";
import DemoModeToggle from "@/components/ui/demo-mode-toggle";
import { useDemoMode } from "@/components/providers/demo-mode-provider";

type PaymentStep = 'checkout' | 'split' | 'bcard' | 'merchant' | 'complete';

export default function PaymentDemo() {
  const { isDemoMode } = useDemoMode();
  const [amount, setAmount] = useState(150);
  const [merchant, setMerchant] = useState("Demo Store");
  const [currentStep, setCurrentStep] = useState<PaymentStep>('checkout');
  const [paymentSplits, setPaymentSplits] = useState<any>(null);
  const [generatedBcard, setGeneratedBcard] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [localDemoMode, setLocalDemoMode] = useState<'success' | 'failure'>('success');
  
  // Use global demo mode when available, otherwise fall back to local demo mode
  const effectiveDemoMode = isDemoMode ? 'success' : localDemoMode;

  const handleSplitConfigured = (result: any) => {
    console.log("Payment result received:", result);
    // If result has splits, it means we got the splits configuration
    if (result && Array.isArray(result)) {
      // This is the splits configuration, not a payment result
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

  const simulateBcardGeneration = (splits: any) => {
    // Ensure splits is an array
    if (!Array.isArray(splits)) {
      console.error("Splits is not an array:", splits);
      setGeneratedBcard({
        error: "Invalid splits configuration",
        showRetryOptions: true,
        failedStep: 1
      });
      return;
    }

    let progress = 0;
    const totalSteps = splits.length + 1; // Each funding source + final bcard creation
    
    const updateProgress = (step: number, message: string, error?: string) => {
      progress = (step / totalSteps) * 100;
      setGeneratedBcard((prev: any) => ({
        ...prev,
        progress,
        currentStep: message,
        error: error || null,
        failedStep: error ? step : null
      }));
    };

    // Step 1: Initialize
    updateProgress(0, "Initializing payment process...");
    
    // Simulate deducting from each funding source
    let hasError = false;
    splits.forEach((split: any, index: number) => {
      setTimeout(() => {
        // Simulate failure scenario for demo purposes
        if (effectiveDemoMode === 'failure' && index === 1 && !hasError) {
          hasError = true;
          updateProgress(index + 1, `Failed to process ${split.type}`, `Insufficient funds on ${split.name}. Available: $${(Math.random() * 50).toFixed(2)}, Required: $${split.percentage ? ((amount * split.percentage) / 100).toFixed(2) : split.amount}`);
          
          // Show retry/cancel options after 2 seconds
          setTimeout(() => {
            setGeneratedBcard((prev: any) => ({
              ...prev,
              showRetryOptions: true
            }));
          }, 2000);
          return;
        }
        
        if (!hasError) {
          updateProgress(index + 1, `Processing ${split.type} (${split.percentage ? split.percentage + '%' : '$' + split.amount})...`);
        }
      }, (index + 1) * 1500);
    });

    // Final step: Create bcard (only if no errors)
    setTimeout(() => {
      if (!hasError) {
        updateProgress(totalSteps, "Creating your bcard...");
        
        // Complete bcard generation with real Stripe Issuing API
        setTimeout(async () => {
          try {
            updateProgress(totalSteps, "Processing payment and creating bcard...");
            
            // Step 1: Process payment splits and capture funds
            const paymentResponse = await fetch('/api/process-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount,
                merchant,
                virtualCardId: null, // Will create a new card
                splits: splits
              })
            });

            if (!paymentResponse.ok) {
              throw new Error('Failed to process payment splits');
            }

            const paymentResult = await paymentResponse.json();
            updateProgress(totalSteps, "Creating your bcard with captured funds...");

            // Step 2: Create real virtual card using Stripe Issuing
            const cardResponse = await fetch('/api/virtual-cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `${merchant} Payment`,
                spendingLimit: amount,
                spendingLimits: [
                  {
                    amount: amount * 100, // Convert to cents
                    interval: 'per_authorization'
                  }
                ],
                allowedCategories: [], // Allow all categories for demo
                blockedCategories: []
              })
            });

            if (!cardResponse.ok) {
              throw new Error('Failed to create virtual card');
            }

            const virtualCard = await cardResponse.json();

            // Step 3: Get full card details for merchant checkout
            const detailsResponse = await fetch(`/api/virtual-cards/${virtualCard.id}/checkout-details`);
            const cardDetails = await detailsResponse.json();

            const realBcard = {
              id: virtualCard.id,
              stripeCardId: virtualCard.stripeCardId,
              number: cardDetails.cardNumber || `****-****-****-${virtualCard.stripeIssuingCard?.last4 || '****'}`,
              expiry: `${cardDetails.expiryMonth?.toString().padStart(2, '0')}/${cardDetails.expiryYear?.toString().slice(-2)}`,
              cvv: cardDetails.cvv || '***',
              balance: amount,
              merchant: merchant,
              status: "active",
              progress: 100,
              currentStep: "Complete",
              isRealCard: !cardDetails.isDemoCard
            };

            setGeneratedBcard(realBcard);
            setCurrentStep('merchant');
          } catch (error) {
            console.error('Failed to create real bcard:', error);
            
            // Fallback to demo mode if user is not authenticated or API fails
            const mockBcard = {
              id: `bcard_demo_${Date.now()}`,
              number: "4242 4242 4242 4242",
              expiry: "12/28",
              cvv: "123",
              balance: amount,
              merchant: merchant,
              status: "active",
              progress: 100,
              currentStep: "Complete",
              isRealCard: false,
              demoNote: "Demo card - would be real with authentication"
            };
            setGeneratedBcard(mockBcard);
            setCurrentStep('merchant');
          }
        }, 1000);
      }
    }, splits.length * 1500 + 1000);
  };

  const retryPayment = () => {
    // Switch to success mode and retry
    setLocalDemoMode('success');
    setGeneratedBcard(null);
    simulateBcardGeneration(paymentSplits);
  };

  const cancelPayment = () => {
    // Reset to checkout
    setCurrentStep('checkout');
    setPaymentSplits(null);
    setGeneratedBcard(null);
    setPaymentResult(null);
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

  const toggleLocalDemoMode = () => {
    setLocalDemoMode(prev => prev === 'success' ? 'failure' : 'success');
    resetDemo();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:py-6">
            <div className="flex items-center">
              <Store className="text-[hsl(249,83%,65%)] h-6 w-6 sm:h-8 sm:w-8 mr-2" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[hsl(249,83%,65%)]">Payment Demo</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Current Scenario: <span className={`font-semibold ${effectiveDemoMode === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {effectiveDemoMode === 'success' ? 'Success Flow' : 'Failure Flow'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Toggle */}
        <div className="flex justify-center sm:justify-end mb-6">
          <DemoModeToggle />
        </div>
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
                
                {/* Demo Mode Selector - Only show if global demo mode is OFF */}
                {!isDemoMode && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <Label className="text-sm font-medium mb-2 block">Demo Scenario</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="localDemoMode"
                          value="success"
                          checked={localDemoMode === 'success'}
                          onChange={(e) => setLocalDemoMode(e.target.value as 'success' | 'failure')}
                          className="mr-2"
                        />
                        <span className="text-sm">Success Flow</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="localDemoMode"
                          value="failure"
                          checked={localDemoMode === 'failure'}
                          onChange={(e) => setLocalDemoMode(e.target.value as 'success' | 'failure')}
                          className="mr-2"
                        />
                        <span className="text-sm">Failure Flow</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {localDemoMode === 'success' 
                        ? "Simulates successful payment processing and bcard generation"
                        : "Simulates funding source failure and error handling"
                      }
                    </p>
                  </div>
                )}
                
                {/* Global Demo Mode Info */}
                {isDemoMode && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium mb-2 block text-blue-800">Global Demo Mode Active</Label>
                    <p className="text-xs text-blue-600">
                      Using global demo mode with success flow. Toggle demo mode in the header to switch to real data.
                    </p>
                  </div>
                )}
                
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
                    {paymentSplits && Array.isArray(paymentSplits) && paymentSplits.map((split: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            generatedBcard?.failedStep === index + 1
                              ? 'bg-red-500 text-white'
                              : (generatedBcard?.progress || 0) > (index + 1) * (100 / (paymentSplits.length + 1))
                              ? 'bg-green-500 text-white'
                              : (generatedBcard?.progress || 0) >= index * (100 / (paymentSplits.length + 1))
                              ? 'bg-[hsl(249,83%,65%)] text-white animate-pulse'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {generatedBcard?.failedStep === index + 1 
                              ? '✗' 
                              : (generatedBcard?.progress || 0) > (index + 1) * (100 / (paymentSplits.length + 1)) 
                              ? '✓' 
                              : index + 1}
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
                        if (!paymentSplits || !Array.isArray(paymentSplits)) return '0.00';
                        const currentProgress = generatedBcard?.progress || 0;
                        const completedSources = Math.floor((currentProgress / 100) * paymentSplits.length);
                        let collected = 0;
                        for (let i = 0; i < Math.min(completedSources, paymentSplits.length); i++) {
                          const split = paymentSplits[i];
                          collected += split.percentage ? (amount * split.percentage) / 100 : parseFloat(split.amount || 0);
                        }
                        return collected.toFixed(2);
                      })()}
                    </p>
                    <p className="text-blue-800">
                      <strong>Remaining:</strong> ${(() => {
                        if (!paymentSplits || !Array.isArray(paymentSplits)) return amount.toFixed(2);
                        const currentProgress = generatedBcard?.progress || 0;
                        const completedSources = Math.floor((currentProgress / 100) * paymentSplits.length);
                        let collected = 0;
                        for (let i = 0; i < Math.min(completedSources, paymentSplits.length); i++) {
                          const split = paymentSplits[i];
                          collected += split.percentage ? (amount * split.percentage) / 100 : parseFloat(split.amount || 0);
                        }
                        return (amount - collected).toFixed(2);
                      })()}
                    </p>
                  </div>
                </div>

                {/* Error Display and Retry Options */}
                {generatedBcard?.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold">✗</span>
                      </div>
                      <h4 className="font-semibold text-red-900">Payment Processing Failed</h4>
                    </div>
                    <p className="text-red-800 text-sm mb-4">{generatedBcard.error}</p>
                    
                    {generatedBcard.showRetryOptions && (
                      <div className="space-y-3">
                        <div className="flex space-x-3">
                          <Button 
                            onClick={retryPayment}
                            className="flex-1 bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
                          >
                            Retry Payment
                          </Button>
                          <Button 
                            onClick={cancelPayment}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel & Reconfigure
                          </Button>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <h5 className="font-medium text-yellow-900 mb-1">Possible Solutions:</h5>
                          <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• Check if funding source has sufficient balance</li>
                            <li>• Verify card is not expired or blocked</li>
                            <li>• Try with a different funding source</li>
                            <li>• Reduce the amount for this funding source</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center text-sm text-gray-500">
                  <p><strong>Processing for:</strong> {merchant}</p>
                  <p><strong>Total Amount:</strong> ${amount}</p>
                  <p><strong>Expected Time:</strong> {paymentSplits && Array.isArray(paymentSplits) ? `${paymentSplits.length * 1.5 + 1}` : '3-5'} seconds</p>
                  <p><strong>Demo Mode:</strong> {effectiveDemoMode === 'success' ? 'Success Scenario' : 'Failure Scenario'}</p>
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
                    {generatedBcard.isRealCard && (
                      <p className="text-green-600 font-medium">✓ Real Stripe Issuing Card</p>
                    )}
                    {generatedBcard.demoNote && (
                      <p className="text-blue-600 text-xs">{generatedBcard.demoNote}</p>
                    )}
                    {generatedBcard.stripeCardId && (
                      <p className="text-xs text-gray-500">Stripe ID: {generatedBcard.stripeCardId}</p>
                    )}
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
                  <Button 
                    onClick={toggleLocalDemoMode}
                    variant="outline"
                    className="w-full"
                  >
                    Try {effectiveDemoMode === 'success' ? 'Failure' : 'Success'} Scenario
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