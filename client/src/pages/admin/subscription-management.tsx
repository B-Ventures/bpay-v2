import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  Users, 
  Settings, 
  Crown,
  Star,
  Shield,
  Plus,
  Edit,
  Save,
  X,
  RefreshCw,
  Activity,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface SubscriptionTier {
  id: number;
  name: string;
  displayName: string;
  monthlyPrice: number;
  transactionFeeRate: number;
  features: string[];
  limits: {
    fundingSources?: number;
    monthlyTransactions?: number;
    apiCallsPerMonth?: number;
    bcardGenerationLimit?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscription {
  id: number;
  userId: string;
  tierId: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId?: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  tier: {
    name: string;
    displayName: string;
    monthlyPrice: number;
  };
}

/**
 * Subscription Management Component
 * 
 * Complete subscription tier configuration and user subscription management system.
 * Provides comprehensive controls for pricing, features, and revenue analytics.
 * 
 * Features:
 * - Create/edit subscription tiers with custom pricing and features
 * - Configure usage limits (funding sources, transactions, API calls, bcard generation)
 * - Manage user subscriptions and plan changes
 * - Revenue analytics and subscription insights
 * - Real-time status monitoring and validation
 */
export default function SubscriptionManagement() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tiers");
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch subscription tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ["/api/admin/subscription-tiers"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch("/api/admin/subscription-tiers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tiers');
      return response.json();
    }
  });

  // Fetch user subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["/api/admin/user-subscriptions"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch("/api/admin/user-subscriptions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    }
  });

  // Fetch subscription analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/admin/subscription-analytics"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch("/api/admin/subscription-analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Save subscription tier mutation
  const saveTierMutation = useMutation({
    mutationFn: async (tier: Partial<SubscriptionTier>) => {
      const method = tier.id ? 'PATCH' : 'POST';
      const url = tier.id 
        ? `/api/admin/subscription-tiers/${tier.id}`
        : '/api/admin/subscription-tiers';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tier)
      });
      
      if (!response.ok) throw new Error('Failed to save tier');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
      setEditingTier(null);
      setIsDialogOpen(false);
    }
  });

  // Toggle tier active status
  const toggleTierMutation = useMutation({
    mutationFn: async (tierId: number) => {
      const response = await fetch(`/api/admin/subscription-tiers/${tierId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to toggle tier');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
    }
  });

  // Change user subscription
  const changeSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, tierId }: { userId: string, tierId: number }) => {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tierId })
      });
      
      if (!response.ok) throw new Error('Failed to change subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-subscriptions"] });
    }
  });

  const TierForm = ({ tier, onSave, onCancel }: { 
    tier: SubscriptionTier | null, 
    onSave: (tier: Partial<SubscriptionTier>) => void,
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState<Partial<SubscriptionTier>>({
      name: tier?.name || '',
      displayName: tier?.displayName || '',
      monthlyPrice: tier?.monthlyPrice || 0,
      transactionFeeRate: tier?.transactionFeeRate || 0.029,
      features: tier?.features || [],
      limits: tier?.limits || {
        fundingSources: 5,
        monthlyTransactions: 100,
        apiCallsPerMonth: 1000,
        bcardGenerationLimit: 10
      },
      isActive: tier?.isActive ?? true
    });

    const handleFeatureToggle = (feature: string, enabled: boolean) => {
      const newFeatures = enabled 
        ? [...(formData.features || []), feature]
        : (formData.features || []).filter(f => f !== feature);
      setFormData({ ...formData, features: newFeatures });
    };

    const availableFeatures = [
      'unlimited_funding_sources',
      'priority_support',
      'advanced_analytics',
      'api_access',
      'custom_branding',
      'white_label',
      'dedicated_account_manager'
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Internal Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="free, pro, premium"
            />
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Free, Pro, Premium"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
            <Input
              id="monthlyPrice"
              type="number"
              step="0.01"
              value={formData.monthlyPrice}
              onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="transactionFeeRate">Transaction Fee Rate (%)</Label>
            <Input
              id="transactionFeeRate"
              type="number"
              step="0.001"
              value={(formData.transactionFeeRate || 0) * 100}
              onChange={(e) => setFormData({ 
                ...formData, 
                transactionFeeRate: parseFloat(e.target.value) / 100 
              })}
              placeholder="2.9"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Usage Limits</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fundingSources">Max Funding Sources</Label>
              <Input
                id="fundingSources"
                type="number"
                value={formData.limits?.fundingSources || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  limits: { ...formData.limits, fundingSources: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="monthlyTransactions">Monthly Transactions</Label>
              <Input
                id="monthlyTransactions"
                type="number"
                value={formData.limits?.monthlyTransactions || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  limits: { ...formData.limits, monthlyTransactions: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="apiCallsPerMonth">API Calls/Month</Label>
              <Input
                id="apiCallsPerMonth"
                type="number"
                value={formData.limits?.apiCallsPerMonth || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  limits: { ...formData.limits, apiCallsPerMonth: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="bcardGenerationLimit">bcard Generation/Month</Label>
              <Input
                id="bcardGenerationLimit"
                type="number"
                value={formData.limits?.bcardGenerationLimit || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  limits: { ...formData.limits, bcardGenerationLimit: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Features</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableFeatures.map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Switch
                  checked={(formData.features || []).includes(feature)}
                  onCheckedChange={(checked) => handleFeatureToggle(feature, checked)}
                />
                <Label className="text-sm">{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Active Tier</Label>
        </div>

        <div className="flex space-x-2">
          <Button onClick={() => onSave(formData)} disabled={saveTierMutation.isPending}>
            {saveTierMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Tier
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free': return <Users className="h-5 w-5" />;
      case 'pro': return <Star className="h-5 w-5" />;
      case 'premium': return <Crown className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  if (tiersLoading || subscriptionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">Configure pricing tiers, manage user subscriptions, and track revenue</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData?.totalSubscriptionRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              From active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptionsData?.subscriptions?.filter((s: UserSubscription) => s.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently paying users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Tiers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tiersData?.tiers?.filter((t: SubscriptionTier) => t.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active pricing plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fee Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tiersData?.tiers ? 
                ((tiersData.tiers.reduce((sum: number, tier: SubscriptionTier) => sum + tier.transactionFeeRate, 0) / tiersData.tiers.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average transaction fee
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tiers">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        {/* Subscription Tiers Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pricing Tiers</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTier(null);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTier ? 'Edit' : 'Create'} Subscription Tier
                  </DialogTitle>
                  <DialogDescription>
                    Configure pricing, features, and limits for this subscription tier
                  </DialogDescription>
                </DialogHeader>
                <TierForm
                  tier={editingTier}
                  onSave={(tier) => saveTierMutation.mutate(tier)}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {tiersData?.tiers?.map((tier: SubscriptionTier) => (
              <Card key={tier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getTierIcon(tier.name)}
                        <span>{tier.displayName}</span>
                        <Badge variant={tier.isActive ? "default" : "secondary"}>
                          {tier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        ${tier.monthlyPrice}/month • {(tier.transactionFeeRate * 100).toFixed(2)}% transaction fee
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTier(tier);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant={tier.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleTierMutation.mutate(tier.id)}
                        disabled={toggleTierMutation.isPending}
                      >
                        {tier.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {tier.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Features</Label>
                      <div className="mt-1">
                        {tier.features?.length ? (
                          <div className="space-y-1">
                            {tier.features.slice(0, 3).map(feature => (
                              <div key={feature} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            ))}
                            {tier.features.length > 3 && (
                              <div className="text-xs text-gray-500">+{tier.features.length - 3} more</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No features</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Funding Sources</Label>
                      <div className="mt-1 font-medium">
                        {tier.limits?.fundingSources || 'Unlimited'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Monthly Transactions</Label>
                      <div className="mt-1 font-medium">
                        {tier.limits?.monthlyTransactions || 'Unlimited'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">bcard Generation</Label>
                      <div className="mt-1 font-medium">
                        {tier.limits?.bcardGenerationLimit || 'Unlimited'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!tiersData?.tiers || tiersData.tiers.length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Tiers</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first pricing tier to start monetizing your platform
                  </p>
                  <Button onClick={() => {
                    setEditingTier(null);
                    setIsDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tier
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* User Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <h2 className="text-lg font-semibold">User Subscriptions</h2>
          
          <div className="space-y-4">
            {subscriptionsData?.subscriptions?.map((subscription: UserSubscription) => (
              <Card key={subscription.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {subscription.user.firstName} {subscription.user.lastName}
                        </span>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{subscription.user.email}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>
                          <strong>Plan:</strong> {subscription.tier.displayName} (${subscription.tier.monthlyPrice}/month)
                        </span>
                        <span>
                          <strong>Period:</strong> {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Select
                        value={subscription.tierId.toString()}
                        onValueChange={(value) => changeSubscriptionMutation.mutate({
                          userId: subscription.userId,
                          tierId: parseInt(value)
                        })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tiersData?.tiers?.filter((t: SubscriptionTier) => t.isActive).map((tier: SubscriptionTier) => (
                            <SelectItem key={tier.id} value={tier.id.toString()}>
                              {tier.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!subscriptionsData?.subscriptions || subscriptionsData.subscriptions.length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscriptions</h3>
                  <p className="text-gray-600">
                    User subscriptions will appear here once they start subscribing to your plans
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-lg font-semibold">Revenue Analytics</h2>
          
          <div className="grid gap-6">
            {analyticsData?.subscriptionsByTier?.map((tierData: any) => (
              <Card key={tierData.tierName}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getTierIcon(tierData.tierName)}
                    <span>{tierData.tierName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Active Subscribers</Label>
                      <div className="text-xl font-bold">{tierData.count}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Monthly Revenue</Label>
                      <div className="text-xl font-bold">${tierData.monthlyRevenue}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Average Revenue per User</Label>
                      <div className="text-xl font-bold">
                        ${tierData.count > 0 ? (tierData.monthlyRevenue / tierData.count).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}