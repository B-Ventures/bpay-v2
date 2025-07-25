import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Loader2,
  Zap,
  Percent
} from "lucide-react";

interface FundingSource {
  id: number;
  name: string;
  type: string;
  last4: string;
  balance: string;
}

interface BcardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export default function CheckoutDemo() {
  const { toast } = useToast();
  const [step, setStep] = useState<'checkout' | 'bpay-split' | 'processing' | 'card-ready' | 'payment-complete'>('checkout');
  const [useBpay, setUseBpay] = useState(false);
  const [integrationMode, setIntegrationMode] = useState<'addon' | 'banner'>('addon');
  const [bcardAmount] = useState(85.99);
  const [fundingSplits, setFundingSplits] = useState<Record<number, number>>({});
  const [processingStep, setProcessingStep] = useState(0);
  const [generatedBcard, setGeneratedBcard] = useState<BcardDetails | null>(null);
  
  // Mock funding sources
  const fundingSources: FundingSource[] = [
    { id: 1, name: "Chase Freedom", type: "credit_card", last4: "4242", balance: "100.00" },
    { id: 2, name: "Bank of America", type: "debit_card", last4: "5678", balance: "100.00" },
    { id: 3, name: "Capital One", type: "credit_card", last4: "1234", balance: "100.00" }
  ];

  // Calculate fees and totals
  const BPAY_FEE_RATE = 0.029;
  const fees = bcardAmount * BPAY_FEE_RATE;
  const totalAmountWithFees = bcardAmount + fees;
  
  // Calculate split amounts
  const totalAllocated = Object.values(fundingSplits).reduce((sum, percent) => sum + (percent || 0), 0);
  const fundingAmounts = Object.entries(fundingSplits).reduce((acc, [sourceId, percent]) => {
    acc[parseInt(sourceId)] = (totalAmountWithFees * (percent || 0)) / 100;
    return acc;
  }, {} as Record<number, number>);

  const handleSplitChange = (sourceId: number, percent: string) => {
    const numPercent = Math.max(0, Math.min(100, parseFloat(percent) || 0));
    setFundingSplits(prev => ({
      ...prev,
      [sourceId]: numPercent
    }));
  };

