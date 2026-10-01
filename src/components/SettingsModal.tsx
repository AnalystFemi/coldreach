import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Save, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentSettings: {
    gmailUser: string;
    hasPassword: boolean;
    senderName: string;
    dailyLimit: number;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  currentSettings,
}) => {
  const [appPassword, setAppPassword] = useState('');
  const [senderName, setSenderName] = useState(currentSettings.senderName);
  const [dailyLimit, setDailyLimit] = useState(currentSettings.dailyLimit);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/campaign/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appPassword: appPassword.trim() || undefined,
          senderName: senderName.trim(),
          dailyLimit: Number(dailyLimit),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onSaved();
          onClose();
        }, 1200);
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Gmail & Outreach Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure your Google App Password for safe cold emailing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Instructions Box */}
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-1.5 text-indigo-200">
            <div className="font-semibold text-indigo-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>How to get your 16-character App Password:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Open your Google Account: <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center space-x-0.5"><span>Google Security</span> <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li>Make sure <strong>2-Step Verification</strong> is ON.</li>
              <li>Search for <strong>"App passwords"</strong>.</li>
              <li>Create one named <em>ColdReach Engine</em> and copy the 16 letters.</li>
            </ol>
          </div>

          {/* Gmail User */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Sending Gmail Account:
            </label>
            <input
              type="text"
              disabled
              value={currentSettings.gmailUser}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono"
            />
          </div>

          {/* App Password */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Google App Password (16 characters)</span>
              {currentSettings.hasPassword && (
                <span className="text-[10px] text-emerald-400 font-normal">
                  ✓ Configured in .env.local
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder={currentSettings.hasPassword ? '•••••••••••••••• (Leave blank to keep current)' : 'e.g. abcd efgh ijkl mnop'}
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Your Display Name (Sender Name):
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Daily Cold Email Limit:
            </label>
            <input
              type="number"
              min="5"
              max="25"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Recommended: 10 emails/day to maintain pristine inbox delivery.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
