import { CreditCard, Plus, PieChart, ShoppingCart, Globe, Shield, Smartphone, Store, Check, TrendingUp, Users, Award, Star, ArrowRight, Zap, Target, DollarSign, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
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
                <Badge variant="secondary" className="ml-3 text-xs bg-green-100 text-green-700">Live Platform</Badge>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-6">
                <a href="#how-it-works" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">How It Works</a>
                <a href="#for-investors" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">For Investors</a>
                <a href="#features" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="/addon-checkout-demo" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">Live Demo</a>
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"} className="text-gray-600">
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = "/api/login"} className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] shadow-lg">
                  Start Free
                </Button>
              </div>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="sm">
                <span className="sr-only">Open main menu</span>
                ☰
              </Button>
            </div>
          </div>
        </div>
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
                variant="outline"
                onClick={() => window.location.href = "/addon-checkout-demo"}
                className="border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all duration-300"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Try Live Demo
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
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(258,70%,68%)] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Plus className="text-white h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Connect Your Cards</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Link your credit cards, debit cards, and bank accounts securely to your bpay account
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-[hsl(258,70%,68%)] to-[hsl(186,94%,44%)] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Target className="text-white h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Set Your Split</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Choose how much each card should contribute — by percentage or fixed amounts
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-[hsl(186,94%,44%)] to-[hsl(249,83%,65%)] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <ShoppingCart className="text-white h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
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



      {/* For Investors Section */}
      <div id="for-investors" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-green-100 text-green-700">For Investors</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Transforming The Payment Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              bpay is positioned to capture significant market share in the rapidly growing fintech payment orchestration space
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Market Opportunity</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">$78B Payment Processing Market</h4>
                    <p className="text-gray-600">Growing at 12.7% CAGR, with increasing demand for flexible payment solutions</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">430M+ Credit Card Users</h4>
                    <p className="text-gray-600">In US alone, seeking better ways to optimize rewards and manage spending</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">5M+ E-commerce Merchants</h4>
                    <p className="text-gray-600">Looking for innovative payment solutions to increase conversion rates</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-2">15%</div>
                  <div className="text-sm text-gray-600">Monthly Growth Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-2">$2.5M</div>
                  <div className="text-sm text-gray-600">Transaction Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-2">12k+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-2">92%</div>
                  <div className="text-sm text-gray-600">User Retention</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Revenue Model</h3>
                <p className="text-gray-600 mb-4">Transaction-based fees with high gross margins and recurring revenue streams</p>
                <div className="text-2xl font-bold text-[hsl(249,83%,65%)]">2.9% + $0.30</div>
                <div className="text-sm text-gray-500">per transaction</div>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Competitive Advantage</h3>
                <p className="text-gray-600 mb-4">First-to-market payment splitting technology with strong IP protection</p>
                <div className="text-2xl font-bold text-[hsl(249,83%,65%)]">3 Patents</div>
                <div className="text-sm text-gray-500">pending</div>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Time to Market</h3>
                <p className="text-gray-600 mb-4">Fully operational platform ready for scaling and merchant partnerships</p>
                <div className="text-2xl font-bold text-[hsl(249,83%,65%)]">Live Now</div>
                <div className="text-sm text-gray-500">production ready</div>
              </CardContent>
            </Card>
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
              variant="outline"
              onClick={() => window.location.href = "/banner-checkout-demo"}
              className="border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all duration-300"
            >
              Try Extension Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-6">
                <Zap className="h-8 w-8 text-[hsl(249,83%,65%)] mr-3" />
                <span className="text-2xl font-bold">bpay</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The smart payment platform that revolutionizes how you split payments across multiple funding sources.
              </p>
              <div className="flex space-x-4">
                <Badge className="bg-gray-800 text-gray-300">Live Platform</Badge>
                <Badge className="bg-green-900 text-green-300">Processing Payments</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/addon-checkout-demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><a href="/banner-checkout-demo" className="hover:text-white transition-colors">Extension Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#for-investors" className="hover:text-white transition-colors">For Investors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 bpay. All rights reserved. Built with modern fintech infrastructure.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
