import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/components/providers/demo-mode-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LandingAr from "@/pages/landing-ar";
import Home from "@/pages/home";

import MerchantPortal from "@/pages/merchant-portal";
import MerchantDashboard from "@/pages/merchant-dashboard";
import AdminPanel from "@/pages/admin-panel-new";
import AdminLogin from "@/pages/admin-login";
import PaymentDemo from "@/pages/payment-demo";
import AddonCheckoutDemo from "@/pages/addon-checkout-demo";
import BannerCheckoutDemo from "@/pages/banner-checkout-demo";
import Investors from "@/pages/investors";
import InvestorsAr from "@/pages/investors-ar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/payment-demo" component={PaymentDemo} />
      <Route path="/addon-checkout-demo" component={AddonCheckoutDemo} />
      <Route path="/banner-checkout-demo" component={BannerCheckoutDemo} />
      <Route path="/investors" component={Investors} />
      <Route path="/investors-ar" component={InvestorsAr} />
      <Route path="/ar" component={LandingAr} />
      <Route path="/admin-login" component={AdminLogin} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/merchant-portal" component={MerchantPortal} />
          <Route path="/merchant-dashboard" component={MerchantDashboard} />
        </>
      )}
      
      {/* Admin panel is always accessible but handles its own authentication */}
      <Route path="/admin-panel" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <DemoModeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DemoModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
