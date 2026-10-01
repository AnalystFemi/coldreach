import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const resolveMxAsync = promisify(dns.resolveMx);

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBTJnugTXqeW_7EERuLLsGAyYjQyxXJPKE';
const TARGET_TOTAL = 1000;
const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json');
const CSV_FILE = path.join(process.cwd(), 'data', '1000_qualified_leads_october.csv');

// Query Matrix: Top Wealth Markets & High-Ticket Local Niches
const TARGET_QUERIES = [
  // US High Growth Markets
  { query: 'HVAC contractors in Dallas, TX', city: 'Dallas', country: 'United States' },
  { query: 'Roofing companies in Dallas, TX', city: 'Dallas', country: 'United States' },
  { query: 'Dental clinics in Houston, TX', city: 'Houston', country: 'United States' },
  { query: 'Plumbing services in Houston, TX', city: 'Houston', country: 'United States' },
  { query: 'MedSpas in Miami, FL', city: 'Miami', country: 'United States' },
  { query: 'Roofing contractors in Miami, FL', city: 'Miami', country: 'United States' },
  { query: 'Personal injury lawyers in Atlanta, GA', city: 'Atlanta', country: 'United States' },
  { query: 'HVAC repair in Atlanta, GA', city: 'Atlanta', country: 'United States' },
  { query: 'Cosmetic dentists in Austin, TX', city: 'Austin', country: 'United States' },
  { query: 'Solar panel installers in Phoenix, AZ', city: 'Phoenix', country: 'United States' },
  { query: 'Emergency plumbers in Chicago, IL', city: 'Chicago', country: 'United States' },
  { query: 'Real estate agencies in Los Angeles, CA', city: 'Los Angeles', country: 'United States' },
  { query: 'MedSpas in Scottsdale, AZ', city: 'Scottsdale', country: 'United States' },
  { query: 'HVAC contractors in Denver, CO', city: 'Denver', country: 'United States' },
  { query: 'Roofing repair in Charlotte, NC', city: 'Charlotte', country: 'United States' },
  { query: 'Auto detailing collision in Las Vegas, NV', city: 'Las Vegas', country: 'United States' },
  { query: 'Dental clinics in Tampa, FL', city: 'Tampa', country: 'United States' },
  { query: 'Plumbing contractors in San Diego, CA', city: 'San Diego', country: 'United States' },
  { query: 'Commercial roofing in Nashville, TN', city: 'Nashville', country: 'United States' },

  // Canada
  { query: 'Dental clinics in Toronto', city: 'Toronto', country: 'Canada' },
  { query: 'HVAC companies in Toronto', city: 'Toronto', country: 'Canada' },
  { query: 'Roofing contractors in Calgary', city: 'Calgary', country: 'Canada' },
  { query: 'MedSpas in Vancouver', city: 'Vancouver', country: 'Canada' },

  // UK
  { query: 'Aesthetic clinics in London', city: 'London', country: 'United Kingdom' },
  { query: 'Dental practices in London', city: 'London', country: 'United Kingdom' },
  { query: 'Commercial property agents in Manchester', city: 'Manchester', country: 'United Kingdom' },
  { query: 'Roofing contractors in Birmingham', city: 'Birmingham', country: 'United Kingdom' },

  // Australia
  { query: 'Dental clinics in Sydney', city: 'Sydney', country: 'Australia' },
  { query: 'Plumbing services in Melbourne', city: 'Melbourne', country: 'Australia' },
  { query: 'Solar installers in Brisbane', city: 'Brisbane', country: 'Australia' },

  // UAE
  { query: 'Aesthetic clinic in Dubai', city: 'Dubai', country: 'United Arab Emirates' },
  { query: 'Dental clinic in Dubai', city: 'Dubai', country: 'United Arab Emirates' },
  { query: 'Real estate brokers in Dubai', city: 'Dubai', country: 'United Arab Emirates' },

  // Germany
  { query: 'Zahnarzt in Munich', city: 'Munich', country: 'Germany' },
  { query: 'Immobilienmakler in Berlin', city: 'Berlin', country: 'Germany' },
  { query: 'Zahnarzt in Frankfurt', city: 'Frankfurt', country: 'Germany' },
];

