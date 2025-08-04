import { useLanguage } from '@/contexts/LanguageContext';
import arabicTranslations from '@/translations/arabic.json';

// English translations (default/fallback)
const englishTranslations = {
  navigation: {
    howItWorks: "How It Works",
    forInvestors: "For Investors", 
    features: "Features",
    merchantDemo: "Merchant Demo",
    signIn: "Sign In",
    getStarted: "Get Started"
  },
  hero: {
    title: "Split Any Payment Your Way",
    subtitle: "The smart payment platform that combines multiple credit cards, bank accounts, and funding sources into one powerful payment experience. No more choosing between cards — use them all at once.",
    cta: "Start Free Today",
    demoButton: "Merchant Demo",
    socialProof: "Join 12,000+ users splitting payments intelligently"
  },
  stats: {
    volume: "+$2.5M Volume",
    uptime: "99.9% Uptime", 
    merchants: "+500 Merchants",
    rating: "4.9★ Rating"
  },
  howItWorks: {
    badge: "How It Works?",
    title: "Three Simple Steps to Smart Payments",
    subtitle: "From setting up funding sources to completing payments - an enhanced experience in minutes.",
    step1: {
      title: "Connect Funding Sources",
      description: "Link multiple credit cards, bank accounts, or digital wallets to one secure bpay account."
    },
    step2: {
      title: "Create Smart Splits", 
      description: "Choose how to split payments - by percentage, fixed amounts, or smart splitting strategies."
    },
    step3: {
      title: "Complete Payment Transactions",
      description: "Complete your payments seamlessly with bcards and use them at any shopping website."
    }
  },
  features: {
    badge: "Key Features",
    title: "Features Designed for Modern Payments",
    subtitle: "A comprehensive experience from multiple funding sources to advanced transaction management.",
    smartSplitting: {
      title: "Smart Splitting",
      description: "Advanced algorithms optimize how payments are split across funding sources based on balance, limits, and rewards"
    },
    instantCards: {
      title: "Instant Payment Cards", 
      description: "Generate secure instant bcards for each transaction with customizable spending limits"
    },
    realTimeProcessing: {
      title: "Real-time Processing",
      description: "Instant transaction processing with live updates for account balances and transaction status"
    },
    bankLevelSecurity: {
      title: "Bank-Level Security",
      description: "256-bit encryption, fraud protection, and compliance with all major financial regulations keeps your data secure"
    },
    mobileOptimized: {
      title: "Mobile Optimized",
      description: "Fully responsive platform that works seamlessly across all devices and screen sizes for payments on the go"
    },
    merchantIntegration: {
      title: "Merchant Integration", 
      description: "Easy integration for online stores to offer bpay as a payment option with comprehensive developer tools"
    }
  },
  pricing: {
    badge: "Pricing Plans",
    title: "Choose Your Perfect Plan", 
    subtitle: "Clear pricing that scales with your transaction volume. Start free, upgrade as you grow.",
    free: {
      title: "Starter",
      price: "Free",
      description: "Perfect for beginners and light usage",
      perTransaction: "per transaction"
    },
    pro: {
      title: "Pro",
      description: "Perfect for regular to heavy usage"
    },
    premium: {
      title: "Premium", 
      description: "Perfect for heavy usage and businesses"
    },
    enterprise: {
      subtitle: "Need custom pricing or processing over $100K monthly?",
      button: "Contact Enterprise Team"
    }
  },
  cta: {
    title: "Ready for a Payment Revolution?",
    subtitle: "Join thousands of users benefiting from smart payment splitting.",
    startButton: "Start Free Today",
    demoButton: "Try as Customer"
  },
  footer: {
    description: "The smart payment platform that revolutionizes how payments are split across multiple funding sources.",
    product: "Product",
    company: "Company", 
    contact: "Contact",
    copyright: "© 2025 B Ventures LLC. All rights reserved. Built with modern financial infrastructure."
  }
};

export function useTranslations() {
  const { language } = useLanguage();
  
  if (language === 'ar') {
    return arabicTranslations;
  }
  
  return englishTranslations;
}