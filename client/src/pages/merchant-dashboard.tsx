import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, DollarSign, TrendingUp, Users, Activity, Eye, EyeOff, Plus, Settings, Webhook, Code, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Merchant {
  id: number;
  businessName: string;
  businessEmail: string;
  website: string;
  publicApiKey: string;
  secretApiKey: string;
  webhookSecret: string;
  environment: string;
  platformType: string;
  totalVolume: number;
  isActive: boolean;
  createdAt: string;
}

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
}

interface ApiUsage {
  totalRequests: number;
  date: string;
  endpoints: Record<string, number>;
}

export default function MerchantDashboard() {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const queryClient = useQueryClient();

  // Fetch merchant data
  const { data: merchants, isLoading: merchantsLoading } = useQuery({
    queryKey: ['/api/merchants'],
  });

  // Fetch payment intents for selected merchant
  const { data: paymentIntents } = useQuery({
    queryKey: ['/api/v1/payment_intents'],
    enabled: !!selectedMerchant,
  });

  // Fetch API usage statistics
  const { data: apiUsage } = useQuery({
    queryKey: ['/api/v1/merchant/usage'],
    enabled: !!selectedMerchant,
  });

  useEffect(() => {
    if (merchants && merchants.length > 0 && !selectedMerchant) {
      setSelectedMerchant(merchants[0]);
    }
  }, [merchants, selectedMerchant]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      succeeded: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      requires_payment_method: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (merchantsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!merchants || merchants.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Merchant Account Found</h2>
          <p className="text-gray-600 mb-6">Create a merchant account to start accepting bpay payments.</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Merchant Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
          <p className="text-gray-600">Manage your bpay integration and monitor payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={selectedMerchant?.environment === 'production' ? 'default' : 'secondary'}>
            {selectedMerchant?.environment === 'production' ? 'Live' : 'Test'} Mode
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Merchant Selector */}
      {merchants.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="merchant-select">Select Merchant Account:</Label>
              <Select
                value={selectedMerchant?.id.toString()}
                onValueChange={(value) => {
                  const merchant = merchants.find((m: Merchant) => m.id.toString() === value);
                  setSelectedMerchant(merchant);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((merchant: Merchant) => (
                    <SelectItem key={merchant.id} value={merchant.id.toString()}>
                      {merchant.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMerchant && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(selectedMerchant.totalVolume)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiUsage?.totalRequests || 0}</div>
                <p className="text-xs text-muted-foreground">Today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Intents</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentIntents?.data?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Recent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={selectedMerchant.isActive ? 'default' : 'destructive'}>
                  {selectedMerchant.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Since {new Date(selectedMerchant.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payment Intents</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Merchant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Business Name</Label>
                      <p className="text-gray-900">{selectedMerchant.businessName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-gray-900">{selectedMerchant.businessEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Website</Label>
                      <p className="text-gray-900">{selectedMerchant.website}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Platform</Label>
                      <p className="text-gray-900 capitalize">{selectedMerchant.platformType || 'Custom'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payment Intents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentIntents?.data?.length > 0 ? (
                      <div className="space-y-3">
                        {paymentIntents.data.slice(0, 5).map((intent: PaymentIntent) => (
                          <div key={intent.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{formatCurrency(intent.amount)}</p>
                              <p className="text-sm text-gray-600">{intent.id}</p>
                            </div>
                            {getStatusBadge(intent.status)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No payment intents yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payment Intents Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Intents</CardTitle>
                  <CardDescription>
                    All payment intents created through your merchant account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentIntents?.data?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment Intent ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Metadata</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentIntents.data.map((intent: PaymentIntent) => (
                          <TableRow key={intent.id}>
                            <TableCell className="font-mono text-sm">{intent.id}</TableCell>
                            <TableCell>{formatCurrency(intent.amount)}</TableCell>
                            <TableCell>{getStatusBadge(intent.status)}</TableCell>
                            <TableCell>{new Date(intent.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {Object.keys(intent.metadata || {}).length > 0 ? (
                                <Badge variant="outline">
                                  {Object.keys(intent.metadata).length} keys
                                </Badge>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No payment intents found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Payment intents will appear here once customers start using your integration
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys">
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Keep your API keys secure. Never share your secret key or commit it to version control.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Use these keys to authenticate API requests to bpay
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Public Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={selectedMerchant.publicApiKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedMerchant.publicApiKey, 'Public key')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Safe to use in client-side code
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Secret Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type={showSecretKey ? 'text' : 'password'}
                          value={selectedMerchant.secretApiKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedMerchant.secretApiKey, 'Secret key')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Keep this secret! Use only in server-side code
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Webhook Secret</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type={showWebhookSecret ? 'text' : 'password'}
                          value={selectedMerchant.webhookSecret}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                        >
                          {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedMerchant.webhookSecret, 'Webhook secret')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Use to verify webhook signatures
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                  <CardDescription>
                    Configure webhook endpoints to receive real-time payment notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://yoursite.com/webhooks/bpay"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-events">Events</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select events" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All events</SelectItem>
                          <SelectItem value="payment_intent.succeeded">Payment succeeded</SelectItem>
                          <SelectItem value="payment_intent.failed">Payment failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button>
                    <Webhook className="w-4 h-4 mr-2" />
                    Add Webhook Endpoint
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integration Tab */}
            <TabsContent value="integration">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Start Integration</CardTitle>
                    <CardDescription>
                      Get started with bpay integration using platform-specific guides
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                        <Code className="w-8 h-8" />
                        <span className="font-medium">Custom Integration</span>
                        <span className="text-xs text-gray-500">API documentation</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                        <ExternalLink className="w-8 h-8" />
                        <span className="font-medium">WordPress/WooCommerce</span>
                        <span className="text-xs text-gray-500">Plugin integration</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                        <ExternalLink className="w-8 h-8" />
                        <span className="font-medium">Shopify</span>
                        <span className="text-xs text-gray-500">App integration</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="border rounded p-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">POST</span>
                          <span>/api/v1/payment_intents</span>
                        </div>
                        <p className="text-gray-600 text-xs mt-1">Create a new payment intent</p>
                      </div>
                      <div className="border rounded p-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600 font-medium">POST</span>
                          <span>/api/v1/payment_intents/{'{id}'}/confirm</span>
                        </div>
                        <p className="text-gray-600 text-xs mt-1">Confirm payment with bcard</p>
                      </div>
                      <div className="border rounded p-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-600 font-medium">GET</span>
                          <span>/api/v1/payment_intents/{'{id}'}</span>
                        </div>
                        <p className="text-gray-600 text-xs mt-1">Retrieve payment intent details</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}