function resolveTimezone(city, country) {
  const cCity = (city || '').toLowerCase();
  const cCountry = (country || '').toLowerCase();

  if (cCountry.includes('united kingdom') || cCountry.includes('uk') || cCity.includes('london') || cCity.includes('manchester') || cCity.includes('birmingham')) {
    return 'Europe/London';
  }
  if (cCountry.includes('united arab emirates') || cCountry.includes('uae') || cCity.includes('dubai')) {
    return 'Asia/Dubai';
  }
  if (cCountry.includes('australia') || cCity.includes('sydney') || cCity.includes('melbourne') || cCity.includes('brisbane')) {
    return 'Australia/Sydney';
  }
  if (cCountry.includes('canada')) {
    if (cCity.includes('vancouver')) return 'America/Vancouver';
    if (cCity.includes('calgary')) return 'America/Edmonton';
    return 'America/Toronto';
  }
  if (cCountry.includes('germany') || cCity.includes('munich') || cCity.includes('berlin') || cCity.includes('frankfurt')) {
    return 'Europe/Berlin';
  }
  if (cCity.includes('los angeles') || cCity.includes('san diego') || cCity.includes('las vegas')) {
    return 'America/Los_Angeles';
  }
  if (cCity.includes('denver') || cCity.includes('phoenix') || cCity.includes('scottsdale')) {
    return 'America/Denver';
  }
  if (cCity.includes('dallas') || cCity.includes('houston') || cCity.includes('austin') || cCity.includes('chicago') || cCity.includes('nashville')) {
    return 'America/Chicago';
  }
  return 'America/New_York';
}

const JUNK_DOMAINS = ['example.com', 'domain.com', 'sentry.io', 'wixpress.com', 'cloudflare.com', 'schema.org', 'wordpress.org', 'gravatar.com', 'googleapis.com'];
const JUNK_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.css', '.js'];

function cleanEmail(raw) {
  if (!raw) return null;
  const e = raw.trim().toLowerCase().replace(/^mailto:/, '');
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e)) return null;
  if (JUNK_EXT.some(ext => e.endsWith(ext))) return null;
  const [, dom] = e.split('@');
  if (!dom || JUNK_DOMAINS.some(j => dom.includes(j))) return null;
  return e;
}

async function verifyMX(domain) {
  try {
    const mx = await resolveMxAsync(domain);
    if (mx && mx.length > 0) {
      mx.sort((a, b) => a.priority - b.priority);
      return { valid: true, host: mx[0].exchange };
    }
    return { valid: false, reason: 'No MX records' };
  } catch (err) {
    return { valid: false, reason: err.code || err.message };
  }
}

async function scrapeEmails(websiteUrl) {
  if (!websiteUrl || !websiteUrl.startsWith('http')) return null;
  const found = new Set();
  const parsed = new URL(websiteUrl);
  const base = `${parsed.protocol}//${parsed.host}`;
  const pages = [websiteUrl, `${base}/contact`, `${base}/contact-us`];

  for (const u of pages) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 4500);
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: c.signal,
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href');
        const em = cleanEmail(href);
        if (em) found.add(em);
      });

      const matches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (matches) {
        matches.forEach(m => {
          const em = cleanEmail(m);
          if (em) found.add(em);
        });
      }
      if (found.size > 0) break;
    } catch {}
  }

  const list = Array.from(found);
  if (list.length === 0) return null;
  const pref = list.find(e => /^(contact|info|hello|office|booking|admin|sales|team)@/.test(e));
  return pref || list[0];
}

