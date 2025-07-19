import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1 border text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Switch
              id="demo-mode"
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
              className="scale-75"
            />
            <Label htmlFor="demo-mode" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
              Demo
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {isDemoMode 
              ? "Using demo funding sources and data" 
              : "Using your real funding sources and data"
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}