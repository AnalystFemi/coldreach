import React, { useState } from 'react';
import {
  Mail,
  Send,
  Globe,
  Clock,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { CampaignLead } from '@/types';

interface QueueTableProps {
  leads: CampaignLead[];
  onDispatchLead: (leadId: string) => Promise<void>;
  onVerifyEmail: (email: string) => Promise<void>;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  leads,
  onDispatchLead,
  onVerifyEmail,
}) => {
  const [filter, setFilter] = useState<'all' | 'window' | 'email' | 'form'>('all');
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);

  const handleSend = async (leadId: string) => {
    setActiveDispatchId(leadId);
    await onDispatchLead(leadId);
    setActiveDispatchId(null);
  };

  const filteredLeads = leads.filter((lead) => {
    if (lead.status !== 'queued') return false;
    if (filter === 'window' && !lead.isInSendWindow) return false;
    if (filter === 'email' && lead.channel !== 'email') return false;
    if (filter === 'form' && lead.channel !== 'contact_form') return false;
    return true;
  });

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Outreach Queue ({filteredLeads.length} Available)
          </h3>
          <p className="text-xs text-slate-400">
            Ordered by priority and local timezone business window
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Queued
          </button>
          <button
            onClick={() => setFilter('window')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1 ${
              filter === 'window'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>In Send Window</span>
          </button>
          <button
            onClick={() => setFilter('email')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'email'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email Only
          </button>
          <button
            onClick={() => setFilter('form')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'form'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Web Form Only
          </button>
        </div>
      </div>

      {/* Leads Table */}
      {filteredLeads.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Business / Prospect</th>
                <th className="py-3 px-3">Location & Timezone</th>
                <th className="py-3 px-3">Channel & Verification</th>
                <th className="py-3 px-3">Service Angle</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.slice(0, 50).map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Name */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                      {lead.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {lead.pitchSubject}
                    </div>
                  </td>

                  {/* Location & Timezone */}
                  <td className="py-3.5 px-3">
                    <div className="text-slate-200">
                      {lead.city}, {lead.country}
                    </div>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono text-slate-400">
                        {lead.localTime || 'Local Time'}
                      </span>
                      {lead.isInSendWindow ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                          WINDOW OPEN
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-800 text-slate-500 rounded">
                          PAUSED
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Channel & MX Check */}
                  <td className="py-3.5 px-3">
                    {lead.channel === 'email' ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 font-mono text-emerald-400">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">{lead.email}</span>
                        </div>
                        {lead.mxValid === true ? (
                          <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                            <ShieldCheck className="w-3 h-3" />
                            <span>MX Verified ({lead.mxHost?.slice(0, 18)}...)</span>
                          </div>
                        ) : lead.mxValid === false ? (
                          <div className="flex items-center space-x-1 text-[10px] text-rose-400">
                            <AlertCircle className="w-3 h-3" />
                            <span>Invalid MX: {lead.verificationReason}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => lead.email && onVerifyEmail(lead.email)}
                            className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1"
                          >
                            <span>Verify MX Record</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-cyan-400">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">
                            {lead.website || 'No website'}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded">
                          Auto-Contact Form
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Service Angle */}
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded-lg">
                      {lead.serviceAngle}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleSend(lead.id)}
                      disabled={activeDispatchId === lead.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center space-x-1 ml-auto disabled:opacity-50"
                    >
                      {activeDispatchId === lead.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>{lead.channel === 'email' ? 'Send Email' : 'Submit Form'}</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500 text-xs">
          No leads currently match this filter. Sync leads from LeadRadar or adjust filters.
        </div>
      )}
    </div>
  );
};
