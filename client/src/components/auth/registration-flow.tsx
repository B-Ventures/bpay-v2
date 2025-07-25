import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import FirstTimeUserGuide from "@/components/onboarding/first-time-user-guide";
import { 
  CreditCard, 
  User, 
  Phone, 
  MapPin,
  CheckCircle, 
  ArrowRight,
  Zap,
  Shield,
  Star
} from "lucide-react";

interface RegistrationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  integrationMode: 'addon' | 'banner';
  onComplete?: () => void;
}

interface UserProfile {
  phoneNumber?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface FundingSourceData {
  name: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  type: 'credit_card' | 'debit_card';
}

export default function RegistrationFlow({ isOpen, onClose, integrationMode, onComplete }: RegistrationFlowProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'guide' | 'welcome' | 'profile' | 'funding' | 'complete'>('guide');
  const [profile, setProfile] = useState<UserProfile>({
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });
  const [fundingSource, setFundingSource] = useState<FundingSourceData>({
    name: '',
    cardNumber: '',
    expiryMonth: 1,
    expiryYear: new Date().getFullYear() + 1,
    cvv: '',
    type: 'credit_card'
  });

  // Auto-populate profile from existing user data
  useEffect(() => {
    if (user && isOpen) {
      setProfile({
        phoneNumber: (user as any).phoneNumber || '',
        address: (user as any).address || {
          line1: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US'
        }
      });
    }
  }, [user, isOpen]);

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UserProfile) => {
      const response = await apiRequest("PATCH", "/api/auth/user", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
      setStep('funding');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Profile Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Add funding source
  const addFundingMutation = useMutation({
    mutationFn: async (fundingData: FundingSourceData) => {
      const response = await apiRequest("POST", "/api/funding-sources", {
        ...fundingData,
        cardNumber: fundingData.cardNumber.replace(/\s/g, ''), // Remove spaces
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Funding Source Added",
        description: "Your payment method has been securely added.",
      });
      setStep('complete');
      queryClient.invalidateQueries({ queryKey: ["/api/funding-sources"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Payment Method",
        description: error.message || "Please check your card details and try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = () => {
    if (!profile.phoneNumber || !profile.address?.line1 || !profile.address?.city) {
      toast({
        title: "Incomplete Profile",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(profile);
  };

  const handleFundingSubmit = () => {
    if (!fundingSource.name || !fundingSource.cardNumber || !fundingSource.cvv) {
      toast({
        title: "Incomplete Payment Method",
        description: "Please fill in all card details.",
        variant: "destructive",
      });
      return;
    }
    addFundingMutation.mutate(fundingSource);
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
    toast({
      title: "Welcome to bpay!",
      description: "Your account is ready. Start splitting payments smartly!",
    });
  };

  const getStepProgress = () => {
    switch (step) {
      case 'guide': return 20;
      case 'welcome': return 40;
      case 'profile': return 60;
      case 'funding': return 80;
      case 'complete': return 100;
      default: return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${integrationMode === 'banner' ? 'fixed inset-0 z-50 bg-black/50' : ''}`}>
      <div className={`${
        integrationMode === 'banner' 
          ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4' 
          : 'w-full max-w-md mx-auto'
      }`}>
        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Welcome to bpay</h2>
              {integrationMode === 'banner' && (
                <Badge variant="secondary" className="text-xs">Extension</Badge>
              )}
            </div>
            <Progress value={getStepProgress()} className="w-full" />
            <p className="text-sm text-gray-600">
              Step {getStepProgress() / 20} of 5 - Complete your account setup
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'guide' && (
              <FirstTimeUserGuide 
                integrationMode={integrationMode}
                onGetStarted={() => {
                  if (user) {
                    setStep('profile');
                  } else {
                    // Redirect to login for new users
                    window.location.href = "/api/login";
                  }
                }}
              />
            )}

            {step === 'welcome' && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Get Started with Smart Payments</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Split any payment across multiple funding sources. No single card gets maxed out.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Multiple<br/>Cards</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Secure<br/>Processing</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Instant<br/>Setup</p>
                  </div>
                </div>
                <Button onClick={() => setStep('profile')} className="w-full">
                  Create My Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 'profile' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Complete Your Profile</h3>
                  <p className="text-sm text-gray-600">Required for secure virtual card generation</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={profile.phoneNumber || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={profile.address?.line1 || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      address: { ...prev.address!, line1: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={profile.address?.city || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        address: { ...prev.address!, city: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      maxLength={2}
                      value={profile.address?.state || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        address: { ...prev.address!, state: e.target.value.toUpperCase() }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    value={profile.address?.postal_code || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      address: { ...prev.address!, postal_code: e.target.value }
                    }))}
                  />
                </div>

                <Button 
                  onClick={handleProfileSubmit}
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Continue'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 'funding' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Add Your First Payment Method</h3>
                  <p className="text-sm text-gray-600">Start splitting payments across multiple sources</p>
                </div>

                <div>
                  <Label htmlFor="card-name">Card Nickname</Label>
                  <Input
                    id="card-name"
                    placeholder="My Main Card"
                    value={fundingSource.name}
                    onChange={(e) => setFundingSource(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="4242 4242 4242 4242"
                    value={fundingSource.cardNumber}
                    onChange={(e) => {
                      // Format card number with spaces
                      const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setFundingSource(prev => ({ ...prev, cardNumber: value }));
                    }}
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry-month">Expiry Month</Label>
                    <Input
                      id="expiry-month"
                      type="number"
                      min="1"
                      max="12"
                      placeholder="12"
                      value={fundingSource.expiryMonth || ''}
                      onChange={(e) => setFundingSource(prev => ({ 
                        ...prev, 
                        expiryMonth: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry-year">Expiry Year</Label>
                    <Input
                      id="expiry-year"
                      type="number"
                      min={new Date().getFullYear()}
                      placeholder="2026"
                      value={fundingSource.expiryYear || ''}
                      onChange={(e) => setFundingSource(prev => ({ 
                        ...prev, 
                        expiryYear: parseInt(e.target.value) || new Date().getFullYear() + 1 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    value={fundingSource.cvv}
                    onChange={(e) => setFundingSource(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handleFundingSubmit}
                  className="w-full"
                  disabled={addFundingMutation.isPending}
                >
                  {addFundingMutation.isPending ? 'Adding...' : 'Add Payment Method'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Account Setup Complete!</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    You're all set to start using bpay for smart payment splitting.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">What's Next?</h4>
                  <ul className="text-xs text-blue-700 space-y-1 text-left">
                    <li>• Create virtual cards for specific merchants</li>
                    <li>• Set up automatic payment splitting rules</li>
                    <li>• Track all your transactions in one place</li>
                    <li>• Add more funding sources anytime</li>
                  </ul>
                </div>
                <Button onClick={handleComplete} className="w-full">
                  Start Using bpay
                  <Zap className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {integrationMode === 'banner' && step !== 'complete' && (
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full text-gray-500"
              >
                Maybe Later
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}