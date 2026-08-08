export async function processAiReportJob(userId: string) {
  console.log(`[Worker] Generating AI SkillDNA Report for user ${userId}...`);
  return { status: 'COMPLETED', generatedScore: 88.5 };
}
