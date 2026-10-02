import React from 'react';
import { Navbar } from '../components/Navbar';
import { AppLanguage } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  apiOnline: boolean;
  onOpenSettings: () => void;
  onPrint: () => void;
  hasProcessed: boolean;
  onLoadDemo?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  language,
  onLanguageChange,
  apiOnline,
  onOpenSettings,
  onPrint,
  hasProcessed,
  onLoadDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        language={language}
        onLanguageChange={onLanguageChange}
        apiOnline={apiOnline}
        onOpenSettings={onOpenSettings}
        onPrint={onPrint}
        hasProcessed={hasProcessed}
        onLoadDemo={onLoadDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-900/60 py-4 text-center text-xs text-slate-400 no-print">
        <p>
          Passport Photo Maker Pro • AI Biometric Photo & A4 Print Studio • Compliant with ICAO Document 9303
        </p>
      </footer>
    </div>
  );
};
