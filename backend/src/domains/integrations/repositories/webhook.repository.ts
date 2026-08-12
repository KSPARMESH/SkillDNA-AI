export class WebhookRepository {
  private static processedEvents: Map<string, Date> = new Map();
  private static webhookLogs: Array<{
    id: string;
    platform: string;
    event: string;
    receivedAt: Date;
    processed: boolean;
  }> = [];

  static async isDuplicateEvent(eventId: string): Promise<boolean> {
    if (this.processedEvents.has(eventId)) {
      return true;
    }
    return false;
  }

  static async markEventProcessed(eventId: string, platform: string, event: string): Promise<void> {
    this.processedEvents.set(eventId, new Date());
    this.webhookLogs.push({
      id: eventId,
      platform,
      event,
      receivedAt: new Date(),
      processed: true,
    });

    // Cleanup old events older than 24 hours
    if (this.processedEvents.size > 10000) {
      const now = Date.now();
      for (const [id, date] of this.processedEvents.entries()) {
        if (now - date.getTime() > 24 * 60 * 60 * 1000) {
          this.processedEvents.delete(id);
        }
      }
    }
  }

  static async getWebhookLogs(platform?: string, limit = 50) {
    if (platform) {
      return this.webhookLogs
        .filter((l) => l.platform.toUpperCase() === platform.toUpperCase())
        .slice(-limit);
    }
    return this.webhookLogs.slice(-limit);
  }
}
