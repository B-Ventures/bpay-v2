import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/components/providers/demo-mode-provider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import MerchantPortal from "@/pages/merchant-portal";
import AdminPanel from "@/pages/admin-panel";
import PaymentDemo from "@/pages/payment-demo";
import CheckoutDemo from "@/pages/checkout-demo";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/payment-demo" component={PaymentDemo} />
      <Route path="/checkout-demo" component={CheckoutDemo} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/merchant-portal" component={MerchantPortal} />
          <Route path="/admin-panel" component={AdminPanel} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoModeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </DemoModeProvider>
    </QueryClientProvider>
  );
}

export default App;
