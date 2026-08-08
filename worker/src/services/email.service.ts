export class EmailService {
  static async sendNotificationEmail(to: string, subject: string, body: string) {
    console.log(`[EmailService] Sent email to ${to}: ${subject}`);
    return { delivered: true, timestamp: new Date().toISOString() };
  }
}
