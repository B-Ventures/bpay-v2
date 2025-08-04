import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    
    // Navigate to appropriate route based on current path
    if (location === '/' || location === '/ar') {
      // Main landing pages
      setLocation(newLang === 'ar' ? '/ar' : '/');
    } else if (location === '/investors' || location === '/investors-ar') {
      // Investors pages
      setLocation(newLang === 'ar' ? '/investors-ar' : '/investors');
    } else {
      // For other pages, just stay on current page
      // The language context will handle UI updates
    }
  };

  // Show the opposite language of what's currently active
  const targetLanguage = language === 'en' ? 'ar' : 'en';
  const displayText = targetLanguage === 'ar' ? 'العربية' : 'English';
  const flagEmoji = targetLanguage === 'ar' ? '🇸🇦' : '🇺🇸';

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="gap-2 text-gray-600 hover:text-[hsl(249,83%,65%)]"
      onClick={handleLanguageToggle}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {flagEmoji} {displayText}
      </span>
    </Button>
  );
}