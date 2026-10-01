import { CampaignLead, DeliveryLog } from '@/types';
import {
  getLeads,
  saveLeads,
  getCampaignState,
  saveCampaignState,
  addLog,
} from './storage';
import { verifyEmailDeliverability } from './verifier';
import { sendColdEmail } from './mailer';
import { submitContactForm } from './form-submitter';
import { checkTimezoneSendWindow } from './timezone';

export async function dispatchSingleLead(leadId: string): Promise<{
  success: boolean;
  message: string;
  lead?: CampaignLead;
}> {
  const leads = getLeads();
  const leadIndex = leads.findIndex((l) => l.id === leadId);

  if (leadIndex === -1) {
    return { success: false, message: 'Lead not found' };
  }

  const lead = leads[leadIndex];
  const state = getCampaignState();
  const dailyLimit = Number(process.env.DAILY_EMAIL_LIMIT || 10);

  if (state.sentToday >= dailyLimit) {
    return {
      success: false,
      message: `Daily limit of ${dailyLimit} emails reached for today. Reset at midnight.`,
    };
  }

  // 1. If Email Channel
  if (lead.channel === 'email' && lead.email) {
    // Verify MX record first
    if (!lead.emailVerified) {
      const verification = await verifyEmailDeliverability(lead.email);
      lead.emailVerified = verification.isValid;
      lead.mxValid = verification.mxValid;
      lead.mxHost = verification.mxHost;
      lead.verificationReason = verification.reason;

      if (!verification.isValid) {
        lead.status = 'bounced';
        lead.error = verification.reason;
        saveLeads(leads);

        addLog({
          id: `log_${Date.now()}`,
          leadId: lead.id,
          businessName: lead.name,
          recipient: lead.email,
          channel: 'email',
          status: 'failed',
          timestamp: new Date().toISOString(),
          subject: lead.pitchSubject,
          notes: `MX Verification failed: ${verification.reason}`,
        });

        return {
          success: false,
          message: `MX Verification failed: ${verification.reason}. Skipping to prevent bounce.`,
          lead,
        };
      }
    }

    // Send cold email via Gmail SMTP
    const mailResult = await sendColdEmail({
      to: lead.email,
      subject: lead.pitchSubject,
      body: lead.pitchBody,
      recipientName: lead.name,
    });

    if (mailResult.success) {
      lead.status = 'sent';
      lead.sentAt = new Date().toISOString();
      lead.error = null;

      state.sentToday += 1;
      saveCampaignState(state);
      saveLeads(leads);

      addLog({
        id: `log_${Date.now()}`,
        leadId: lead.id,
        businessName: lead.name,
        recipient: lead.email,
        channel: 'email',
        status: 'success',
        timestamp: new Date().toISOString(),
        subject: lead.pitchSubject,
        notes: `Sent from ${process.env.GMAIL_USER || 'joshuaakintayo21@gmail.com'} (MessageId: ${mailResult.messageId})`,
      });

      return {
        success: true,
        message: `Successfully sent email to ${lead.name} (${lead.email})`,
        lead,
      };
    } else {
      lead.status = 'failed';
      lead.error = mailResult.error || 'SMTP delivery failed';
      saveLeads(leads);

      addLog({
        id: `log_${Date.now()}`,
        leadId: lead.id,
        businessName: lead.name,
        recipient: lead.email,
        channel: 'email',
        status: 'failed',
        timestamp: new Date().toISOString(),
        subject: lead.pitchSubject,
        notes: mailResult.error || 'SMTP delivery failed',
      });

      return {
        success: false,
        message: mailResult.error || 'Failed to send email',
        lead,
      };
    }
  }

  // 2. If Website Contact Form Channel (No Public Email)
  if (lead.channel === 'contact_form' && lead.website) {
    const formResult = await submitContactForm({
      websiteUrl: lead.website,
      senderName: process.env.SENDER_NAME || 'Joshua Akintayo',
      senderEmail: process.env.GMAIL_USER || 'joshuaakintayo21@gmail.com',
      subject: lead.pitchSubject,
      message: lead.pitchBody,
    });

    if (formResult.success) {
      lead.status = 'form_submitted';
      lead.sentAt = new Date().toISOString();
      lead.error = null;

      state.sentToday += 1;
      saveCampaignState(state);
      saveLeads(leads);

      addLog({
        id: `log_${Date.now()}`,
        leadId: lead.id,
        businessName: lead.name,
        recipient: lead.website,
        channel: 'contact_form',
        status: 'success',
        timestamp: new Date().toISOString(),
        subject: lead.pitchSubject,
        notes: `Submitted automated contact form on ${formResult.formUrl}`,
      });

      return {
        success: true,
        message: `Successfully submitted contact form for ${lead.name}`,
        lead,
      };
    } else {
      lead.status = 'failed';
      lead.error = formResult.error;
      saveLeads(leads);

      addLog({
        id: `log_${Date.now()}`,
        leadId: lead.id,
        businessName: lead.name,
        recipient: lead.website,
        channel: 'contact_form',
        status: 'failed',
        timestamp: new Date().toISOString(),
        subject: lead.pitchSubject,
        notes: formResult.error || 'Contact form submission failed',
      });

      return {
        success: false,
        message: formResult.error || 'Failed to submit contact form',
        lead,
      };
    }
  }

  return { success: false, message: 'Lead has neither valid email nor website' };
}

export async function dispatchNextEligibleLead(): Promise<{
  dispatched: boolean;
  message: string;
  lead?: CampaignLead;
}> {
  const state = getCampaignState();
  const dailyLimit = Number(process.env.DAILY_EMAIL_LIMIT || 10);

  if (state.sentToday >= dailyLimit) {
    return {
      dispatched: false,
      message: `Daily quota of ${dailyLimit} emails already met for today. Next batch runs tomorrow.`,
    };
  }

  const leads = getLeads();

  // Find next queued lead currently inside their business hours window
  const eligible = leads.find((l) => {
    if (l.status !== 'queued') return false;
    const tz = checkTimezoneSendWindow(l.timezone);
    return tz.isInSendWindow;
  });

  if (!eligible) {
    // If no lead is strictly in send window right now, pick the first queued lead to show in queue
    const queuedLead = leads.find((l) => l.status === 'queued');
    if (!queuedLead) {
      return {
        dispatched: false,
        message: 'No more leads in queue. Sync new leads from LeadRadar.',
      };
    }

    const tz = checkTimezoneSendWindow(queuedLead.timezone);
    return {
      dispatched: false,
      message: `Next lead (${queuedLead.name} in ${queuedLead.city}) is currently outside business hours (${tz.localTimeFormatted} - ${tz.windowStatus}). Waiting for window to open.`,
    };
  }

  const res = await dispatchSingleLead(eligible.id);
  return {
    dispatched: res.success,
    message: res.message,
    lead: res.lead,
  };
}
