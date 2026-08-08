import { EmailService } from '../services/email.service';

export async function processNotification(jobData: { email: string; title: string; message: string }) {
  console.log(`[NotificationProcessor] Dispatching alert to ${jobData.email}...`);
  await EmailService.sendNotificationEmail(jobData.email, jobData.title, jobData.message);
  return { status: 'DELIVERED' };
}
