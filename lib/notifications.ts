interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends a real Brevo email if configured, else logs structured contents to console.
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  console.log(`[Email Dispatcher - Brevo] Initiating dispatch to: ${to}`);
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL || 'alerts@launchpath.com';
  const fromName = process.env.BREVO_SENDER_NAME || 'LaunchPath Team';

  if (!apiKey) {
    console.warn(
      `[MOCK NOTIFICATION SENDER] Brevo is not fully configured (BREVO_API_KEY missing). Email log details below:`
    );
    console.warn(`--------------------------------------------------`);
    console.warn(`FROM:    ${fromName} <${fromEmail}>`);
    console.warn(`TO:      ${to}`);
    console.warn(`SUBJECT: ${subject}`);
    console.warn(`TEXT:    ${text || subject}`);
    console.warn(`HTML:    (Truncated in shell logs for spacing and styling)`);
    console.warn(`--------------------------------------------------`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || subject,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Email Dispatcher - Brevo] Failed response (${res.status}):`, errText);
      return false;
    }

    console.log(`[Email Dispatcher - Brevo] Brevo successfully emailed: ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[Email Dispatcher - Brevo] Failed to send email via Brevo:`, err);
    return false;
  }
}

interface SmsOptions {
  to: string;
  body: string;
}

/**
 * Sends a real Brevo SMS if configured, else logs structured contents to console.
 */
export async function sendSMS({ to, body }: SmsOptions): Promise<boolean> {
  console.log(`[SMS Dispatcher - Brevo] Initiating dispatch to: ${to}`);
  const apiKey = process.env.BREVO_API_KEY;
  const smsSender = process.env.BREVO_SMS_SENDER || 'LaunchPath';

  // Format recipient's phone number: clean characters but keep it standard for Brevo
  const cleanTo = to.replace(/[\s\-\(\)]/g, ''); // strip spaces, dashes, parentheses

  if (!apiKey) {
    console.warn(
      `[MOCK NOTIFICATION SENDER] Brevo is not fully configured (BREVO_API_KEY missing). SMS log details below:`
    );
    console.warn(`--------------------------------------------------`);
    console.warn(`FROM: ${smsSender}`);
    console.warn(`TO:   ${cleanTo}`);
    console.warn(`BODY: ${body}`);
    console.warn(`--------------------------------------------------`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: smsSender.substring(0, 11), // Brevo max sender length is 11 alphanumeric characters
        recipient: cleanTo,
        content: body,
        type: 'transactional',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SMS Dispatcher - Brevo] Failed response (${res.status}):`, errText);
      return false;
    }

    console.log(`[SMS Dispatcher - Brevo] Brevo successfully sent SMS to: ${cleanTo}`);
    return true;
  } catch (err: any) {
    console.error(`[SMS Dispatcher - Brevo] Failed to send SMS via Brevo:`, err);
    return false;
  }
}

interface WhatsAppOptions {
  to: string;
  body: string;
}

/**
 * Sends a real Brevo WhatsApp message if configured, else logs structured contents to console.
 */
export async function sendWhatsApp({ to, body }: WhatsAppOptions): Promise<boolean> {
  console.log(`[WhatsApp Dispatcher - Brevo] Initiating dispatch to: ${to}`);
  const apiKey = process.env.BREVO_API_KEY;
  const senderNumber = process.env.BREVO_WHATSAPP_SENDER_NUMBER;

  // Format recipient's phone number: strip whatsapp: prefix for Brevo compatibility
  const cleanTo = to.replace('whatsapp:', '').trim();

  if (!apiKey || !senderNumber) {
    console.warn(
      `[MOCK NOTIFICATION SENDER] Brevo is not fully configured (BREVO_API_KEY/BREVO_WHATSAPP_SENDER_NUMBER missing). WhatsApp log details below:`
    );
    console.warn(`--------------------------------------------------`);
    console.warn(`FROM: ${senderNumber || 'MISSING_SENDER_NUMBER'}`);
    console.warn(`TO:   ${cleanTo}`);
    console.warn(`BODY: ${body}`);
    console.warn(`--------------------------------------------------`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        senderNumber,
        contactNumbers: [cleanTo],
        text: body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp Dispatcher - Brevo] Failed response (${res.status}):`, errText);
      return false;
    }

    console.log(`[WhatsApp Dispatcher - Brevo] Brevo successfully sent WhatsApp to: ${cleanTo}`);
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp Dispatcher - Brevo] Failed to send WhatsApp via Brevo:`, err);
    return false;
  }
}

interface MultiChannelOptions {
  candidateEmail: string;
  candidatePhone?: string | null;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  proposedTime: Date;
  notes?: string | null;
}

/**
 * Convenience helper to dispatch the same interview invitation across Email, SMS, & WhatsApp channels.
 */
export async function dispatchInterviewInvitation({
  candidateEmail,
  candidatePhone,
  candidateName,
  jobTitle,
  companyName,
  proposedTime,
  notes,
}: MultiChannelOptions) {
  const formattedTime = new Date(proposedTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const emailSubject = `Interview Invitation: ${jobTitle} at ${companyName}`;
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
      <h2 style="color: #7145FF; margin-bottom: 20px;">LaunchPath Interview invitation</h2>
      <p>Dear <strong>${candidateName}</strong>,</p>
      <p>Congratulations! <strong>${companyName}</strong> has invited you to an interview for the <strong>${jobTitle}</strong> position.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7145FF;">
        <p style="margin: 0; font-weight: bold; color: #334155;">Proposed Date & Time:</p>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 15px;">${formattedTime}</p>
        ${notes ? `<p style="margin: 15px 0 0 0; font-weight: bold; color: #334155;">Manager Notes / Link:</p><p style="margin: 5px 0 0 0; color: #64748b;">${notes}</p>` : ''}
      </div>
      <p>Please log in to your <a href="https://launchpath.com/candidate/dashboard?tab=Inbox" style="color: #7145FF; font-weight: bold; text-decoration: none;">LaunchPath Profile</a> to accept or propose alternatives for this interview.</p>
      <p style="margin-top: 300; font-size: 11px; color: #94a3b8;">Best regards,<br/>The LaunchPath Onboarding Team</p>
    </div>
  `;

  const smsText = `LaunchPath Invitation: congrats ${candidateName}! ${companyName} invited you for an interview for "${jobTitle}" on ${formattedTime}. Notes: ${notes || 'none'}. Accept on your LaunchPath dashboard.`;

  // Dispatch Email
  await sendEmail({
    to: candidateEmail,
    subject: emailSubject,
    html: emailHtml,
    text: `Congratulation! ${companyName} invited you to an interview for "${jobTitle}" on ${formattedTime}. Proposes accept and details on LaunchPath.`,
  });

  // Dispatch SMS (if phone number is available)
  if (candidatePhone) {
    await sendSMS({
      to: candidatePhone,
      body: smsText,
    });

    // Send WhatsApp (since the user requests: "and if the number is also associated with their whatsapp we also want to send them a message there")
    await sendWhatsApp({
      to: candidatePhone,
      body: smsText,
    });
  } else {
    console.warn(`[Dispatcher Warning] No phone registered for candidate ${candidateName}. Skipping SMS & WhatsApp channels.`);
  }
}
