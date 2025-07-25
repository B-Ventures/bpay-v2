import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Shield, 
  Star,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  CheckCircle
} from "lucide-react";

interface FirstTimeUserGuideProps {
  integrationMode: 'addon' | 'banner';
  onGetStarted: () => void;
}

export default function FirstTimeUserGuide({ integrationMode, onGetStarted }: FirstTimeUserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to bpay",
      content: "Split any payment across multiple funding sources. Never max out a single card again.",
      icon: <Star className="h-8 w-8 text-yellow-500" />
    },
    {
      title: "How It Works",
      content: "Add your cards, set percentages, and bpay automatically creates secure bcards for each purchase.",
      icon: <CreditCard className="h-8 w-8 text-blue-500" />
    },
    {
      title: "Built for Security",
      content: "Your real card numbers stay private. Merchants only see secure bcard details.",
      icon: <Shield className="h-8 w-8 text-green-500" />
    }
  ];

  const benefits = [
    "Never exceed single card limits",
    "Maximize rewards across multiple cards", 
    "Keep your real card numbers private",
    "Track spending across all sources",
    "Instant bcard generation"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">First Time Using bpay?</h2>
          {integrationMode === 'banner' && (
            <Badge variant="outline" className="text-xs">Extension</Badge>
          )}
        </div>
        <p className="text-gray-600">
          Let's set up your account for this new smart payment approach
        </p>
      </div>

      {/* Step-by-step Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quick Setup Guide</CardTitle>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              {steps[currentStep].icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
              <p className="text-gray-600 mt-2">{steps[currentStep].content}</p>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={onGetStarted}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Get Started
                <Zap className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Why Users Love bpay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      <div className="text-center bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">10,000+ users</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">4.8/5 rating</span>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Join thousands of users who split payments smartly with bpay
        </p>
      </div>

      {/* Integration Mode Info */}
      {integrationMode === 'banner' && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Extension Mode</h4>
          <p className="text-xs text-blue-700">
            bpay operates as a browser extension overlay, working independently above merchant sites 
            without affecting their checkout process. Your data is saved across all participating merchants.
          </p>
        </div>
      )}
    </div>
  );
}