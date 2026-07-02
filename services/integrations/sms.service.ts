export class SMSService {
  static async sendSMS(to: string, message: string) {
    const apiKey = process.env.BREVO_API_KEY;
    const smsSender = process.env.BREVO_SMS_SENDER || 'LaunchPath';

    if (!apiKey) {
      throw new Error('BREVO_API_KEY is required for SMSService');
    }

    const cleanTo = to.replace(/[\s\-\(\)]/g, '');

    try {
      const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: smsSender.substring(0, 11),
          recipient: cleanTo,
          content: message,
          type: 'transactional',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[SMSService] Brevo returned failed status (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[SMSService] Error sending SMS via Brevo', error);
      throw error;
    }
  }
}
