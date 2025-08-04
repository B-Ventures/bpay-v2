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
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  LogOut, 
  Edit3, 
  Save,
  X,
  Shield,
  Calendar
} from "lucide-react";

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
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

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-3 text-gray-600">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle>Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Please log in to view your profile.</p>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="flex-1"
              >
                Log In
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Profile Settings</CardTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
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
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              {(user as any)?.profileImageUrl ? (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {(user as any)?.firstName && (user as any)?.lastName 
                  ? `${(user as any).firstName} ${(user as any).lastName}`
                  : (user as any)?.email?.split('@')[0] || 'User'
                }
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-600">{(user as any)?.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Phone Number</Label>
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
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Address Information</h4>
            
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Street Address</Label>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-600">City</Label>
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
                    <Label className="text-sm text-gray-600">State</Label>
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
                </div>
                <div>
                  <Label className="text-sm text-gray-600">ZIP Code</Label>
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
            ) : (
              <div className="space-y-2">
                {(user as any).address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="text-sm text-gray-900">
                      <div>{(user as any).address.line1}</div>
                      <div>
                        {(user as any).address.city}, {(user as any).address.state} {(user as any).address.postal_code}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No address provided</div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}