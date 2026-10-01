import fs from 'fs';
import path from 'path';
import { CampaignLead, DeliveryLog } from '@/types';
import { resolveTimezone, checkTimezoneSendWindow } from './timezone';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const CAMPAIGN_FILE = path.join(DATA_DIR, 'campaign.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(CAMPAIGN_FILE)) {
    fs.writeFileSync(
      CAMPAIGN_FILE,
      JSON.stringify({
        sentToday: 0,
        lastResetDate: new Date().toISOString().slice(0, 10),
        isSendingActive: false,
      })
    );
  }
}

export function getCampaignState(): {
  sentToday: number;
  lastResetDate: string;
  isSendingActive: boolean;
} {
  ensureDataDir();
  try {
    const data = JSON.parse(fs.readFileSync(CAMPAIGN_FILE, 'utf-8'));
    const today = new Date().toISOString().slice(0, 10);
    if (data.lastResetDate !== today) {
      data.sentToday = 0;
      data.lastResetDate = today;
      saveCampaignState(data);
    }
    return data;
  } catch {
    return {
      sentToday: 0,
      lastResetDate: new Date().toISOString().slice(0, 10),
      isSendingActive: false,
    };
  }
}

export function saveCampaignState(state: any): void {
  ensureDataDir();
  fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(state, null, 2));
}

export function getLeads(): CampaignLead[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    const leads: CampaignLead[] = JSON.parse(raw);
    
    // Refresh timezone windows
    return leads.map((lead) => {
      const tzInfo = checkTimezoneSendWindow(lead.timezone);
      return {
        ...lead,
        localTime: tzInfo.localTimeFormatted,
        isInSendWindow: tzInfo.isInSendWindow,
      };
    });
  } catch {
    return [];
  }
}

export function saveLeads(leads: CampaignLead[]): void {
  ensureDataDir();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

export function getLogs(): DeliveryLog[] {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function addLog(log: DeliveryLog): void {
  ensureDataDir();
  const logs = getLogs();
  logs.unshift(log);
  // Keep last 1,000 logs
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 1000), null, 2));
}

export function importLeadsFromObjects(rawLeads: any[]): { added: number; total: number } {
  const currentLeads = getLeads();
  const existingKeys = new Set(
    currentLeads.map((l) => `${l.name.toLowerCase()}_${l.city.toLowerCase()}`)
  );

  let addedCount = 0;

  const newLeads: CampaignLead[] = rawLeads
    .map((item, idx) => {
      const name = item.name || item.BusinessName || 'Business';
      const city = item.city || item.City || '';
      const country = item.country || item.Country || 'United States';
      const key = `${name.toLowerCase()}_${city.toLowerCase()}`;

      if (existingKeys.has(key)) return null;
      existingKeys.add(key);

      const email = item.email || item.PrimaryEmail || item.Email || null;
      const phone = item.internationalPhone || item.phone || item.Phone || '';
      const website = item.website || item.Website || '';
      const rating = Number(item.rating || item.Rating || 0);
      const userRatingsTotal = Number(item.userRatingsTotal || item.ReviewCount || 0);
      const timezone = resolveTimezone(city, country);
      const tzInfo = checkTimezoneSendWindow(timezone);

      const cleanName = name.replace(/\b(Inc\.?|LLC|Ltd\.?|Corp\.?|Group|Co\.?)\b/gi, '').trim();

      const pitchSubject =
        item.pitch?.emailSubject ||
        item.PitchSubject ||
        `quick question regarding ${cleanName}'s operations in ${city}`;

      const pitchBody =
        item.pitch?.emailBody ||
        item.PitchBody ||
        `Hello there,

As ${cleanName} grows, operational complexity grows with it. Teams often spend valuable hours chasing leads, updating CRMs, following up on inquiries, and managing repetitive admin, while high-value opportunities slip through the cracks. Even with tools in place, disconnected workflows create inefficiencies when they aren't built around how your team actually operates. This is where I come in.

I am an AI Automation & Systems Engineer helping ${city} businesses build systems that automate lead management, instant missed-call text-back, and client follow-up operations.

I'm not looking to become another vendor on your list either. I want to become the partner you delegate to without thinking twice—the one that protects the standard, ensures no lead goes unanswered, and handles 30 inquiries this month or 200 when demand ramps up.

Would you be available for a quick chat this week to discuss how we can eliminate manual follow-up and streamline ${cleanName}'s daily operations?

Best regards,
Joshua Akintayo
AI Automation Systems Engineer

Sent from my iPhone`;

      const channel = email ? 'email' : website ? 'contact_form' : 'whatsapp';

      addedCount++;

      const lead: CampaignLead = {
        id: `lead_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        placeId: item.placeId || item.id || `pl_${idx}`,
        name,
        city,
        country,
        timezone,
        localTime: tzInfo.localTimeFormatted,
        isInSendWindow: tzInfo.isInSendWindow,
        email,
        phone,
        website,
        rating,
        userRatingsTotal,
        emailVerified: null,
        mxValid: null,
        channel,
        status: 'queued',
        pitchSubject,
        pitchBody,
        serviceAngle: item.recommendedService || 'AI Receptionist',
        createdAt: new Date().toISOString(),
      };

      return lead;
    })
    .filter(Boolean) as CampaignLead[];

  const combined = [...currentLeads, ...newLeads];
  saveLeads(combined);

  return { added: addedCount, total: combined.length };
}

// Auto-sync from LeadRadar directory if available
export function syncFromLeadRadar(): { added: number; total: number } {
  const radarDir = 'C:\\Users\\DELL\\Downloads\\lead-radar';
  let importedCount = 0;

  // Check if any export CSV exists in Downloads
  const downloadsDir = 'C:\\Users\\DELL\\Downloads';
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir);
    const csvFiles = files.filter((f) => f.startsWith('lead-radar-export-') && f.endsWith('.csv'));

    if (csvFiles.length > 0) {
      // Pick the latest CSV
      csvFiles.sort().reverse();
      const csvPath = path.join(downloadsDir, csvFiles[0]);
      try {
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
          const rows = lines.slice(1).map((line) => {
            // Regex parse CSV line respecting quotes
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const obj: any = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] ? values[i].replace(/^"|"$/g, '').replace(/""/g, '"') : '';
            });
            return obj;
          });
          const res = importLeadsFromObjects(rows);
          importedCount += res.added;
        }
      } catch {
        // ignore
      }
    }
  }

  return { added: importedCount, total: getLeads().length };
}
