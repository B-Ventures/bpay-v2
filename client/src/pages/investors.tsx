import { TrendingUp, Users, Building2, Target, Shield, Clock, ArrowRight, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";

export default function Investors() {
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
                <a href="/" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>
                <a href="/addon-checkout-demo" className="text-gray-600 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium transition-colors">Merchant Demo</a>
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"} className="text-gray-600">
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = "/api/login"} className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] text-white shadow-lg">
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
                href="/" 
                className="text-gray-600 hover:text-[hsl(249,83%,65%)] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
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
                  className="w-full bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)] shadow-lg"
                >
                  Start Free
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-16 pb-20 bg-gradient-to-br from-[hsl(249,83%,65%)] via-[hsl(258,70%,68%)] to-[hsl(186,94%,44%)] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-medium">
              Investment Opportunity
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Transforming The<br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Payment Industry
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-blue-50 leading-relaxed">
              bpay is positioned to capture significant market share in the rapidly growing fintech payment orchestration space
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-[hsl(249,83%,65%)] hover:bg-gray-50 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Request Pitch Deck
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                className="border-2 border-white text-white hover:bg-white hover:text-[hsl(249,83%,65%)] backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all duration-300"
              >
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Market Opportunity */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-green-100 text-green-700">Market Analysis</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              $78B Market Opportunity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Payment processing market growing at 12.7% CAGR with increasing demand for flexible solutions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Market Drivers</h3>
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
        </div>
      </div>

      {/* Business Model */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-100 text-blue-700">Business Model</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Scalable Revenue Streams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hybrid subscription + transaction model with high gross margins and predictable growth
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Revenue Model</h3>
                <p className="text-gray-600 mb-4">Hybrid subscription + transaction fees with scalable pricing tiers</p>
                <div className="text-2xl font-bold text-[hsl(249,83%,65%)]">0.9% - 2.9%</div>
                <div className="text-sm text-gray-500">+ subscription revenue</div>
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

      {/* Contact CTA */}
      <div className="py-24 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Join Our Journey?
          </h2>
          <p className="text-xl mb-12 text-blue-50">
            Partner with us as we reshape the future of digital payments and capture this massive market opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg"
              className="bg-white text-[hsl(249,83%,65%)] hover:bg-gray-50 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Contact Investment Team
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-[hsl(249,83%,65%)] backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all duration-300"
            >
              Download One-Pager
            </Button>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-blue-100 mb-4">Contact our investment team directly:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-white">
              <span>📧 hello@getbpay.com</span>
              <span>📞 +1 (551) 375-8915</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}