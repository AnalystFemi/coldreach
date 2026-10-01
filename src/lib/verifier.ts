import dns from 'dns';
import { promisify } from 'util';

const resolveMxAsync = promisify(dns.resolveMx);

const DISPOSABLE_OR_JUNK_DOMAINS = [
  'example.com',
  'domain.com',
  'yourdomain.com',
  'email.com',
  'test.com',
  'sentry.io',
  'wixpress.com',
  'cloudflare.com',
  'schema.org',
  'wordpress.org',
  'gravatar.com',
  'googleapis.com',
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
];

export interface EmailVerificationResult {
  isValid: boolean;
  mxValid: boolean;
  mxHost: string | null;
  reason: string;
}

export async function verifyEmailDeliverability(
  email: string | null | undefined
): Promise<EmailVerificationResult> {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      mxValid: false,
      mxHost: null,
      reason: 'No email address provided',
    };
  }

  const clean = email.trim().toLowerCase();

  // 1. Syntax Regex Check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return {
      isValid: false,
      mxValid: false,
      mxHost: null,
      reason: 'Malformed email syntax',
    };
  }

  const [, domain] = clean.split('@');
  if (!domain) {
    return {
      isValid: false,
      mxValid: false,
      mxHost: null,
      reason: 'Missing domain part',
    };
  }

  // 2. Junk / Disposable Domain Check
  if (DISPOSABLE_OR_JUNK_DOMAINS.some((junk) => domain.includes(junk))) {
    return {
      isValid: false,
      mxValid: false,
      mxHost: null,
      reason: `Blocked junk/disposable domain: ${domain}`,
    };
  }

  // 3. Deep DNS MX Lookup
  try {
    const mxRecords = await resolveMxAsync(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        mxValid: false,
        mxHost: null,
        reason: `No MX records found for domain: ${domain}`,
      };
    }

    // Sort by priority (lowest number = highest priority)
    const sorted = mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryHost = sorted[0].exchange;

    return {
      isValid: true,
      mxValid: true,
      mxHost: primaryHost,
      reason: `Valid MX server verified: ${primaryHost}`,
    };
  } catch (err: any) {
    return {
      isValid: false,
      mxValid: false,
      mxHost: null,
      reason: `DNS lookup failed for ${domain}: ${err?.code || err?.message || 'Host not found'}`,
    };
  }
}
