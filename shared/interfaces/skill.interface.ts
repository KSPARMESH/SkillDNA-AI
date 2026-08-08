import { SkillCategory, ProficiencyLevel, ProjectCategory } from '../enums/skill.enum';

export interface ISkill {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  description?: string | null;
  iconUrl?: string | null;
}

export interface IUserSkill {
  id: string;
  userId: string;
  skillId: string;
  proficiency: ProficiencyLevel;
  verified: boolean;
  verifiedScore: number;
  selfRating: number;
  yearsOfExperience: number;
  skill?: ISkill;
}

export interface IProject {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  repoUrl?: string | null;
  liveUrl?: string | null;
  techStack: string[];
  starsCount: number;
  forksCount: number;
  linesOfCode: number;
}
