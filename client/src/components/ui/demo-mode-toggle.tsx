import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { Badge } from "@/components/ui/badge";

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
      <div className="flex items-center space-x-2">
        <Switch
          id="demo-mode"
          checked={isDemoMode}
          onCheckedChange={toggleDemoMode}
        />
        <Label htmlFor="demo-mode" className="text-sm font-medium">
          Demo Mode
        </Label>
      </div>
      {isDemoMode && (
        <Badge variant="secondary" className="text-xs">
          Using mock data
        </Badge>
      )}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {isDemoMode 
          ? "Experience the platform with sample data" 
          : "Use your real funding sources and data"
        }
      </div>
    </div>
  );
}