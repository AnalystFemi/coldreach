import React from 'react';
import { CheckCircle2, AlertCircle, Mail, Globe, Clock } from 'lucide-react';
import { DeliveryLog } from '@/types';

interface DeliveryLogsProps {
  logs: DeliveryLog[];
}

export const DeliveryLogs: React.FC<DeliveryLogsProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Live Delivery & Dispatch History
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">
          Showing last {logs.length} dispatches
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
          >
            <div className="flex items-start space-x-2.5 min-w-0">
              {log.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white truncate">
                    {log.businessName}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                      log.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <p className="text-slate-400 font-mono text-[11px] truncate mt-0.5">
                  {log.recipient} • {log.subject}
                </p>
                {log.notes && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{log.notes}</p>
                )}
              </div>
            </div>

            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
