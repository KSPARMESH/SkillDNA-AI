import { ReportGeneratorService } from '../services/report-generator.service';

export async function processReportGeneration(jobData: { userId: string }) {
  console.log(`[ReportsProcessor] Generating AI report for user: ${jobData.userId}...`);
  const report = await ReportGeneratorService.generateSkillDnaReport(jobData.userId);
  return { report, status: 'COMPLETED' };
}
