import nodemailer from 'nodemailer';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendColdEmail({
  to,
  subject,
  body,
  recipientName,
}: {
  to: string;
  subject: string;
  body: string;
  recipientName: string;
}): Promise<SendMailResult> {
  const user = process.env.GMAIL_USER || 'joshuaakintayo21@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;
  const senderName = process.env.SENDER_NAME || 'Joshua Akintayo';

  if (!pass) {
    return {
      success: false,
      error: 'GMAIL_APP_PASSWORD is not configured in .env.local. Please generate an App Password in your Google Account security settings.',
    };
  }

  // Clean pass (remove spaces if user pasted "abcd efgh ijkl mnop")
  const cleanPass = pass.replace(/\s+/g, '');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: cleanPass,
      },
    });

    // Simple plain text + clean HTML version with proper paragraph spacing
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b;">
        ${body
          .split('\n\n')
          .map((p) => `<p style="margin-bottom: 16px;">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('')}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      to,
      subject,
      text: body,
      html: htmlBody,
      replyTo: user,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send email via Gmail SMTP',
    };
  }
}
