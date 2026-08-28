export interface INotificationService {
  sendOtp(to: string, otp: string, type: 'EMAIL' | 'PHONE'): Promise<boolean>;
}
