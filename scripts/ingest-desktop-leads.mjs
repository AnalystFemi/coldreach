import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

const resolveMxAsync = promisify(dns.resolveMx);

const DESKTOP_DIR = 'C:\\Users\\DELL\\Desktop\\Email list for cold emails';
const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json');

function resolveTimezone(city, country) {
  const cCity = (city || '').toLowerCase();
  const cCountry = (country || '').toLowerCase();

  if (cCountry.includes('germany') || cCountry.includes('deutschland') || cCity.includes('munich') || cCity.includes('berlin')) {
    return 'Europe/Berlin';
  }
  if (cCountry.includes('united kingdom') || cCountry.includes('uk') || cCity.includes('london')) {
    return 'Europe/London';
  }
  if (cCountry.includes('canada') || cCity.includes('toronto')) {
    return 'America/Toronto';
  }
  if (cCountry.includes('australia') || cCity.includes('sydney')) {
    return 'Australia/Sydney';
  }
  if (cCountry.includes('france') || cCity.includes('paris')) {
    return 'Europe/Paris';
  }
  if (cCountry.includes('netherlands') || cCity.includes('amsterdam')) {
    return 'Europe/Amsterdam';
  }
  if (cCountry.includes('switzerland') || cCity.includes('zurich')) {
    return 'Europe/Zurich';
  }
  return 'America/New_York';
}

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

async function verifyMX(domain) {
  try {
    const records = await resolveMxAsync(domain);
    if (records && records.length > 0) {
      records.sort((a, b) => a.priority - b.priority);
      return { valid: true, host: records[0].exchange };
    }
    return { valid: false, reason: 'No MX records' };
  } catch (err) {
    return { valid: false, reason: err.code || err.message };
  }
}

async function run() {
  console.log('📂 Scanning Apollo CSV files in:', DESKTOP_DIR);

  if (!fs.existsSync(DESKTOP_DIR)) {
    console.error('Directory does not exist!');
    return;
  }

  const files = fs.readdirSync(DESKTOP_DIR).filter(f => f.endsWith('.csv'));
  console.log(`Found ${files.length} CSV files.`);

  const rawContacts = [];
  const seenEmails = new Set();

  for (const file of files) {
    const fullPath = path.join(DESKTOP_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) continue;

    const headers = parseCSVLine(lines[0]);
    const emailIdx = headers.indexOf('Email');
    const fNameIdx = headers.indexOf('First Name');
    const lNameIdx = headers.indexOf('Last Name');
    const companyIdx = headers.indexOf('Company Name for Emails') !== -1 ? headers.indexOf('Company Name for Emails') : headers.indexOf('Company');
    const titleIdx = headers.indexOf('Title');
    const cityIdx = headers.indexOf('City');
    const countryIdx = headers.indexOf('Country');
    const websiteIdx = headers.indexOf('Website');
    const phoneIdx = headers.indexOf('Corporate Phone') !== -1 ? headers.indexOf('Corporate Phone') : headers.indexOf('First Phone');

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const email = (row[emailIdx] || '').toLowerCase().trim();

      if (!email || !email.includes('@') || seenEmails.has(email)) continue;
      seenEmails.add(email);

      rawContacts.push({
        firstName: row[fNameIdx] || 'there',
        lastName: row[lNameIdx] || '',
        company: row[companyIdx] || 'your company',
        title: row[titleIdx] || '',
        email,
        city: row[cityIdx] || '',
        country: row[countryIdx] || '',
        website: row[websiteIdx] || '',
        phone: row[phoneIdx] || '',
      });
    }
  }

  console.log(`\n🔍 Found ${rawContacts.length} unique contacts. Beginning DNS MX verification...`);

  const verifiedLeads = [];
  let invalidCount = 0;

  // Process in small batches of 10 to not overwhelm DNS
  for (let i = 0; i < rawContacts.length; i++) {
    const contact = rawContacts[i];
    const [, domain] = contact.email.split('@');

    const mxResult = await verifyMX(domain);
    if (mxResult.valid) {
      const cleanCompany = contact.company.replace(/\b(Inc\.?|LLC|Ltd\.?|Corp\.?|Group|Co\.?|GmbH)\b/gi, '').trim();
      const timezone = resolveTimezone(contact.city, contact.country);

      const pitchSubject = `quick question regarding ${cleanCompany}'s operations in ${contact.city || contact.country || 'Europe'}`;

      const pitchBody = `Hi ${contact.firstName},

As ${cleanCompany} grows, operational complexity grows with it. Leaders often spend valuable hours chasing leads, updating CRMs, following up on inquiries, and managing repetitive admin, while high-value opportunities slip through the cracks. Disconnected workflows create inefficiencies when they aren't built around how your team actually operates. This is where I come in.

I am an AI Automation & Systems Engineer helping companies build systems that automate lead management, instant missed-call response, and client follow-up operations.

I'm not looking to become another vendor on your list either. I want to become the partner you delegate to without thinking twice—the one that protects the standard, ensures no opportunity goes unanswered, and handles 30 inquiries this month or 200 when demand ramps up.

Would you be available for a quick chat this week to discuss how we can eliminate manual follow-up and streamline ${cleanCompany}'s daily operations?

Best regards,
Joshua Akintayo
AI Automation Systems Engineer

Sent from my iPhone`;

      verifiedLeads.push({
        id: `lead_apollo_${Date.now()}_${i}`,
        placeId: `apollo_${contact.email}`,
        name: `${contact.firstName} ${contact.lastName} (${cleanCompany})`.trim(),
        city: contact.city || '',
        country: contact.country || '',
        timezone,
        email: contact.email,
        phone: contact.phone || '',
        website: contact.website || '',
        rating: 5,
        userRatingsTotal: 1,
        emailVerified: true,
        mxValid: true,
        mxHost: mxResult.host,
        channel: 'email',
        status: 'queued',
        pitchSubject,
        pitchBody,
        serviceAngle: 'AI Operations & CRM Automation',
        createdAt: new Date().toISOString(),
      });

      process.stdout.write(`✅ [${i + 1}/${rawContacts.length}] Verified: ${contact.email} (${mxResult.host})\n`);
    } else {
      invalidCount++;
      process.stdout.write(`❌ [${i + 1}/${rawContacts.length}] Dead domain/MX: ${contact.email} (${mxResult.reason})\n`);
    }
  }

  console.log(`\n📊 Verification Complete!`);
  console.log(`✅ Valid Active Leads: ${verifiedLeads.length}`);
  console.log(`❌ Dead/Invalid Leads: ${invalidCount}`);

  // Merge into ColdReach Engine leads.json
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  let existingLeads = [];
  if (fs.existsSync(LEADS_FILE)) {
    try {
      existingLeads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    } catch {}
  }

  const existingEmails = new Set(existingLeads.map(l => (l.email || '').toLowerCase()));
  const freshLeads = verifiedLeads.filter(l => !existingEmails.has(l.email.toLowerCase()));

  const updatedLeads = [...existingLeads, ...freshLeads];
  fs.writeFileSync(LEADS_FILE, JSON.stringify(updatedLeads, null, 2));

  console.log(`💾 Added ${freshLeads.length} new verified leads into ColdReach Engine database.`);
  console.log(`🎯 Total Leads in ColdReach Queue: ${updatedLeads.length}`);
}

run().catch(console.error);
