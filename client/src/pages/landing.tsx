import { CreditCard, Plus, PieChart, ShoppingCart, Globe, Shield, Smartphone, Store, Check, TrendingUp, Users, Award, Star, ArrowRight, Zap, Target, DollarSign, Clock, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import DynamicPricing from "@/components/pricing/DynamicPricing";
import { useState } from "react";

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Zap className="text-[hsl(249,83%,65%)] h-8 w-8 mr-2" />
                <span className="text-2xl font-bold text-gray-900">bpay</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-6">
                <a href="#how-it-works" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">How It Works</a>
                <a href="/investors" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">For Investors</a>
                <a href="#features" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="/addon-checkout-demo" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">Merchant Demo</a>
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"} className="text-gray-600">
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = "/api/login"} className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] shadow-lg">
                  Start Free
                </Button>
                <LanguageSwitcher />
              </div>
            </div>
            <div className="md:hidden">
              <button 
                className="p-2 rounded-md text-gray-600 hover:text-[hsl(249,83%,65%)] hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                    <div className="w-full h-0.5 bg-current"></div>
                    <div className="w-full h-0.5 bg-current"></div>
                    <div className="w-full h-0.5 bg-current"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="#how-it-works" 
                className="text-gray-600 hover:text-[hsl(249,83%,65%)] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="/investors" 
                className="text-gray-600 hover:text-[hsl(249,83%,65%)] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                For Investors
              </a>
              <a 
                href="#features" 
                className="text-gray-600 hover:text-[hsl(249,83%,65%)] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="/addon-checkout-demo" 
                className="text-gray-600 hover:text-[hsl(249,83%,65%)] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Merchant Demo
              </a>
              <div className="pt-4 border-t border-gray-200 mt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    window.location.href = "/api/login";
                    setIsMobileMenuOpen(false);
                  }} 
                  className="w-full text-left justify-start text-gray-600 mb-2"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => {
                    window.location.href = "/api/login";
                    setIsMobileMenuOpen(false);
                  }} 
                  className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] shadow-lg mb-2"
                >
                  Start Free
                </Button>
                <div className="flex justify-center">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-16 pb-20 bg-gradient-to-br from-[hsl(249,83%,65%)] via-[hsl(258,70%,68%)] to-[hsl(186,94%,44%)] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-50">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-medium">
                <Users className="h-4 w-4 mr-2" />
                Join 12,000+ users already splitting smarter
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Split Any Payment<br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Across Multiple Cards
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-blue-50 leading-relaxed">
              The smart payment platform that combines all your funding sources into one powerful checkout experience. 
              No more choosing between cards — use them all at once.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/api/login"}
                className="bg-white text-[hsl(249,83%,65%)] hover:bg-gray-50 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/addon-checkout-demo"}
                className="border-2 border-white text-white hover:bg-white hover:text-[hsl(249,83%,65%)] backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all duration-300"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Merchant Demo
              </Button>
            </div>
            
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold">$2.5M+</div>
                <div className="text-blue-100 text-sm">Payments Processed</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-blue-100 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-blue-100 text-sm">Partner Merchants</div>
              </div>
              <div>
                <div className="text-3xl font-bold">4.9★</div>
                <div className="text-blue-100 text-sm">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-100 text-blue-700">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Payment Splitting Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three easy steps to start using multiple funding sources for any purchase
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="mb-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(258,70%,68%)] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Plus className="text-white h-10 w-10" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border-4 border-blue-500 text-blue-500 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">1</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Connect Your Cards</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Link your credit cards, debit cards, and bank accounts securely to your bpay account
              </p>
            </div>
            
            <div className="text-center group">
              <div className="mb-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-[hsl(258,70%,68%)] to-[hsl(186,94%,44%)] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Target className="text-white h-10 w-10" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border-4 border-blue-500 text-blue-500 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">2</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Set Your Split</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Choose how much each card should contribute — by percentage or fixed amounts
              </p>
            </div>
            
            <div className="text-center group">
              <div className="mb-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-[hsl(186,94%,44%)] to-[hsl(249,83%,65%)] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <ShoppingCart className="text-white h-10 w-10" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border-4 border-blue-500 text-blue-500 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">3</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Shop Everywhere</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Use your bcard at any online store or let our browser extension split payments automatically
              </p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/addon-checkout-demo"}
              className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] px-8 py-3 text-lg font-semibold shadow-lg"
            >
              See It In Action
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>





      {/* Features Section */}
      <div id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-100 text-blue-700">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built For The Modern Consumer
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive features designed to simplify complex payment scenarios
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(258,70%,68%)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Browser Extension</h3>
                <p className="text-gray-600 leading-relaxed">Automatically detects checkout pages and enables payment splitting with one click across any merchant website</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(258,70%,68%)] to-[hsl(186,94%,44%)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Smart bcards</h3>
                <p className="text-gray-600 leading-relaxed">Generate secure bcards funded by your combined payment sources with customizable spending limits and merchant restrictions</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(186,94%,44%)] to-[hsl(249,83%,65%)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <PieChart className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Smart Analytics</h3>
                <p className="text-gray-600 leading-relaxed">Track spending patterns across all funding sources and optimize your payment strategies with detailed insights</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Bank-Level Security</h3>
                <p className="text-gray-600 leading-relaxed">256-bit encryption, fraud protection, and compliance with all major financial regulations keep your data safe</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(258,70%,68%)] to-[hsl(249,83%,65%)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Mobile Optimized</h3>
                <p className="text-gray-600 leading-relaxed">Fully responsive platform that works seamlessly across all devices and screen sizes for on-the-go payments</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(186,94%,44%)] to-[hsl(258,70%,68%)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Store className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Merchant Integration</h3>
                <p className="text-gray-600 leading-relaxed">Easy integration for e-commerce stores to offer bpay as a payment option with comprehensive developer tools</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-purple-100 text-purple-700">Pricing Plans</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing that scales with your transaction volume. Start free, upgrade as you grow.
            </p>
          </div>
          
          <DynamicPricing locale="en" />
          
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-4">
              Need custom volume pricing? Processing over $100K monthly?
            </p>
            <Button className="border-2 border-[hsl(249,83%,65%)] text-[hsl(249,83%,65%)] bg-transparent hover:bg-[hsl(249,83%,65%)] hover:text-white px-8 py-3 transition-all duration-300">
              Contact Enterprise Sales
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Split Your Next Payment?
          </h2>
          <p className="text-xl mb-12 text-blue-50">
            Join thousands of users who've already discovered the power of smart payment splitting.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              className="bg-white text-[hsl(249,83%,65%)] hover:bg-gray-50 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              onClick={() => window.location.href = "/banner-checkout-demo"}
              className="border-2 border-white text-white hover:bg-white hover:text-[hsl(249,83%,65%)] backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all duration-300"
            >
              Customer Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-6">
                <Zap className="h-8 w-8 text-[hsl(249,83%,65%)] mr-3" />
                <span className="text-2xl font-bold">bpay</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The smart payment platform that revolutionizes how you split payments across multiple funding sources.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/addon-checkout-demo" className="hover:text-white transition-colors">Merchant Demo</a></li>
                <li><a href="/banner-checkout-demo" className="hover:text-white transition-colors">Customer Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/investors" className="hover:text-white transition-colors">For Investors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="mailto:hello@getbpay.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-300">
                <li>📧 hello@getbpay.com</li>
                <li>📞 +1 (551) 375-8915</li>
                <li>📍 Casper, Wyoming</li>
                <li>🇺🇸 United States</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 B Ventures LLC. All rights reserved. Built with modern fintech infrastructure.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
