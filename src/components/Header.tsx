import React from 'react';
import { Send, RefreshCw, Settings, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  gmailUser: string;
  isGmailConfigured: boolean;
  onSync: () => void;
  isSyncing: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gmailUser,
  isGmailConfigured,
  onSync,
  isSyncing,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/20">
            <Send className="w-5 h-5 -rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                ColdReach Engine
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full uppercase">
                10/day Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Timezone-Aware Gmail Automation & MX Verification
            </p>
          </div>
        </div>

        {/* Sender & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Sender Badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {isGmailConfigured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-slate-400">From:</span>
            <span className="font-mono text-slate-200">{gmailUser}</span>
          </div>

          {/* Sync from LeadRadar */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all disabled:opacity-50"
            title="Auto-sync scraped leads from LeadRadar"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span>Sync Leads</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              isGmailConfigured
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-amber-950/60 border-amber-700/60 text-amber-300 animate-pulse'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isGmailConfigured ? 'Settings' : 'Set App Password'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
