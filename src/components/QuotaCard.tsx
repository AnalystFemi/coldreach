import React from 'react';
import { Send, Clock, CheckCircle, Users, Globe, Play, Loader2, Zap, Pause } from 'lucide-react';
import { CampaignSummary } from '@/types';

interface QuotaCardProps {
  summary: CampaignSummary;
  onDispatchNext: () => Promise<void>;
  isDispatching: boolean;
  isAutoPilot: boolean;
  onToggleAutoPilot: () => void;
  nextAutoCheckCountdown: number;
}

export const QuotaCard: React.FC<QuotaCardProps> = ({
  summary,
  onDispatchNext,
  isDispatching,
  isAutoPilot,
  onToggleAutoPilot,
  nextAutoCheckCountdown,
}) => {
  const percent = Math.min(
    100,
    Math.round((summary.sentToday / Math.max(1, summary.dailyLimit)) * 100)
  );

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Daily Quota & Pacer */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daily Outreach Quota
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                October Campaign: 34 / day
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              <span className="text-emerald-400 text-lg">{summary.sentToday}</span>
              <span className="text-slate-500"> / {summary.dailyLimit} Sent Today</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {summary.remainingToday > 0
                ? `${summary.remainingToday} emails remaining in today's safe quota`
                : 'Today’s batch completed! Next batch opens tomorrow.'}
            </span>
            <span className="text-slate-500 font-mono">
              Resets midnight local time
            </span>
          </div>
        </div>

        {/* Middle Stats Badges */}
        <div className="grid grid-cols-3 gap-3 border-y lg:border-y-0 lg:border-x border-slate-800/80 py-4 lg:py-0 lg:px-6">
          <div className="text-center">
            <span className="text-[11px] text-slate-400">Queued Leads</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {summary.totalQueued}
            </div>
          </div>

          <div className="text-center">
            <span className="text-[11px] text-slate-400">Emails Sent</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {summary.totalSentAllTime}
            </div>
          </div>

          <div className="text-center">
            <span className="text-[11px] text-slate-400">Web Forms Sent</span>
            <div className="text-xl font-bold text-cyan-400 mt-0.5">
              {summary.formsSubmittedAllTime}
            </div>
          </div>
        </div>

        {/* Right: Auto-Pilot Switch & Manual Trigger */}
        <div className="shrink-0 flex flex-col items-center lg:items-end space-y-2">
          {/* Autonomous Mode Toggle */}
          <button
            onClick={onToggleAutoPilot}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition-all ${
              isAutoPilot
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isAutoPilot ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>Auto-Pilot: ACTIVE (Hands-Free)</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Turn ON Auto-Pilot</span>
              </>
            )}
          </button>

          {/* Status or Manual Button */}
          {isAutoPilot ? (
            <p className="text-[10px] text-emerald-400 font-mono text-center lg:text-right">
              Sending 34/day automatically • Next check in {nextAutoCheckCountdown}s
            </p>
          ) : (
            <button
              onClick={onDispatchNext}
              disabled={isDispatching || summary.remainingToday <= 0}
              className="text-[11px] text-slate-400 hover:text-white underline decoration-dotted flex items-center space-x-1"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>Sending next lead...</span>
                </>
              ) : (
                <span>Or manually send next lead now</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
