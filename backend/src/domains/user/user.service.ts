export class UserService {
  static async getProfile(userId: string) {
    return {
      userId,
      email: 'student@skilldna.ai',
      firstName: 'Parmesh',
      lastName: 'KS',
      headline: 'Full Stack AI Engineer & Open Source Maintainer',
      bio: 'Building SkillDNA AI — Your Living Technical Identity.',
      location: 'Tamil Nadu, India',
      targetRole: 'Full Stack Engineer',
      yearsOfExperience: 2,
      totalSkillDnaScore: 88.5,
      totalReadinessScore: 92.0,
    };
  }
}
