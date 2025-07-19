import { useState, useEffect, createContext, useContext, ReactNode } from "react";

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

// Hook for demo mode state management
export const useDemoModeState = () => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('bpay-demo-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bpay-demo-mode', JSON.stringify(newValue));
      }
      return newValue;
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bpay-demo-mode', JSON.stringify(isDemoMode));
    }
  }, [isDemoMode]);

  return { isDemoMode, toggleDemoMode };
};