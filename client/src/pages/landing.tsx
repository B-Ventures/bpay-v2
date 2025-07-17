import { CreditCard, Plus, PieChart, ShoppingCart, Globe, Shield, Smartphone, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <CreditCard className="text-[hsl(249,83%,65%)] h-8 w-8 mr-2" />
                <span className="text-2xl font-bold text-[hsl(249,83%,65%)]">bpay</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <a href="#features" className="text-gray-700 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#pricing" className="text-gray-700 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                <a href="#merchants" className="text-gray-700 hover:text-[hsl(249,83%,65%)] px-3 py-2 rounded-md text-sm font-medium">For Merchants</a>
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"}>
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = "/api/login"} className="bg-[hsl(249,83%,65%)] hover:bg-[hsl(249,83%,60%)]">
                  Get Started
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
      <div className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Split Your Payments,<br />
              <span className="text-[hsl(186,94%,44%)]">Simplify Your Life</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-100">
              Combine multiple funding sources and divide any payment amount based on your preferences. One checkout, multiple payment methods.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/api/login"}
                className="bg-white text-[hsl(249,83%,65%)] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[hsl(249,83%,65%)] px-8 py-3 text-lg font-semibold"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How bpay Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Three simple steps to revolutionize your payment experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[hsl(249,83%,65%)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Add Funding Sources</h3>
              <p className="text-gray-600">Connect your credit cards, debit cards, and bank accounts to your bpay wallet</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[hsl(258,70%,68%)] rounded-full flex items-center justify-center mx-auto mb-6">
                <PieChart className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Configure Split</h3>
              <p className="text-gray-600">Set percentages or fixed amounts for each funding source based on your preferences</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[hsl(186,94%,44%)] rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Pay Anywhere</h3>
              <p className="text-gray-600">Use your virtual bpay card at any online store or enable auto-split on supported sites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to manage your payments efficiently</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 card-hover">
              <CardContent className="p-0">
                <Globe className="text-[hsl(249,83%,65%)] h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Browser Extension</h3>
                <p className="text-gray-600">Automatically detects checkout pages and enables payment splitting with one click</p>
              </CardContent>
            </Card>
            <Card className="p-8 card-hover">
              <CardContent className="p-0">
                <CreditCard className="text-[hsl(249,83%,65%)] h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Virtual Cards</h3>
                <p className="text-gray-600">Generate secure virtual cards funded by your combined payment sources</p>
              </CardContent>
            </Card>
            <Card className="p-8 card-hover">
              <CardContent className="p-0">
                <PieChart className="text-[hsl(249,83%,65%)] h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Smart Analytics</h3>
                <p className="text-gray-600">Track spending patterns and optimize your payment split strategies</p>
              </CardContent>
            </Card>
            <Card className="p-8 card-hover">
              <CardContent className="p-0">
                <Shield className="text-[hsl(249,83%,65%)] h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Bank-Level Security</h3>
                <p className="text-gray-600">256-bit encryption and fraud protection for all your transactions</p>
              </CardContent>
            </Card>
            <Card className="p-8 card-hover">
              <CardContent className="p-0">
                <Smartphone className="text-[hsl(249,83%,65%)] h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Mobile Ready</h3>
                <p className="text-gray-600">Manage your payments on the go with our responsive web platform</p>
              </CardContent>
            </Card>
            <Card className="p-8 card-hover">
              <CardContent className="p-0">
                <Store className="text-[hsl(249,83%,65%)] h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Merchant Integration</h3>
                <p className="text-gray-600">Easy integration for e-commerce stores to offer bpay as a payment option</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose the plan that works for you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold mb-4">Personal</h3>
                <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-4">Free</div>
                <p className="text-gray-600 mb-6">Perfect for individual users</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Up to 3 funding sources</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> 5 virtual cards per month</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Basic analytics</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Email support</li>
                </ul>
                <Button className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300">Get Started</Button>
              </CardContent>
            </Card>
            <Card className="p-8 bg-[hsl(249,83%,65%)] text-white relative">
              <div className="absolute top-0 right-0 bg-[hsl(186,94%,44%)] text-white px-3 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                Most Popular
              </div>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <div className="text-4xl font-bold mb-4">$9.99<span className="text-lg font-normal">/month</span></div>
                <p className="text-gray-100 mb-6">For power users and small businesses</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><Check className="text-[hsl(186,94%,44%)] h-5 w-5 mr-2" /> Unlimited funding sources</li>
                  <li className="flex items-center"><Check className="text-[hsl(186,94%,44%)] h-5 w-5 mr-2" /> 50 virtual cards per month</li>
                  <li className="flex items-center"><Check className="text-[hsl(186,94%,44%)] h-5 w-5 mr-2" /> Advanced analytics</li>
                  <li className="flex items-center"><Check className="text-[hsl(186,94%,44%)] h-5 w-5 mr-2" /> Priority support</li>
                  <li className="flex items-center"><Check className="text-[hsl(186,94%,44%)] h-5 w-5 mr-2" /> API access</li>
                </ul>
                <Button className="w-full bg-white text-[hsl(249,83%,65%)] hover:bg-gray-100">Start Free Trial</Button>
              </CardContent>
            </Card>
            <Card className="p-8">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                <div className="text-4xl font-bold text-[hsl(249,83%,65%)] mb-4">Custom</div>
                <p className="text-gray-600 mb-6">For large organizations</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Everything in Pro</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Unlimited virtual cards</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Custom integrations</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> Dedicated support</li>
                  <li className="flex items-center"><Check className="text-green-500 h-5 w-5 mr-2" /> SLA guarantee</li>
                </ul>
                <Button className="w-full bg-[hsl(249,83%,65%)] text-white hover:bg-[hsl(249,83%,60%)]">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
