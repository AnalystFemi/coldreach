import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

const resolveMxAsync = promisify(dns.resolveMx);

// Load .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const GMAIL_USER = process.env.GMAIL_USER || 'joshuaakintayo21@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'nneqmxgopvucrlfu').replace(/\s+/g, '');
const SENDER_NAME = process.env.SENDER_NAME || 'Joshua Akintayo';
const DAILY_LIMIT = Number(process.env.DAILY_EMAIL_LIMIT || 34);

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const CAMPAIGN_FILE = path.join(DATA_DIR, 'campaign.json');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

function getCampaignState() {
  try {
    const data = JSON.parse(fs.readFileSync(CAMPAIGN_FILE, 'utf-8'));
    const today = new Date().toISOString().slice(0, 10);
    if (data.lastResetDate !== today) {
      data.sentToday = 0;
      data.sentBatch = [];
      data.lastResetDate = today;
      fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch {
    return {
      sentToday: 0,
      sentBatch: [],
      lastResetDate: new Date().toISOString().slice(0, 10),
    };
  }
}

function saveCampaignState(state) {
  fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(state, null, 2));
}

function getLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

function addLog(log) {
  try {
    const logs = fs.existsSync(LOGS_FILE)
      ? JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'))
      : [];
    logs.unshift(log);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 1000), null, 2));
  } catch {}
}

const JUNK_DOMAINS = ['example.com', 'domain.com', 'sentry.io', 'wixpress.com', 'cloudflare.com'];

async function verifyEmail(email) {
  if (!email || !email.includes('@')) return { valid: false, reason: 'Malformed syntax' };
  const [, domain] = email.trim().toLowerCase().split('@');
  if (!domain || JUNK_DOMAINS.some(j => domain.includes(j))) {
    return { valid: false, reason: 'Blocked junk domain' };
  }
  try {
    const mx = await resolveMxAsync(domain);
    if (!mx || mx.length === 0) return { valid: false, reason: 'No MX records' };
    mx.sort((a, b) => a.priority - b.priority);
    return { valid: true, host: mx[0].exchange };
  } catch (err) {
    return { valid: false, reason: err.code || err.message };
  }
}

async function sendDailyReportEmail(sentBatch, totalSentToday, dailyLimit, skippedCount) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const subject = `📊 ColdReach Daily Report: ${totalSentToday}/${dailyLimit} Emails Sent (${today})`;

  const tableRows = sentBatch
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${idx + 1}. ${item.businessName}</td>
        <td style="padding: 10px 8px; font-family: monospace; color: #059669;">${item.email}</td>
        <td style="padding: 10px 8px; color: #475569;">${item.city}</td>
        <td style="padding: 10px 8px; color: #64748b; font-size: 12px;">${item.subject}</td>
        <td style="padding: 10px 8px; font-mono; color: #64748b; font-size: 11px;">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 20px;">ColdReach Engine — Daily Dispatch Report</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Automated pipeline report for <strong>${today}</strong></p>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #166534;">Delivered Today</div>
          <div style="font-size: 24px; font-weight: 700; color: #15803d; margin-top: 2px;">${totalSentToday} / ${dailyLimit}</div>
        </div>
        <div style="flex: 1; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #475569;">Dead MX Skipped</div>
          <div style="font-size: 24px; font-weight: 700; color: #64748b; margin-top: 2px;">${skippedCount}</div>
        </div>
        <div style="flex: 1; padding: 14px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #3730a3;">October Goal</div>
          <div style="font-size: 24px; font-weight: 700; color: #4f46e5; margin-top: 2px;">1,000 Leads</div>
        </div>
      </div>

      <h3 style="font-size: 14px; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Businesses Contacted in Today's Batch</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 8px;">Business</th>
            <th style="padding: 8px;">Recipient</th>
            <th style="padding: 8px;">City</th>
            <th style="padding: 8px;">Pitch Subject</th>
            <th style="padding: 8px;">Time</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Sent automatically from your ColdReach Engine background scheduler.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ColdReach Reporter" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject,
      html,
    });
    console.log(`📧 Executive daily report sent successfully to ${GMAIL_USER}!`);
  } catch (err) {
    console.error('Failed to send daily report email:', err.message);
  }
}

