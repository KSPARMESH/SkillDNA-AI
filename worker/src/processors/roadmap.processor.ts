import { RoadmapGeneratorService } from '../services/roadmap-generator.service';

export async function processRoadmap(jobData: { userId: string; targetRole: string }) {
  console.log(`[RoadmapProcessor] Generating learning roadmap for role ${jobData.targetRole}...`);
  const roadmap = await RoadmapGeneratorService.generateRoadmap(jobData.userId, jobData.targetRole);
  return { roadmap, status: 'COMPLETED' };
}
