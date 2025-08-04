import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLocation } from "wouter";
import AdminKYC from "./admin-kyc";
import VendorManagement from "./admin/vendor-management-simple";
import SubscriptionManagement from "./admin/subscription-management";
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Settings,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  Eye,
  Trash2,
  Edit
} from "lucide-react";

export default function AdminPanel() {
  const { isAuthenticated, isLoading, logout, username } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/admin-login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch admin data
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchUsers();
      fetchMerchants();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchMerchants = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/merchants", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.merchants || []);
      }
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/admin-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  bpay Admin Panel
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {username}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="merchants">Merchants</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardData?.revenue?.total?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform revenue to date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.users?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.merchants?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Merchant accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">bcard Success Rate</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.bcardGeneration?.successRate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Card generation success
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Core platform metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Funding Pool Balance</span>
                    <Badge variant="outline">
                      ${dashboardData?.fundingPool?.balance?.toFixed(2) || "0.00"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transaction Volume</span>
                    <Badge variant="outline">
                      ${dashboardData?.transactions?.volume?.toFixed(2) || "0.00"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Funding Success Rate</span>
                    <Badge variant={dashboardData?.fundingDeductions?.successRate > 95 ? "default" : "destructive"}>
                      {dashboardData?.fundingDeductions?.successRate?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">System operational</p>
                        <p className="text-xs text-muted-foreground">All services running</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {dashboardData?.bcardGeneration?.total || 0} bcards generated
                        </p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage registered users and their accounts</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Input placeholder="Search users..." className="w-64" />
                    <Button>Export</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Role</th>
                        <th className="text-left p-4">Country</th>
                        <th className="text-left p-4">Created</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4">{user.country || "N/A"}</td>
                          <td className="p-4">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Merchant Management</CardTitle>
                    <CardDescription>Manage merchant accounts and their business details</CardDescription>
                  </div>
                  <Button>Add Merchant</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Business</th>
                        <th className="text-left p-4">Contact</th>
                        <th className="text-left p-4">Volume</th>
                        <th className="text-left p-4">Environment</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {merchants.map((merchant) => (
                        <tr key={merchant.id} className="border-b">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{merchant.businessName}</div>
                              <div className="text-sm text-gray-500">{merchant.website}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="text-sm">{merchant.user?.firstName} {merchant.user?.lastName}</div>
                              <div className="text-sm text-gray-500">{merchant.businessEmail}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            ${merchant.totalVolume?.toFixed(2) || "0.00"}
                          </td>
                          <td className="p-4">
                            <Badge variant={merchant.environment === 'live' ? 'default' : 'secondary'}>
                              {merchant.environment}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={merchant.isActive ? 'default' : 'destructive'}>
                              {merchant.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder tabs */}
          <TabsContent value="subscriptions">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="kyc">
            <AdminKYC />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Detailed revenue and performance analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Advanced analytics dashboard coming soon
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}