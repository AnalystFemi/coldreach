export type OutreachChannel = 'email' | 'contact_form' | 'whatsapp';

export type LeadDeliveryStatus =
  | 'queued'
  | 'scheduled'
  | 'sent'
  | 'form_submitted'
  | 'bounced'
  | 'failed'
  | 'skipped';

export interface CampaignLead {
  id: string;
  placeId: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  localTime?: string;
  isInSendWindow?: boolean;
  email: string | null;
  phone: string;
  website: string;
  rating: number;
  userRatingsTotal: number;
  
  // Verification
  emailVerified: boolean | null;
  mxValid: boolean | null;
  mxHost?: string | null;
  verificationReason?: string;
  
  // Outreach
  channel: OutreachChannel;
  status: LeadDeliveryStatus;
  pitchSubject: string;
  pitchBody: string;
  serviceAngle: string;
  sentAt?: string | null;
  error?: string | null;
  createdAt: string;
}

export interface TimezoneInfo {
  name: string;
  region: string;
  iana: string;
  currentTime: string;
  isBusinessHours: boolean;
  leadCount: number;
}

export interface CampaignSummary {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  totalQueued: number;
  totalSentAllTime: number;
  formsSubmittedAllTime: number;
  activeTimezones: TimezoneInfo[];
  nextScheduledSend: string | null;
  isSendingActive: boolean;
  gmailUser?: string;
  gmailConfigured?: boolean;
}

export interface DeliveryLog {
  id: string;
  leadId: string;
  businessName: string;
  recipient: string;
  channel: 'email' | 'contact_form';
  status: 'success' | 'failed';
  timestamp: string;
  subject: string;
  notes: string;
}
