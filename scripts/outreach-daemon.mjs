import fs from 'fs';
import path from 'path';
import { dispatchNextEligibleLead } from '../src/lib/scheduler.js';

// Load .env.local if present (zero-dependency parser)
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  try {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

const CAMPAIGN_FILE = path.join(process.cwd(), 'data', 'campaign.json');

function getCampaignState() {
  try {
    const data = JSON.parse(fs.readFileSync(CAMPAIGN_FILE, 'utf-8'));
    const today = new Date().toISOString().slice(0, 10);
    if (data.lastResetDate !== today) {
      data.sentToday = 0;
      data.lastResetDate = today;
      fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch {
    return { sentToday: 0, lastResetDate: new Date().toISOString().slice(0, 10) };
  }
}

function getRandomDelay(minMinutes = 3, maxMinutes = 7) {
  const minMs = minMinutes * 60 * 1000;
  const maxMs = maxMinutes * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

async function runDaemon() {
  console.log('🤖 ====================================================');
  console.log('🚀 ColdReach Engine — Autonomous Background Outreach Daemon');
  console.log('📬 Sender: joshuaakintayo21@gmail.com');
  console.log('📅 Campaign Window: October 2, 2026 – October 31, 2026');
  console.log('🎯 Cadence: 34 emails/day (1,000 leads / 30 days)');
  console.log('⏱️ Pacing: 3 to 7 minutes randomized delay between sends');
  console.log('🌍 Timezone Gating: 9:00 - 11:30 AM & 1:30 - 4:00 PM local');
  console.log('====================================================\n');

  while (true) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentDay = now.getDate();
      const currentYear = now.getFullYear();

      // Campaign check: October 2 to October 31
      // (If running before Oct 2, wait until Oct 2 00:00:00)
      const isOctober = currentMonth === 10;
      const isBeforeCampaign = isOctober && currentDay < 2;
      const isAfterCampaign = (currentMonth > 10 && currentYear >= 2026) || (isOctober && currentDay > 31);

      if (isBeforeCampaign) {
        console.log(`⏳ Campaign scheduled to start tomorrow, October 2nd. Standing by... (Checked at ${now.toLocaleTimeString()})`);
        await new Promise((r) => setTimeout(r, 60000 * 15)); // check every 15 mins
        continue;
      }

      if (isAfterCampaign) {
        console.log('🏁 October campaign concluded! All scheduled batches completed.');
        break;
      }

      // Check daily quota
      const state = getCampaignState();
      const dailyLimit = Number(process.env.DAILY_EMAIL_LIMIT || 34);

      if (state.sentToday >= dailyLimit) {
        console.log(`✅ Daily quota completed: ${state.sentToday}/${dailyLimit} sent today. Next batch runs tomorrow.`);
        // Sleep for 30 minutes before checking for midnight reset
        await new Promise((r) => setTimeout(r, 60000 * 30));
        continue;
      }

      // Try to dispatch next lead whose local timezone is in active business window
      console.log(`\n🔍 Checking queue for leads currently in business hours... (${state.sentToday}/${dailyLimit} sent today)`);
      const result = await dispatchNextEligibleLead();

      if (result.dispatched) {
        console.log(`🎉 [SENT ${state.sentToday + 1}/${dailyLimit}] ${result.message}`);
        
        // Wait random human delay of 3 to 7 minutes
        const delayMs = getRandomDelay(
          Number(process.env.MIN_DELAY_MINUTES || 3),
          Number(process.env.MAX_DELAY_MINUTES || 7)
        );
        const delayMins = (delayMs / 60000).toFixed(1);
        console.log(`⏳ Humanized delay: waiting ${delayMins} minutes before next send to protect Gmail sender score...\n`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.log(`⏸️ ${result.message}`);
        // If outside business hours or no lead ready, wait 5 minutes
        console.log(`⏱️ Next check in 5 minutes...\n`);
        await new Promise((r) => setTimeout(r, 60000 * 5));
      }
    } catch (err) {
      console.error('Daemon iteration error:', err?.message || err);
      await new Promise((r) => setTimeout(r, 60000 * 2));
    }
  }
}

runDaemon().catch(console.error);
