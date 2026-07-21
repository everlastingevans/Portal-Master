import crypto from 'crypto';

export class PayfastService {
  /**
   * Generates Payfast payment data and signature
   */
  static generatePaymentData(
    paymentId: string,
    amount: number,
    itemName: string,
    returnUrl: string,
    cancelUrl: string,
    notifyUrl: string
  ) {
    const isProd = process.env.PAYFAST_ENV === 'production';
    
    // Check if custom merchant credentials are set; otherwise default to official PayFast sandbox keys
    const merchantId = process.env.PAYFAST_MERCHANT_ID || '10000100';
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a';
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';

    const url = isProd ? 'https://www.payfast.co.za/eng/process' : 'https://sandbox.payfast.co.za/eng/process';

    const data: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      m_payment_id: paymentId,
      amount: amount.toFixed(2),
      item_name: itemName,
    };

    let stringToHash = '';
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        stringToHash += `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, '+')}&`;
      }
    }

    if (passphrase) {
      stringToHash += `passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    } else {
      stringToHash = stringToHash.slice(0, -1); // remove trailing &
    }

    const signature = crypto.createHash('md5').update(stringToHash).digest('hex');
    data.signature = signature;

    return {
      url,
      data
    };
  }
}
