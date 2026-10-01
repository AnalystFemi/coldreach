import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json({
    gmailUser: process.env.GMAIL_USER || 'joshuaakintayo21@gmail.com',
    hasPassword: Boolean(process.env.GMAIL_APP_PASSWORD),
    senderName: process.env.SENDER_NAME || 'Joshua Akintayo',
    dailyLimit: Number(process.env.DAILY_EMAIL_LIMIT || 10),
  });
}

export async function POST(req: Request) {
  try {
    const { appPassword, senderName, dailyLimit } = await req.json();
    const envPath = path.join(process.cwd(), '.env.local');

    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    if (appPassword) {
      process.env.GMAIL_APP_PASSWORD = appPassword.replace(/\s+/g, '');
      if (content.includes('GMAIL_APP_PASSWORD=')) {
        content = content.replace(/GMAIL_APP_PASSWORD=.*/g, `GMAIL_APP_PASSWORD=${appPassword}`);
      } else {
        content += `\nGMAIL_APP_PASSWORD=${appPassword}`;
      }
    }

    if (senderName) {
      process.env.SENDER_NAME = senderName;
      if (content.includes('SENDER_NAME=')) {
        content = content.replace(/SENDER_NAME=.*/g, `SENDER_NAME=${senderName}`);
      } else {
        content += `\nSENDER_NAME=${senderName}`;
      }
    }

    if (dailyLimit) {
      process.env.DAILY_EMAIL_LIMIT = String(dailyLimit);
      if (content.includes('DAILY_EMAIL_LIMIT=')) {
        content = content.replace(/DAILY_EMAIL_LIMIT=.*/g, `DAILY_EMAIL_LIMIT=${dailyLimit}`);
      } else {
        content += `\nDAILY_EMAIL_LIMIT=${dailyLimit}`;
      }
    }

    fs.writeFileSync(envPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
