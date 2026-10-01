import React from 'react';
import { Send, Clock, CheckCircle, Users, Globe, Play, Loader2 } from 'lucide-react';
import { CampaignSummary } from '@/types';

interface QuotaCardProps {
  summary: CampaignSummary;
  onDispatchNext: () => Promise<void>;
  isDispatching: boolean;
}

export const QuotaCard: React.FC<QuotaCardProps> = ({
  summary,
  onDispatchNext,
  isDispatching,
}) => {
  const percent = Math.min(
    100,
    Math.round((summary.sentToday / Math.max(1, summary.dailyLimit)) * 100)
  );

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Daily Quota & Pacer */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Today's Cold Email Quota
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                Safe Cadence (3–7 min pacer)
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              <span className="text-emerald-400 text-lg">{summary.sentToday}</span>
              <span className="text-slate-500"> / {summary.dailyLimit} Sent</span>
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
                : 'Daily 10-email goal completed! Next batch opens tomorrow.'}
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

        {/* Right: Dispatch Button */}
        <div className="shrink-0 flex flex-col justify-center">
          <button
            onClick={onDispatchNext}
            disabled={isDispatching || summary.remainingToday <= 0}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {isDispatching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking MX & Sending...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Dispatch Next Eligible Lead</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-1.5">
            Auto-checks recipient business hours
          </p>
        </div>
      </div>
    </div>
  );
};
