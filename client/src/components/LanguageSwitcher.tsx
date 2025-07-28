import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();

  const handleLanguageChange = (newLang: 'en' | 'ar') => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {language === 'ar' ? 'العربية' : 'English'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'bg-gray-100' : ''}
        >
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('ar')}
          className={language === 'ar' ? 'bg-gray-100' : ''}
        >
          🇸🇦 العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}