async function harvest() {
  console.log(`🚀 Starting Automated Lead Generation Engine`);
  console.log(`🎯 Target: ${TARGET_TOTAL} concrete qualified leads for October outreach (34 emails/day)`);
  console.log(`🔑 Using Google Places API Key: ${API_KEY.slice(0, 10)}...`);

  const seenIds = new Set();
  const leads = [];

  // Load existing leads if any
  if (fs.existsSync(LEADS_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
      existing.forEach(l => {
        if (l.placeId) seenIds.add(l.placeId);
        leads.push(l);
      });
      console.log(`Existing leads in database: ${leads.length}`);
    } catch {}
  }

  for (const item of TARGET_QUERIES) {
    if (leads.length >= TARGET_TOTAL) break;

    console.log(`\n🔎 Querying: "${item.query}" (Current leads: ${leads.length}/${TARGET_TOTAL})`);
    let pageToken = null;
    let pageCount = 0;

    do {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(item.query)}&key=${API_KEY}`;
      if (pageToken) {
        url += `&pagetoken=${encodeURIComponent(pageToken)}`;
      }

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.warn(`Places status: ${data.status} ${data.error_message || ''}`);
          break;
        }

        const results = data.results || [];
        pageToken = data.next_page_token || null;

        for (const place of results) {
          if (leads.length >= TARGET_TOTAL) break;
          if (seenIds.has(place.place_id)) continue;
          seenIds.add(place.place_id);

          // Get Place Details
          const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,website,formatted_phone_number,international_phone_number,rating,user_ratings_total,formatted_address,url,business_status&key=${API_KEY}`;
          
          let det = {};
          try {
            const detRes = await fetch(detUrl);
            const detData = await detRes.json();
            if (detData.result) det = detData.result;
          } catch {}

          const name = det.name || place.name || 'Business';
          const website = det.website || '';
          const phone = det.international_phone_number || det.formatted_phone_number || '';
          const rating = det.rating || place.rating || 4.5;
          const reviews = det.user_ratings_total || place.user_ratings_total || 10;
          const address = det.formatted_address || place.formatted_address || '';
          const mapsUrl = det.url || `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + address)}`;

          if (!website && !phone) continue; // Must have at least website or phone

          // Email extraction & MX verification
          let email = null;
          let emailVerified = false;
          let mxValid = false;
          let mxHost = null;

          if (website) {
            email = await scrapeEmails(website);
            if (email) {
              const [, dom] = email.split('@');
              const mx = await verifyMX(dom);
              if (mx.valid) {
                emailVerified = true;
                mxValid = true;
                mxHost = mx.host;
              } else {
                email = null; // discard dead emails
              }
            }
          }

          const channel = email ? 'email' : website ? 'contact_form' : 'whatsapp';
          const cleanName = name.replace(/\b(Inc\.?|LLC|Ltd\.?|Corp\.?|Group|Co\.?|GmbH)\b/gi, '').trim();
          const timezone = resolveTimezone(item.city, item.country);

          const pitchSubject = `quick question regarding ${cleanName}'s operations in ${item.city}`;
          const pitchBody = `Hello there,

As ${cleanName} grows, operational complexity grows with it. Teams often spend valuable hours chasing leads, updating CRMs, following up on inquiries, and managing repetitive admin, while high-value opportunities slip through the cracks. Disconnected workflows create inefficiencies when they aren't built around how your team actually operates. This is where I come in.

I am an AI Automation & Systems Engineer helping ${item.city} businesses build systems that automate lead management, instant missed-call text-back, and client follow-up operations.

I'm not looking to become another vendor on your list either. I want to become the partner you delegate to without thinking twice—the one that protects the standard, ensures no lead goes unanswered, and handles 30 inquiries this month or 200 when demand ramps up.

Would you be available for a quick chat this week to discuss how we can eliminate manual follow-up and streamline ${cleanName}'s daily operations?

Best regards,
Joshua Akintayo
AI Automation Systems Engineer

Sent from my iPhone`;

          const lead = {
            id: `lead_harv_${Date.now()}_${leads.length}`,
            placeId: place.place_id,
            name: `${name}`,
            city: item.city,
            country: item.country,
            timezone,
            email,
            phone,
            website,
            rating,
            userRatingsTotal: reviews,
            emailVerified,
            mxValid,
            mxHost,
            channel,
            status: 'queued',
            pitchSubject,
            pitchBody,
            serviceAngle: 'AI Operations & Lead Automation',
            createdAt: new Date().toISOString(),
          };

          leads.push(lead);
          process.stdout.write(`\r[${leads.length}/${TARGET_TOTAL}] ${channel.toUpperCase()}: ${name} (${item.city})               `);
        }

        pageCount++;
        if (pageToken && pageCount < 3 && leads.length < TARGET_TOTAL) {
          // Google requires ~2s pause before next_page_token becomes valid
          await new Promise(r => setTimeout(r, 2200));
        } else {
          pageToken = null;
        }
      } catch (err) {
        console.error('Error fetching places:', err.message);
        break;
      }
    } while (pageToken && leads.length < TARGET_TOTAL);

    // Save progress periodically
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  }

  console.log(`\n\n🎉 Finished! Harvested total of ${leads.length} qualified leads.`);

  // Export to CSV
  const csvHeaders = ['ID', 'Business Name', 'City', 'Country', 'Timezone', 'Channel', 'Email', 'MX Host', 'Phone', 'Website', 'Rating', 'Reviews', 'Pitch Subject', 'Status'];
  const csvRows = leads.map(l => [
    `"${l.id}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${l.city}"`,
    `"${l.country}"`,
    `"${l.timezone}"`,
    `"${l.channel}"`,
    `"${l.email || ''}"`,
    `"${l.mxHost || ''}"`,
    `"${l.phone || ''}"`,
    `"${l.website || ''}"`,
    `"${l.rating}"`,
    `"${l.userRatingsTotal}"`,
    `"${(l.pitchSubject || '').replace(/"/g, '""')}"`,
    `"${l.status}"`,
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(CSV_FILE, csvContent, 'utf-8');

  console.log(`💾 Saved complete database to: ${LEADS_FILE}`);
  console.log(`📊 Exported clean CSV to: ${CSV_FILE}`);
}

harvest().catch(console.error);
