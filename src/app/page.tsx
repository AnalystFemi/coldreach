'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { QuotaCard } from '@/components/QuotaCard';
import { TimezoneRadar } from '@/components/TimezoneRadar';
import { QueueTable } from '@/components/QueueTable';
import { DeliveryLogs } from '@/components/DeliveryLogs';
import { SettingsModal } from '@/components/SettingsModal';
import { CampaignSummary, CampaignLead, DeliveryLog } from '@/types';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function Home() {
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(true);
  const [nextAutoCheckCountdown, setNextAutoCheckCountdown] = useState(180);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/campaign/status');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setLeads(data.leads || []);
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Autonomous Auto-Pilot Timer
  useEffect(() => {
    if (!isAutoPilot) return;

    const timer = setInterval(() => {
      setNextAutoCheckCountdown((prev) => {
        if (prev <= 1) {
          // Trigger automated dispatch
          handleDispatchNext();
          // Reset to random delay between 3 and 6 minutes (180 to 360 seconds)
          return Math.floor(Math.random() * (360 - 180 + 1)) + 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoPilot, summary]);

  // Sync leads from LeadRadar
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/campaign/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        await fetchStatus();
      } else {
        showNotification('error', data.error || 'Sync failed');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Dispatch next eligible lead (timezone-aware)
  const handleDispatchNext = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/campaign/dispatch', { method: 'POST' });
      const data = await res.json();
      if (data.dispatched) {
        showNotification('success', data.message);
      } else {
        showNotification('info', data.message);
      }
      await fetchStatus();
    } catch (err: any) {
      showNotification('error', err?.message || 'Dispatch error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Dispatch specific lead
  const handleDispatchSingle = async (leadId: string) => {
    try {
      const res = await fetch('/api/campaign/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
      } else {
        showNotification('error', data.message);
      }
      await fetchStatus();
    } catch (err: any) {
      showNotification('error', err?.message || 'Dispatch failed');
    }
  };

  // Real-time DNS MX check
  const handleVerifyEmail = async (email: string) => {
    try {
      const res = await fetch('/api/campaign/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.isValid) {
        showNotification('success', `Valid MX Host: ${data.mxHost}`);
      } else {
        showNotification('error', `MX Failed: ${data.reason}`);
      }
      await fetchStatus();
    } catch {
      showNotification('error', 'Failed to verify MX');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      {/* Header */}
      <Header
        gmailUser={summary?.gmailUser || 'joshuaakintayo21@gmail.com'}
        isGmailConfigured={Boolean(summary?.gmailConfigured)}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center space-x-3 text-xs transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/60 border-rose-700/60 text-rose-200'
                : 'bg-indigo-950/60 border-indigo-700/60 text-indigo-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Quota & Action Card */}
        {summary && (
          <QuotaCard
            summary={summary}
            onDispatchNext={handleDispatchNext}
            isDispatching={isDispatching}
            isAutoPilot={isAutoPilot}
            onToggleAutoPilot={() => setIsAutoPilot(!isAutoPilot)}
            nextAutoCheckCountdown={nextAutoCheckCountdown}
          />
        )}

        {/* Global Timezone Radar */}
        {summary && <TimezoneRadar timezones={summary.activeTimezones} />}

        {/* Outreach Queue */}
        <QueueTable
          leads={leads}
          onDispatchLead={handleDispatchSingle}
          onVerifyEmail={handleVerifyEmail}
        />

        {/* Live Delivery Logs */}
        <DeliveryLogs logs={logs} />
      </main>

      {/* Settings Modal */}
      {summary && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={fetchStatus}
          currentSettings={{
            gmailUser: summary.gmailUser || 'joshuaakintayo21@gmail.com',
            hasPassword: Boolean(summary.gmailConfigured),
            senderName: 'Joshua Akintayo',
            dailyLimit: summary.dailyLimit,
          }}
        />
      )}
    </div>
  );
}