  const handleProcessBcard = async () => {
    if (Math.abs(totalAllocated - 100) > 0.01) {
      toast({
        title: "Invalid Split",
        description: "Funding splits must add up to 100%",
        variant: "destructive"
      });
      return;
    }

    setStep('processing');
    
    // Simulate processing steps
    const steps = [
      "Validating funding sources...",
      "Processing Chase Freedom ($50.17)...",
      "Processing Bank of America ($38.41)...", 
      "Generating secure bcard...",
      "Finalizing card details..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Generate mock bcard details
    setGeneratedBcard({
      number: "4532 1234 5678 9012",
      expiry: "12/27",
      cvv: "123",
      name: "BPAY USER"
    });

    setStep('card-ready');
  };

  const handleUseBcard = () => {
    // In banner mode, close the extension and populate card details
    if (integrationMode === 'banner') {
      setUseBpay(false);
      toast({
        title: "Card Details Added",
        description: "bcard details have been populated into the checkout form.",
      });
    } else {
      // In addon mode, proceed to payment completion
      setStep('payment-complete');
      toast({
        title: "Payment Successful!",
        description: "Your order has been placed using your bcard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* bpay Global Extension Banner */}
      {integrationMode === 'banner' && useBpay && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto">
            {/* Banner Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6" />
                <span className="text-xl font-bold">bpay</span>
                <Badge className="bg-white/20 text-white border-white/30">Extension</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-90">
                  Split ${bcardAmount.toFixed(2)} payment
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  onClick={() => setUseBpay(false)}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Banner Content - Changes based on step */}
            <div className="p-4">
              {step === 'checkout' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Payment Split Options</h3>
                    <p className="text-xs opacity-90">Choose funding sources and percentages</p>
                  </div>
                  <div className="md:col-span-2">
                    <Button 
                      onClick={() => setStep('bpay-split')}
                      size="sm"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      Configure Payment Split
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 'bpay-split' && (
                <div className="space-y-4">
                  {/* Fee Summary in Banner */}
                  <div className="bg-white/10 p-3 rounded border border-white/20">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="opacity-75">Amount:</span>
                        <div className="font-semibold">${bcardAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="opacity-75">bpay Fee:</span>
                        <div className="font-semibold">+${fees.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="opacity-75">Total:</span>
                        <div className="font-bold">${totalAmountWithFees.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Funding Sources Grid in Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {fundingSources.map((source) => {
                      const requiredAmount = fundingAmounts[source.id] || 0;
                      const availableBalance = parseFloat(source.balance);
                      const hasInsufficientFunds = requiredAmount > availableBalance && fundingSplits[source.id] > 0;
                      
                      return (
                        <div key={source.id} className={`bg-white/10 p-3 rounded border ${hasInsufficientFunds ? 'border-red-300' : 'border-white/20'}`}>
                          <div className="mb-2">
                            <p className="text-xs font-semibold">{source.name}</p>
                            <p className="text-xs opacity-75">•••• {source.last4}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={fundingSplits[source.id] || ''}
                              onChange={(e) => handleSplitChange(source.id, e.target.value)}
                              placeholder="0%"
                              className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white placeholder-white/60"
                            />
                            <div className="text-xs">
                              <span className="opacity-75">$</span>
                              <span className="font-semibold">{(fundingAmounts[source.id] || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          {hasInsufficientFunds && (
                            <p className="text-xs text-red-200 mt-1">⚠️ Insufficient funds</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs">
                      <span className="opacity-75">Allocated: </span>
                      <span className="font-semibold">{totalAllocated.toFixed(1)}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStep('checkout')}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleProcessBcard}
                        disabled={Math.abs(totalAllocated - 100) > 0.01}
                        size="sm"
                        className="bg-white text-blue-600 hover:bg-blue-50"
                      >
                        Generate bcard
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-semibold">Processing Your bcard...</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    {[
                      "Validating sources",
                      "Processing Chase",
                      "Processing B of A", 
                      "Generating card",
                      "Finalizing"
                    ].map((step, index) => (
                      <div key={index} className="flex items-center gap-1">
                        {index < processingStep ? (
                          <CheckCircle className="h-3 w-3 text-green-300" />
                        ) : index === processingStep ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-white/40" />
                        )}
                        <span className={index <= processingStep ? 'opacity-100' : 'opacity-60'}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'card-ready' && generatedBcard && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 p-3 rounded border border-white/20">
                    <div className="text-xs space-y-1">
                      <div className="font-semibold">Virtual Card Generated</div>
                      <div className="font-mono text-sm">{generatedBcard.number}</div>
                      <div className="flex gap-4">
                        <span>Exp: {generatedBcard.expiry}</span>
                        <span>CVV: {generatedBcard.cvv}</span>
                      </div>
                      <div className="text-green-200">✓ Balance: ${bcardAmount.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      onClick={handleUseBcard}
                      size="sm"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      Use This Card for Payment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {integrationMode === 'addon' && step === 'payment-complete' && (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span className="font-semibold">Payment Successful!</span>
                  </div>
                  <p className="text-xs opacity-90">
                    Order placed using bcard •••• {generatedBcard?.number.slice(-4)}
                  </p>
                  <Button 
                    onClick={() => {
                      setStep('checkout');
                      setUseBpay(false);
                      setFundingSplits({});
                      setGeneratedBcard(null);
                    }}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Close Extension
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`${integrationMode === 'banner' && useBpay ? 'pt-48 md:pt-32' : 'pt-8'} pb-8`}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Integration Mode Toggle */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
              <Button
                variant={integrationMode === 'addon' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setIntegrationMode('addon')}
                className="text-xs"
              >
                Addon Integration
              </Button>
              <Button
                variant={integrationMode === 'banner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setIntegrationMode('banner')}
                className="text-xs"
              >
                Banner Integration
              </Button>
            </div>
          </div>

          {/* Merchant Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">TechStore Checkout</h1>
            <p className="text-gray-600">Complete your purchase securely</p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>MacBook Pro 14" M3</span>
                <span>$1,999.00</span>
              </div>
              <div className="flex justify-between">
                <span>Magic Mouse</span>
                <span>$79.00</span>
              </div>
              <div className="flex justify-between">
                <span>AppleCare+</span>
                <span>$199.00</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>$2,277.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>$182.16</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${bcardAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 'checkout' && (
                <>
                  {/* bpay Addon Banner (only shown in addon mode) */}
                  {integrationMode === 'addon' && !useBpay && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-5 w-5" />
                        <span className="font-semibold">Pay smarter with bpay</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">New</Badge>
                      </div>
                      <p className="text-sm text-blue-100 mb-3">
                        Split this payment across multiple funding sources. No single card gets maxed out.
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        onClick={() => setUseBpay(true)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Try bpay for this payment
                      </Button>
                    </div>
                  )}

                  {/* In banner mode, ALWAYS show the normal checkout form */}
                  {integrationMode === 'banner' ? (
                    <div className="space-y-4">
                      {/* Show populated card details if bcard was generated */}
                      {generatedBcard ? (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-900">bcard Ready!</span>
                          </div>
                          <p className="text-sm text-green-700 mb-3">
                            Your payment has been split and card details are ready to use.
                          </p>
                        </div>
                      ) : null}

                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={generatedBcard?.number || ''}
                          className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                          readOnly={!!generatedBcard}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={generatedBcard?.expiry || ''}
                            className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                            readOnly={!!generatedBcard}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={generatedBcard?.cvv || ''}
                            className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                            readOnly={!!generatedBcard}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="name">Cardholder Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={generatedBcard?.name || ''}
                          className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                          readOnly={!!generatedBcard}
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          if (generatedBcard) {
                            setStep('payment-complete');
                            toast({
                              title: "Payment Successful!",
                              description: "Your order has been placed using your bcard.",
                            });
                          }
                        }}
                        disabled={!generatedBcard}
                      >
                        {generatedBcard ? 'Complete Purchase with bcard' : 'Complete Purchase'}
                      </Button>
                    </div>
                  ) : (
                    /* Addon mode - show bpay integration options */
                    useBpay ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="font-semibold text-blue-900 mb-2">bpay Payment Split</h3>
                          <p className="text-sm text-blue-700">Choose how to split this ${bcardAmount.toFixed(2)} payment</p>
                          <div className="text-xs text-blue-600 mt-2">
                            Integration mode: <span className="font-medium capitalize">{integrationMode}</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setStep('bpay-split')}
                          className="w-full"
                        >
                          Configure Payment Split
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={generatedBcard?.number || ''}
                            className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                            readOnly={!!generatedBcard}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              value={generatedBcard?.expiry || ''}
                              className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                              readOnly={!!generatedBcard}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              placeholder="123"
                              value={generatedBcard?.cvv || ''}
                              className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                              readOnly={!!generatedBcard}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="name">Cardholder Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={generatedBcard?.name || ''}
                            className={`mt-1 ${generatedBcard ? 'bg-green-50 border-green-300' : ''}`}
                            readOnly={!!generatedBcard}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            if (generatedBcard) {
                              setStep('payment-complete');
                              toast({
                                title: "Payment Successful!",
                                description: "Your order has been placed using your bcard.",
                              });
                            }
                          }}
                          disabled={!generatedBcard}
                        >
                          {generatedBcard ? 'Complete Purchase with bcard' : 'Complete Purchase'}
                        </Button>
                      </div>
                    )
                  )}
                </>
              )}

              {integrationMode === 'addon' && step === 'bpay-split' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Purchase Amount:</span>
                        <span className="font-medium text-blue-900">${bcardAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">bpay Fee (2.9%):</span>
                        <span className="font-medium text-orange-600">+${fees.toFixed(2)}</span>
                      </div>
                      <hr className="border-blue-300" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">Total to Deduct:</span>
                        <span className="text-lg font-bold text-blue-900">${totalAmountWithFees.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Allocated:</span>
                        <span className="text-sm font-medium text-blue-700">
                          {totalAllocated.toFixed(1)}% ({(100 - totalAllocated).toFixed(1)}% remaining)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Funding Split Percentages
                    </h3>
                    
                    {fundingSources.map((source) => {
                      const requiredAmount = fundingAmounts[source.id] || 0;
                      const availableBalance = parseFloat(source.balance);
                      const hasInsufficientFunds = requiredAmount > availableBalance && fundingSplits[source.id] > 0;
                      
                      return (
                        <div key={source.id} className={`border rounded-lg p-4 ${hasInsufficientFunds ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{source.name}</p>
                              <p className="text-sm text-gray-500">
                                {source.type} •••• {source.last4} • Balance: ${availableBalance.toFixed(2)}
                              </p>
                              {hasInsufficientFunds && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ Insufficient funds: needs ${requiredAmount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div>
                              <Label className="text-xs">Percentage (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={fundingSplits[source.id] || ''}
                                onChange={(e) => handleSplitChange(source.id, e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Amount ($)</Label>
                              <Input
                                value={(fundingAmounts[source.id] || 0).toFixed(2)}
                                disabled
                                className="bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('checkout')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleProcessBcard}
                      disabled={Math.abs(totalAllocated - 100) > 0.01}
                      className="flex-1"
                    >
                      Generate bcard
                    </Button>
                  </div>
                </div>
              )}

              {integrationMode === 'addon' && step === 'processing' && (
                <div className="space-y-6 text-center">
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                    <h3 className="text-lg font-semibold">Processing Your bcard</h3>
                    <p className="text-sm text-gray-600">
                      We're securely collecting funds and generating your virtual card...
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-left">
                      {[
                        "Validating funding sources...",
                        "Processing Chase Freedom ($50.17)...",
                        "Processing Bank of America ($38.41)...", 
                        "Generating secure bcard...",
                        "Finalizing card details..."
                      ].map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {index < processingStep ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : index === processingStep ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={`text-sm ${index <= processingStep ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {integrationMode === 'addon' && step === 'card-ready' && generatedBcard && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="text-lg font-semibold text-green-900">bcard Ready!</h3>
                    <p className="text-sm text-gray-600">
                      Your virtual card has been generated and funded successfully.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">bcard</span>
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div className="text-xl font-mono tracking-wider">
                        {generatedBcard.number}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs opacity-75">VALID THRU</div>
                          <div className="font-mono">{generatedBcard.expiry}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">CVV</div>
                          <div className="font-mono">{generatedBcard.cvv}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{generatedBcard.name}</div>
                      <div className="text-xs opacity-75">Balance: ${bcardAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Secure & Ready</p>
                        <p className="text-xs text-green-700 mt-1">
                          Funds collected from your sources. Card is active and ready for use.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleUseBcard} className="w-full">
                    Use This Card for Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {integrationMode === 'addon' && step === 'payment-complete' && generatedBcard && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                    <h3 className="text-xl font-bold text-green-900">Payment Successful!</h3>
                    <p className="text-gray-600">
                      Your order has been placed using your bcard
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Payment Details</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Card Used:</span>
                        <span>bcard •••• {generatedBcard.number.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>${bcardAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sources Used:</span>
                        <span>Chase Freedom, Bank of America</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setStep('checkout');
                        setUseBpay(false);
                        setFundingSplits({});
                        setGeneratedBcard(null);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Start New Payment
                    </Button>

                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Paid using {integrationMode} integration
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}