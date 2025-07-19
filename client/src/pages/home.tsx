import { useState } from "react";
import { CreditCard, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Overview from "@/components/dashboard/overview";
import FundingSources from "@/components/dashboard/funding-sources";
import VirtualCards from "@/components/dashboard/virtual-cards";
import Transactions from "@/components/dashboard/transactions";
import Settings from "@/components/dashboard/settings";
import DemoModeToggle from "@/components/ui/demo-mode-toggle";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "funding", label: "Funding Sources" },
    { id: "virtual-cards", label: "Virtual Cards" },
    { id: "transactions", label: "Transactions" },
    { id: "settings", label: "Settings" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "funding":
        return <FundingSources />;
      case "virtual-cards":
        return <VirtualCards />;
      case "transactions":
        return <Transactions />;
      case "settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CreditCard className="text-[hsl(249,83%,65%)] h-8 w-8 mr-2" />
              <h1 className="text-2xl font-bold text-[hsl(249,83%,65%)]">bpay</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <img 
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[hsl(249,83%,65%)] text-[hsl(249,83%,65%)]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="flex justify-end sm:justify-start">
              <DemoModeToggle />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}
