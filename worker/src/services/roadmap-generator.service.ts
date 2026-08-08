export class RoadmapGeneratorService {
  static async generateRoadmap(userId: string, targetRole: string) {
    return {
      userId,
      targetRole,
      milestones: [
        { step: 1, title: 'Master PostgreSQL Indexing & Prisma Transactions', status: 'IN_PROGRESS' },
        { step: 2, title: 'Build Microservice Queues with BullMQ & Redis', status: 'RECOMMENDED' }
      ]
    };
  }
}
