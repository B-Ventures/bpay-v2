import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  FileText,
  Camera,
  MapPin,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface KYCVerification {
  id: number;
  userId: string;
  verificationType: string;
  status: string;
  documentType: string;
  documentCountry: string;
  riskLevel: string;
  riskScore: number;
  errorCode?: string;
  errorMessage?: string;
  reviewedBy?: string;
  submittedAt: string;
  verifiedAt?: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface KYCDashboardData {
  overview: {
    totalVerifications: number;
    verifiedUsers: number;
    pendingVerifications: number;
    failedVerifications: number;
    successRate: number;
    highRiskUsers: number;
    manualReviewQueue: number;
    recentActivity: number;
  };
  verificationTypes: {
    identityDocument: number;
    selfie: number;
    address: number;
  };
  documentTypes: {
    passport: number;
    drivingLicense: number;
    idCard: number;
  };
}

export default function AdminKYC() {
  const { token } = useAdminAuth();
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    verificationType: "all",
    riskLevel: "all",
    search: ""
  });
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch KYC dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/admin/kyc/dashboard"],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch("/api/admin/kyc/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    }
  });

  // Fetch KYC verifications with filters
  const { data: verificationsData, isLoading: isVerificationsLoading } = useQuery({
    queryKey: ["/api/admin/kyc/verifications", page, filters],
    enabled: !!token,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.verificationType !== "all" && { verificationType: filters.verificationType }),
        ...(filters.riskLevel !== "all" && { riskLevel: filters.riskLevel }),
        ...(filters.search && { search: filters.search })
      });
      
      const response = await fetch(`/api/admin/kyc/verifications?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch verifications');
      return response.json();
    }
  });

  // Update verification mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ verificationId, status, adminNotes, riskLevel }: any) => {
      const response = await fetch(`/api/admin/kyc/verifications/${verificationId}`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, adminNotes, riskLevel })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/verifications"] });
      setIsDetailsOpen(false);
    }
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ verificationIds, action, adminNotes }: any) => {
      const response = await fetch("/api/admin/kyc/verifications/bulk-action", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ verificationIds, action, adminNotes })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/verifications"] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing": return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      verified: "default",
      failed: "destructive", 
      pending: "secondary",
      processing: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "default",
      medium: "secondary",
      high: "destructive"
    };
    return <Badge variant={variants[riskLevel] || "outline"}>{riskLevel} risk</Badge>;
  };

  const getVerificationTypeIcon = (type: string) => {
    switch (type) {
      case "identity_document": return <FileText className="h-4 w-4" />;
      case "selfie": return <Camera className="h-4 w-4" />;
      case "address": return <MapPin className="h-4 w-4" />;
      case "business_verification": return <Building2 className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  if (!token) {
    return <div>Unauthorized access</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor identity verification compliance for Stripe Issuing requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Dashboard Overview */}
      {isDashboardLoading ? (
        <div>Loading dashboard...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.overview?.totalVerifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Success rate: {dashboardData?.overview?.successRate || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.overview?.pendingVerifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Manual queue: {dashboardData?.overview?.manualReviewQueue || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboardData?.overview?.highRiskUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Require manual review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.overview?.recentActivity || 0}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification Types Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Identity Documents</span>
              </div>
              <Badge variant="outline">{dashboardData?.verificationTypes?.identityDocument || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>Selfie Verification</span>
              </div>
              <Badge variant="outline">{dashboardData?.verificationTypes?.selfie || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Address Verification</span>
              </div>
              <Badge variant="outline">{dashboardData?.verificationTypes?.address || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Passport</span>
              <Badge variant="outline">{dashboardData?.documentTypes?.passport || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Driving License</span>
              <Badge variant="outline">{dashboardData?.documentTypes?.drivingLicense || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>ID Card</span>
              <Badge variant="outline">{dashboardData?.documentTypes?.idCard || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Verified</span>
              </div>
              <Badge variant="default">{dashboardData?.overview?.verifiedUsers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Failed</span>
              </div>
              <Badge variant="destructive">{dashboardData?.overview?.failedVerifications || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="verificationType">Type</Label>
              <Select value={filters.verificationType} onValueChange={(value) => setFilters(prev => ({ ...prev, verificationType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="identity_document">Identity Document</SelectItem>
                  <SelectItem value="selfie">Selfie</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="business_verification">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="riskLevel">Risk Level</Label>
              <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KYC Verifications</CardTitle>
          <CardDescription>
            Review and manage identity verification requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerificationsLoading ? (
            <div>Loading verifications...</div>
          ) : (
            <div className="space-y-4">
              {(verificationsData?.verifications || []).map((verification: KYCVerification) => (
                <div key={verification.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getVerificationTypeIcon(verification.verificationType)}
                      <div>
                        <p className="font-medium">
                          {verification.user.firstName} {verification.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {verification.user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(verification.status)}
                      {verification.riskLevel && getRiskBadge(verification.riskLevel)}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span> {verification.verificationType.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Document:</span> {verification.documentType} ({verification.documentCountry})
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span> {new Date(verification.submittedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {verification.errorMessage && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Error:</strong> {verification.errorMessage}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVerification(verification);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Verification Details</DialogTitle>
            <DialogDescription>
              Review and update verification status
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>User Information</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium">
                        {selectedVerification.user.firstName} {selectedVerification.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedVerification.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedVerification.status)}
                      {getStatusBadge(selectedVerification.status)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <p>{selectedVerification.documentType} from {selectedVerification.documentCountry}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Risk Assessment</Label>
                    <div className="flex items-center gap-2">
                      {selectedVerification.riskLevel && getRiskBadge(selectedVerification.riskLevel)}
                      {selectedVerification.riskScore && (
                        <span className="text-sm">Score: {selectedVerification.riskScore}/100</span>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Document viewing requires Stripe Identity integration
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified">Approve</SelectItem>
                        <SelectItem value="failed">Reject</SelectItem>
                        <SelectItem value="pending">Mark Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="adminNotes">Admin Notes</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Add review notes..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsDetailsOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button>
                      Update Verification
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}