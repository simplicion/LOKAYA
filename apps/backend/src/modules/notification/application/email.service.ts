import nodemailer from 'nodemailer';
import { INotificationService } from '../interfaces/INotificationService';
import { AppError } from '../../../shared/errors/AppError';

export class EmailService implements INotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initTransporter();
  }

  private async initTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('No SMTP credentials found. Generating Ethereal test account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('Ethereal test account generated:', testAccount.user);
      } catch (err) {
        console.error('Failed to generate Ethereal account:', err);
      }
    }
  }

  async sendOtp(to: string, otp: string, type: 'EMAIL' | 'PHONE'): Promise<boolean> {
    if (type !== 'EMAIL') {
      console.warn('EmailService is being used to send an OTP to a phone number. Ignoring.');
      return false;
    }

    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.transporter) {
      console.error('Transporter not initialized.');
      throw new AppError('Email service not initialized', 500);
    }

    try {
      const mailOptions = {
        from: `"LOKAYA" <${process.env.SMTP_FROM_EMAIL || 'no-reply@lokaya.com'}>`,
        to,
        subject: 'Your LOKAYA Verification Code',
        text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF5A36; text-align: center;">Welcome to LOKAYA</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for 5 minutes. Please do not share it with anyone.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      
      // If using Ethereal email for testing, log the preview URL
      if (!process.env.SMTP_USER || process.env.SMTP_HOST === 'smtp.ethereal.email') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new AppError('Failed to send verification email', 500);
    }
  }

  async sendInvoiceEmail(to: string, data: {
    invoiceNumber: string;
    orderId: string;
    orderDate: string;
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    storeGst?: string;
    customerName?: string;
    paymentMethod: string;
    items: Array<{
      name: string;
      variant?: string;
      sku?: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    discountAmount?: number;
    shippingFee?: number;
    totalAmount: number;
    currencySymbol: string;
    isManualBooking?: boolean;
  }): Promise<boolean> {
    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.transporter) {
      console.error('Email transporter not initialized.');
      return false;
    }

    try {
      const itemsHtml = data.items.map((it, idx) => `
        <tr style="border-bottom: 1px solid #E5E2DC;">
          <td style="padding: 12px 8px; font-size: 13px; color: #666; text-align: center;">${idx + 1}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #171717; font-weight: bold;">
            ${it.name}
            ${it.variant ? `<br><span style="font-size: 11px; color: #666; font-weight: normal;">Variant: ${it.variant}</span>` : ''}
            ${it.sku ? `<br><span style="font-size: 10px; color: #999; font-weight: normal; font-family: monospace;">SKU: ${it.sku}</span>` : ''}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; color: #171717; text-align: center;">${it.quantity}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #171717; text-align: right;">${data.currencySymbol}${it.price.toLocaleString()}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #171717; text-align: right; font-weight: bold;">${data.currencySymbol}${it.total.toLocaleString()}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tax Invoice - ${data.invoiceNumber}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; color: #171717;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E5E2DC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            
            <!-- Header -->
            <div style="background-color: #171717; color: #ffffff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; color: #FF5A36;">LOKAYA</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Official Tax Invoice & Cash Memo</p>
              </div>
              <div style="text-align: right;">
                <span style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px;">
                  ${data.isManualBooking ? 'IN-STORE POS SALE' : 'ONLINE ORDER'}
                </span>
                <p style="margin: 4px 0 0 0; font-size: 12px; font-family: monospace; color: #ffffff; font-weight: bold;">${data.invoiceNumber}</p>
              </div>
            </div>

            <!-- Body Container -->
            <div style="padding: 28px 32px;">
              
              <!-- Store & Customer Metadata Grid -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 16px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Sold By (Merchant)</p>
                    <p style="margin: 0; font-size: 15px; font-weight: bold; color: #171717;">${data.storeName}</p>
                    ${data.storeAddress ? `<p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">${data.storeAddress}</p>` : ''}
                    ${data.storePhone ? `<p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">Phone: ${data.storePhone}</p>` : ''}
                    ${data.storeGst ? `<p style="margin: 3px 0 0 0; font-size: 11px; color: #777; font-family: monospace;">GSTIN/PAN: ${data.storeGst}</p>` : ''}
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 16px; border-left: 1px solid #E5E2DC;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Billed To (Customer)</p>
                    <p style="margin: 0; font-size: 15px; font-weight: bold; color: #171717;">${data.customerName || 'Walk-in Customer'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #555;">Order ID: <strong style="font-family: monospace;">#${data.orderId.slice(0, 8).toUpperCase()}</strong></p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">Date: ${data.orderDate}</p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">Payment: <strong>${data.paymentMethod}</strong></p>
                  </td>
                </tr>
              </table>

              <!-- Itemized Products Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #FAF9F6; border-top: 1px solid #E5E2DC; border-bottom: 1px solid #E5E2DC;">
                    <th style="padding: 10px 8px; font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; text-align: center; width: 30px;">#</th>
                    <th style="padding: 10px 8px; font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; text-align: left;">Item Description</th>
                    <th style="padding: 10px 8px; font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                    <th style="padding: 10px 8px; font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; text-align: right; width: 90px;">Price</th>
                    <th style="padding: 10px 8px; font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; text-align: right; width: 100px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="width: 55%;"></td>
                  <td style="width: 45%;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #666;">Subtotal</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #171717; text-align: right; font-weight: 600;">${data.currencySymbol}${data.subtotal.toLocaleString()}</td>
                      </tr>
                      ${data.discountAmount && data.discountAmount > 0 ? `
                        <tr>
                          <td style="padding: 4px 0; font-size: 13px; color: #16a34a;">Discount</td>
                          <td style="padding: 4px 0; font-size: 13px; color: #16a34a; text-align: right; font-weight: 600;">-${data.currencySymbol}${data.discountAmount.toLocaleString()}</td>
                        </tr>
                      ` : ''}
                      ${data.shippingFee && data.shippingFee > 0 ? `
                        <tr>
                          <td style="padding: 4px 0; font-size: 13px; color: #666;">Delivery Fee</td>
                          <td style="padding: 4px 0; font-size: 13px; color: #171717; text-align: right; font-weight: 600;">${data.currencySymbol}${data.shippingFee.toLocaleString()}</td>
                        </tr>
                      ` : ''}
                      <tr style="border-top: 1px solid #171717; border-bottom: 2px solid #171717;">
                        <td style="padding: 10px 0; font-size: 15px; font-weight: 900; color: #171717;">Grand Total</td>
                        <td style="padding: 10px 0; font-size: 18px; font-weight: 900; color: #FF5A36; text-align: right;">${data.currencySymbol}${data.totalAmount.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer Notice -->
              <div style="border-top: 1px dashed #E5E2DC; padding-top: 16px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666; font-weight: 500;">Thank you for your purchase with <strong style="color: #171717;">${data.storeName}</strong> on Lokaya!</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">This is an authentic, computer-generated tax invoice verified by Lokaya Commerce Platform.</p>
              </div>

            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"${data.storeName} via LOKAYA" <${process.env.SMTP_FROM_EMAIL || 'no-reply@lokaya.com'}>`,
        to,
        subject: `Tax Invoice ${data.invoiceNumber} for Order #${data.orderId.slice(0, 8).toUpperCase()}`,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Invoice Email Sent] Message ID: %s to %s', info.messageId, to);

      if (!process.env.SMTP_USER || process.env.SMTP_HOST === 'smtp.ethereal.email') {
        console.log('[Invoice Email Preview]: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }
}

