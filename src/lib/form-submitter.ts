import * as cheerio from 'cheerio';

export interface FormSubmissionResult {
  success: boolean;
  formUrl?: string;
  fieldsFound?: string[];
  error?: string;
}

export async function submitContactForm({
  websiteUrl,
  senderName,
  senderEmail,
  senderPhone,
  subject,
  message,
}: {
  websiteUrl: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
}): Promise<FormSubmissionResult> {
  if (!websiteUrl || !websiteUrl.startsWith('http')) {
    return { success: false, error: 'Invalid website URL' };
  }

  const parsedUrl = new URL(websiteUrl);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const candidatePages = [
    `${baseUrl}/contact`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/get-in-touch`,
    websiteUrl,
  ];

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  for (const pageUrl of candidatePages) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(pageUrl, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // Search for contact forms
      const forms = $('form');
      if (forms.length === 0) continue;

      // Find the form with email or message fields
      let targetForm: any = null;
      let formAction = '';
      let formMethod = 'POST';

      forms.each((_, form) => {
        const text = $(form).html() || '';
        if (text.includes('email') || text.includes('message')) {
          targetForm = $(form);
          formAction = $(form).attr('action') || pageUrl;
          formMethod = ($(form).attr('method') || 'POST').toUpperCase();
          return false; // break
        }
      });

      if (!targetForm) continue;

      // Resolve full action URL
      let submitUrl = formAction;
      if (formAction.startsWith('/')) {
        submitUrl = `${baseUrl}${formAction}`;
      } else if (!formAction.startsWith('http')) {
        submitUrl = `${baseUrl}/${formAction}`;
      }

      // Collect and populate fields
      const formData = new URLSearchParams();
      const fieldsFound: string[] = [];

      targetForm.find('input, textarea, select').each((_: any, input: any) => {
        const name = $(input).attr('name');
        const type = ($(input).attr('type') || '').toLowerCase();
        const tag = input.tagName.toLowerCase();

        if (!name) return;

        const lowerName = name.toLowerCase();
        fieldsFound.push(name);

        if (tag === 'textarea' || lowerName.includes('message') || lowerName.includes('comment') || lowerName.includes('body')) {
          formData.append(name, message);
        } else if (type === 'email' || lowerName.includes('email') || lowerName.includes('mail')) {
          formData.append(name, senderEmail);
        } else if (lowerName.includes('name') || lowerName.includes('author')) {
          formData.append(name, senderName);
        } else if (type === 'tel' || lowerName.includes('phone') || lowerName.includes('tel')) {
          formData.append(name, senderPhone || '555-019-2831');
        } else if (lowerName.includes('subject')) {
          formData.append(name, subject);
        } else {
          // Hidden fields or CSRF tokens
          const val = $(input).attr('value') || '';
          if (val) formData.append(name, val);
        }
      });

      // Submit form
      const postRes = await fetch(submitUrl, {
        method: formMethod,
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: pageUrl,
        },
        body: formData.toString(),
      });

      if (postRes.ok || postRes.status === 302 || postRes.status === 200) {
        return {
          success: true,
          formUrl: submitUrl,
          fieldsFound,
        };
      }
    } catch {
      // try next candidate page
    }
  }

  return {
    success: false,
    error: 'Could not find or submit an automated contact form on website',
  };
}
