import React from 'react';
import { Shield, Wifi, Activity } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopNav({ systemStatus, children }) {
  const { t } = useLang();

  const statusColor = systemStatus === 'online'
    ? 'text-vajra-green'
    : systemStatus === 'analyzing'
    ? 'text-vajra-amber'
    : 'text-muted-foreground';

  const statusLabel = systemStatus === 'online'
    ? t('systemOnline')
    : systemStatus === 'analyzing'
    ? t('analyzing')
    : t('idle');

  return (
    <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield className="w-8 h-8 text-primary" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-vajra-cyan rounded-full animate-pulse-glow" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
            VAJRA<span className="text-primary"> DRISTI</span>
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase">
            {t('appTagline')}
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 text-xs font-mono">
        <span className="text-muted-foreground px-3 py-1.5 rounded-md bg-secondary/50">
          v2.4.1
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <Activity className={`w-4 h-4 ${statusColor}`} />
          <span className={`text-xs font-mono ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Wifi className="w-4 h-4 text-vajra-green" />
          <span className="text-xs font-mono text-vajra-green">{t('connected')}</span>
        </div>
        {children}
        <LanguageSwitcher />
      </div>
    </header>
  );
}