async function run() {
  console.log('🚀 Running ColdReach Automated Outreach Batch...');
  console.log(`📬 Sender: ${GMAIL_USER}`);
  console.log(`🎯 Daily Goal: ${DAILY_LIMIT} cold emails`);

  const state = getCampaignState();
  const leads = getLeads();

  if (state.sentToday >= DAILY_LIMIT) {
    console.log(`✅ Daily quota of ${DAILY_LIMIT} already reached for today (${state.sentToday}/${DAILY_LIMIT}).`);
    return;
  }

  const remainingToSend = DAILY_LIMIT - state.sentToday;
  console.log(`📋 Need to send: ${remainingToSend} emails in this execution.\n`);

  let sentCount = 0;
  let skippedCount = 0;
  const sentBatch = state.sentBatch || [];

  for (let i = 0; i < leads.length; i++) {
    if (state.sentToday >= DAILY_LIMIT) break;
    const lead = leads[i];

    if (lead.status !== 'queued') continue;

    // Verify MX if not verified yet
    if (lead.channel === 'email' && lead.email) {
      if (!lead.emailVerified) {
        const mx = await verifyEmail(lead.email);
        lead.emailVerified = mx.valid;
        lead.mxValid = mx.valid;
        lead.mxHost = mx.host || null;

        if (!mx.valid) {
          console.log(`⚠️ Skipping dead email: ${lead.email} (${mx.reason})`);
          lead.status = 'bounced';
          lead.error = mx.reason;
          skippedCount++;
          continue; // DO NOT increment sentToday, find next valid lead!
        }
      }

      // Send cold email
      try {
        const htmlBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b;">
            ${lead.pitchBody
              .split('\n\n')
              .map((p) => `<p style="margin-bottom: 16px;">${p.replace(/\n/g, '<br/>')}</p>`)
              .join('')}
          </div>
        `;

        const info = await transporter.sendMail({
          from: `"${SENDER_NAME}" <${GMAIL_USER}>`,
          to: lead.email,
          subject: lead.pitchSubject,
          text: lead.pitchBody,
          html: htmlBody,
          replyTo: GMAIL_USER,
        });

        lead.status = 'sent';
        lead.sentAt = new Date().toISOString();
        lead.error = null;

        state.sentToday += 1;
        sentCount++;

        const batchItem = {
          businessName: lead.name,
          email: lead.email,
          city: lead.city,
          subject: lead.pitchSubject,
          timestamp: new Date().toISOString(),
          messageId: info.messageId,
        };
        sentBatch.push(batchItem);

        addLog({
          id: `log_${Date.now()}`,
          leadId: lead.id,
          businessName: lead.name,
          recipient: lead.email,
          channel: 'email',
          status: 'success',
          timestamp: new Date().toISOString(),
          subject: lead.pitchSubject,
          notes: `Delivered via Gmail SMTP (MessageId: ${info.messageId})`,
        });

        console.log(`✅ [${state.sentToday}/${DAILY_LIMIT}] Sent to: ${lead.name} (${lead.email})`);

        // Small delay between sends in CI
        await new Promise((r) => setTimeout(r, 4000));
      } catch (err) {
        console.error(`❌ SMTP Failed for ${lead.email}:`, err.message);
        lead.status = 'failed';
        lead.error = err.message;
        skippedCount++;
        // Do not increment sentToday; continue to next lead!
      }
    }
  }

  state.sentBatch = sentBatch;
  saveCampaignState(state);
  saveLeads(leads);

  console.log(`\n🎉 Batch execution complete! Sent ${sentCount} emails. Total today: ${state.sentToday}/${DAILY_LIMIT}.`);

  // Send Daily Executive Report Email
  if (sentBatch.length > 0) {
    console.log(`📨 Generating and sending daily executive report to ${GMAIL_USER}...`);
    await sendDailyReportEmail(sentBatch, state.sentToday, DAILY_LIMIT, skippedCount);
  }
}

run().catch(console.error);
