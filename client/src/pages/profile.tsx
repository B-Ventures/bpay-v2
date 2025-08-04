import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  LogOut, 
  Edit3, 
  Save,
  X,
  Shield,
  CreditCard
} from "lucide-react";

interface ProfileData {
  phoneNumber?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData>({
    phoneNumber: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  // Initialize edit data when user loads
  useEffect(() => {
    if (user) {
      setEditData({
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
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileData) => {
      const response = await apiRequest("PATCH", "/api/auth/user", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editData.phoneNumber || !editData.address?.line1 || !editData.address?.city) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(editData);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Please log in to view your profile.</p>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="text-blue-600"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset edit data
                      setEditData({
                        phoneNumber: (user as any).phoneNumber || '',
                        address: (user as any).address || {
                          line1: '',
                          city: '',
                          state: '',
                          postal_code: '',
                          country: 'US'
                        }
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                {(user as any)?.profileImageUrl ? (
                  <img 
                    src={(user as any).profileImageUrl} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {(user as any)?.firstName && (user as any)?.lastName 
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any)?.email?.split('@')[0] || 'User'
                  }
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{(user as any)?.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Account
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Member since {new Date((user as any)?.createdAt || Date.now()).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{(user as any)?.email || 'Not provided'}</span>
                </div>
              </div>
              <div>
                <Label>Phone Number</Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={editData.phoneNumber || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {(user as any).phoneNumber || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    placeholder="123 Main Street"
                    value={editData.address?.line1 || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      address: { ...prev.address!, line1: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      placeholder="New York"
                      value={editData.address?.city || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        address: { ...prev.address!, city: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      placeholder="NY"
                      maxLength={2}
                      value={editData.address?.state || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        address: { ...prev.address!, state: e.target.value.toUpperCase() }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      placeholder="10001"
                      value={editData.address?.postal_code || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        address: { ...prev.address!, postal_code: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {(user as any).address ? (
                  <>
                    <div className="text-gray-900">{(user as any).address.line1}</div>
                    <div className="text-gray-900">
                      {(user as any).address.city}, {(user as any).address.state} {(user as any).address.postal_code}
                    </div>
                    <div className="text-gray-600">{(user as any).address.country}</div>
                  </>
                ) : (
                  <div className="text-gray-500">No address provided</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Status</h4>
                  <p className="text-sm text-gray-600">Your account is verified and secure</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-gray-600">Managed through Replit authentication</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Managed Externally
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Connected Payment Methods</h4>
                  <p className="text-sm text-gray-600">Manage your funding sources for bpay</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}