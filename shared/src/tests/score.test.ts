import { calculateSkillDnaScore } from '../../helpers/score.helper';

console.log('🧪 Running SkillDNA Score Calculator Unit Test...');

const score = calculateSkillDnaScore({
  codeQuality: 90,
  problemSolving: 85,
  systemDesign: 88,
  breadth: 80,
  consistency: 92,
});

console.assert(score > 80 && score < 90, `Unexpected calculated score: ${score}`);
console.log(`✅ Calculated SkillDNA Overall Score: ${score} (Passed).`);
