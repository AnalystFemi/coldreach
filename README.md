# 🚀 ColdReach Engine — Automated Gmail Outreach Pipeline

A high-deliverability cold email automation pipeline and timezone scheduler designed specifically for AI Automation Agencies.

---

## ⚡ Core Capabilities

- **Automated 10/day Pipeline**: Sends a safe batch of 10 cold emails per day from `joshuaakintayo21@gmail.com` with humanized 3–7 minute randomized pacing.
- **Deep DNS MX Email Verification**: Performs real-time MX record lookups to ensure the recipient domain has active mail exchange servers, preventing bounces.
- **Global Timezone Awareness**: Dynamically detects the prospect's local timezone (US Eastern, Central, Mountain, Pacific, UK, Canada, Australia, UAE, Germany) and only dispatches when their local business window is OPEN (9:00 AM – 11:30 AM or 1:30 PM – 4:00 PM local time).
- **Automated Contact Form Submitter**: For businesses with no public email (phone & website only), it automatically submits the audit pitch through their `/contact` form directly to the owner's inbox.
- **Auto-Sync with LeadRadar**: Directly synchronizes leads scraped from your LeadRadar app or from any exported CSV.
- **Real-time Delivery Logs**: Records status, message IDs, and timestamps for every sent email.

---

## 🔑 Setup & Configuration

### 1. Generate Google App Password (60 Seconds)
1. Go to your [Google Account Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned on.
3. Click on **"App passwords"**.
4. Create an App Password named **`ColdReach Engine`** and copy the 16 characters.
5. In the ColdReach Engine dashboard, click **"Set App Password"** (or edit `.env.local`) and paste the 16 characters.

### 2. Run Locally
```bash
cd C:\Users\DELL\Downloads\coldreach-engine
npm install
npm run dev
```

Dashboard will open on **http://localhost:3001**!
