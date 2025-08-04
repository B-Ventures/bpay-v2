import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Users, Star, Crown } from "lucide-react";

interface SubscriptionTier {
  id: number;
  name: string;
  displayName: string;
  monthlyPrice: string | number;
  transactionFeeRate: string | number;
  features: string[];
  limits: {
    fundingSources?: number;
    monthlyTransactions?: number;
    apiCallsPerMonth?: number;
    bcardGenerationLimit?: number;
  };
}

interface DynamicPricingProps {
  locale?: 'en' | 'ar';
}

export default function DynamicPricing({ locale = 'en' }: DynamicPricingProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/subscription/tiers"],
    queryFn: async () => {
      const response = await fetch("/api/subscription/tiers");
      if (!response.ok) throw new Error('Failed to fetch pricing');
      return response.json();
    }
  });

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free': return <Users className="h-6 w-6" />;
      case 'pro': return <Star className="h-6 w-6" />;
      case 'premium': return <Crown className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free': return 'from-gray-600 to-gray-800';
      case 'pro': return 'from-blue-600 to-purple-600';
      case 'premium': return 'from-purple-600 to-pink-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getFeatureDisplayName = (feature: string) => {
    const featureMap: { [key: string]: string } = {
      'basic_funding_sources': 'Basic Funding Sources',
      'unlimited_funding_sources': 'Unlimited Funding Sources',
      'priority_support': 'Priority Support',
      'api_access': 'API Access',
      'advanced_analytics': 'Advanced Analytics',
      'custom_branding': 'Custom Branding',
      'white_label': 'White Label Solution',
      'dedicated_account_manager': 'Dedicated Account Manager'
    };
    return featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatLimitValue = (value: number | undefined, type: string): string => {
    if (!value || value === -1) return 'Unlimited';
    if (type === 'fundingSources') return `${value} sources`;
    if (type === 'monthlyTransactions') return `${value}/month`;
    if (type === 'apiCallsPerMonth') return `${value.toLocaleString()}/month`;
    if (type === 'bcardGenerationLimit') return `${value}/month`;
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-8 animate-pulse">
            <CardContent className="p-0">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-12 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data?.tiers) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load pricing information</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Ensure data is properly parsed
  const tiers = data.tiers.map((tier: any) => ({
    ...tier,
    monthlyPrice: Number(tier.monthlyPrice),
    transactionFeeRate: Number(tier.transactionFeeRate)
  }));



  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {tiers.map((tier: SubscriptionTier, index: number) => (
        <Card 
          key={tier.id} 
          className={`p-8 relative hover:shadow-xl transition-all duration-300 ${
            index === 1 ? 'border-2 border-[hsl(249,83%,65%)] transform scale-105' : ''
          }`}
        >
          {index === 1 && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-[hsl(249,83%,65%)] text-white px-4 py-1">
                {locale === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
              </Badge>
            </div>
          )}
          
          <CardContent className="p-0">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 bg-gradient-to-r ${getTierColor(tier.name)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className="text-white">
                  {getTierIcon(tier.name)}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.displayName}</h3>
              <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-2">
                {tier.monthlyPrice === 0 ? (
                  locale === 'ar' ? 'مجاني' : 'Free'
                ) : (
                  `$${tier.monthlyPrice.toFixed(2)}`
                )}
              </div>
              {tier.monthlyPrice > 0 && (
                <p className="text-gray-600">
                  {locale === 'ar' ? 'شهرياً' : 'per month'}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(tier.transactionFeeRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {locale === 'ar' ? 'لكل معاملة' : 'per transaction'}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="font-semibold text-gray-900">
                {locale === 'ar' ? 'الميزات المتضمنة:' : 'Features included:'}
              </h4>
              
              {/* Display limits */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {formatLimitValue(tier.limits.fundingSources, 'fundingSources')} funding sources
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {formatLimitValue(tier.limits.monthlyTransactions, 'monthlyTransactions')} transactions
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {formatLimitValue(tier.limits.bcardGenerationLimit, 'bcardGenerationLimit')} bcard generation
                  </span>
                </div>
              </div>

              {/* Display features */}
              {tier.features?.map((feature) => (
                <div key={feature} className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{getFeatureDisplayName(feature)}</span>
                </div>
              ))}
            </div>

            <Button 
              className={`w-full ${
                index === 1 
                  ? 'bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] text-white' 
                  : 'border border-[hsl(249,83%,65%)] text-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,65%)] hover:text-white'
              }`}
              variant={index === 1 ? "default" : "outline"}
              onClick={() => window.location.href = "/api/login"}
            >
              {tier.monthlyPrice === 0 
                ? (locale === 'ar' ? 'ابدأ مجاناً' : 'Start Free') 
                : (locale === 'ar' ? 'اختر هذه الخطة' : 'Choose Plan')
              }
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}