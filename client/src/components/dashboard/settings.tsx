import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  defaultValue={user?.firstName || ""} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  defaultValue={user?.lastName || ""} 
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                defaultValue={user?.email || ""} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country"
                defaultValue={user?.country || ""} 
                className="mt-1"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]"
            >
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <Button className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Login Notifications</h4>
                <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
