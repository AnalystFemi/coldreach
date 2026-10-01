import { NextResponse } from 'next/server';
import {
  getLeads,
  getLogs,
  getCampaignState,
} from '@/lib/storage';
import { checkTimezoneSendWindow } from '@/lib/timezone';
import { TimezoneInfo } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = getLeads();
    const logs = getLogs();
    const state = getCampaignState();
    const dailyLimit = Number(process.env.DAILY_EMAIL_LIMIT || 10);

    const sentToday = state.sentToday || 0;
    const remainingToday = Math.max(0, dailyLimit - sentToday);
    const totalQueued = leads.filter((l) => l.status === 'queued').length;
    const totalSentAllTime = leads.filter((l) => l.status === 'sent').length;
    const formsSubmittedAllTime = leads.filter(
      (l) => l.status === 'form_submitted'
    ).length;

    // Aggregate timezone regions
    const tzMap: Record<string, { region: string; leads: number }> = {
      'America/New_York': { region: 'US East (EST/EDT)', leads: 0 },
      'America/Chicago': { region: 'US Central (CST/CDT)', leads: 0 },
      'America/Denver': { region: 'US Mountain (MST/MDT)', leads: 0 },
      'America/Los_Angeles': { region: 'US Pacific (PST/PDT)', leads: 0 },
      'Europe/London': { region: 'United Kingdom (GMT/BST)', leads: 0 },
      'America/Toronto': { region: 'Canada (EST)', leads: 0 },
      'Australia/Sydney': { region: 'Australia (AEST)', leads: 0 },
      'Asia/Dubai': { region: 'UAE (GST)', leads: 0 },
      'Europe/Berlin': { region: 'Germany / Europe (CET)', leads: 0 },
    };

    leads.forEach((lead) => {
      if (tzMap[lead.timezone]) {
        tzMap[lead.timezone].leads++;
      }
    });

    const activeTimezones: TimezoneInfo[] = Object.entries(tzMap).map(
      ([iana, info]) => {
        const check = checkTimezoneSendWindow(iana);
        return {
          name: iana,
          region: info.region,
          iana,
          currentTime: check.localTimeFormatted,
          isBusinessHours: check.isInSendWindow,
          leadCount: info.leads,
        };
      }
    );

    return NextResponse.json({
      success: true,
      summary: {
        dailyLimit,
        sentToday,
        remainingToday,
        totalQueued,
        totalSentAllTime,
        formsSubmittedAllTime,
        activeTimezones,
        isSendingActive: state.isSendingActive,
        gmailConfigured: Boolean(process.env.GMAIL_APP_PASSWORD),
        gmailUser: process.env.GMAIL_USER || 'joshuaakintayo21@gmail.com',
      },
      leads,
      logs: logs.slice(0, 50),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
