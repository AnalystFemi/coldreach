import React from 'react';
import { Clock, Globe2, Sun, Moon } from 'lucide-react';
import { TimezoneInfo } from '@/types';

interface TimezoneRadarProps {
  timezones: TimezoneInfo[];
}

export const TimezoneRadar: React.FC<TimezoneRadarProps> = ({ timezones }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Global Timezone Radar & Send Windows
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">
          Target Window: 9:00 AM – 11:30 AM & 1:30 PM – 4:00 PM local time
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {timezones.map((tz) => (
          <div
            key={tz.iana}
            className={`p-3 rounded-xl border transition-all ${
              tz.isBusinessHours
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {tz.region}
              </span>
              {tz.isBusinessHours ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <Moon className="w-3 h-3 text-slate-500" />
              )}
            </div>

            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-sm font-bold text-white">
                {tz.currentTime.split(' ')[0]} {tz.currentTime.split(' ')[1]}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  tz.isBusinessHours
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {tz.isBusinessHours ? 'OPEN' : 'PAUSED'}
              </span>
            </div>

            <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
              <span>In Queue:</span>
              <span className="font-semibold text-slate-200">
                {tz.leadCount} leads
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
