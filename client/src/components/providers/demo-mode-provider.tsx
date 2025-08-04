import { ReactNode, createContext, useContext } from "react";
import { useDemoModeState } from "@/hooks/useDemoMode";

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
};

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const { isDemoMode, toggleDemoMode } = useDemoModeState();

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};