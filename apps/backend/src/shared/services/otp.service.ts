import axios from 'axios';

export class OtpService {
  private authKey: string;
  private templateId: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || '';
    this.templateId = process.env.MSG91_TEMPLATE_ID || '';
  }

  // Sends an OTP via MSG91 or logs it to console for email
  async sendOtp(identifier: string): Promise<boolean> {
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      console.log(`[DEV ONLY - EMAIL OTP] OTP for ${identifier} requested.`);
      return true;
    }

    if (!this.authKey || !this.templateId) {
      console.warn('MSG91 credentials not configured. OTP will be printed to console in development.');
      console.log(`[DEV ONLY - PHONE OTP] OTP for ${identifier} requested.`);
      return true;
    }

    try {
      const response = await axios.post(
        `https://control.msg91.com/api/v5/otp?template_id=${this.templateId}&mobile=${identifier}`,
        {},
        {
          headers: {
            authkey: this.authKey,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.type === 'success';
    } catch (error: any) {
      console.error('Failed to send OTP via MSG91:', error.response?.data || error.message);
      throw new Error('Failed to send OTP');
    }
  }

  // Verifies the OTP via MSG91
  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const isEmail = identifier.includes('@');

    if (isEmail) {
      console.warn(`[DEV ONLY - EMAIL OTP] Accepting any 6-digit OTP for ${identifier}.`);
      return otp.length === 6;
    }

    if (!this.authKey) {
      console.warn('MSG91 credentials not configured. Accepting any 6-digit OTP in development.');
      return otp.length === 6; // Accept any 6 digit OTP for local testing
    }

    try {
      const response = await axios.get(
        `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${identifier}`,
        {
          headers: {
            authkey: this.authKey
          }
        }
      );
      
      return response.data.type === 'success';
    } catch (error: any) {
      console.error('Failed to verify OTP via MSG91:', error.response?.data || error.message);
      return false;
    }
  }
}
