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
  
  const [step, setStep] = useState<'guide' | 'auth' | 'profile' | 'funding' | 'complete'>('guide');
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
      case 'auth': return 40;
      case 'profile': return 60;
      case 'funding': return 80;
      case 'complete': return 100;
      default: return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <Card className="bg-white shadow-xl relative m-2 sm:m-0">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                ✕
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 pr-12">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Welcome to bpay</h2>
              {integrationMode === 'banner' && (
                <Badge variant="secondary" className="text-xs">Extension</Badge>
              )}
            </div>
            {step !== 'guide' && step !== 'auth' && (
              <>
                <Progress value={getStepProgress()} className="w-full" />
                <p className="text-sm text-gray-600">
                  Complete your account setup
                </p>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {step === 'guide' && (
              <FirstTimeUserGuide 
                integrationMode={integrationMode}
                onGetStarted={() => {
                  if (user) {
                    setStep('profile');
                  } else {
                    setStep('auth');
                  }
                }}
              />
            )}

            {step === 'auth' && (
              <div className="space-y-4 sm:space-y-6 text-center">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Join bpay</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Choose how you'd like to get started with your bpay account
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] text-white h-10 sm:h-11"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">or</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    variant="outline"
                    className="w-full border-[hsl(249,83%,65%)] text-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,65%)] hover:text-white h-10 sm:h-11"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>By continuing, you agree to our Terms of Service</p>
                  <p>and Privacy Policy</p>
                </div>
              </div>
            )}



            {step === 'profile' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Complete Your Profile</h3>
                  <p className="text-sm text-gray-600">Required for secure bcard generation</p>
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