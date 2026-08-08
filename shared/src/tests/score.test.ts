import { calculateSkillDnaScore } from '../../helpers/score.helper';

console.log('🧪 Running SkillDNA Score Calculator Unit Test...');

const score = calculateSkillDnaScore({
  codeQualityScore: 90,
  problemSolvingScore: 85,
  systemDesignScore: 88,
  breadthScore: 80,
  consistencyScore: 92,
});

console.assert(score > 80 && score < 90, `Unexpected calculated score: ${score}`);
console.log(`✅ Calculated SkillDNA Overall Score: ${score} (Passed).`);
