import { Prisma, User, Skill, Project, SkillDnaReport, CareerReadiness } from '@prisma/client';

export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true; userSkills: { include: { skill: true } } };
}>;

export type FullSkillReport = Prisma.SkillDnaReportGetPayload<{}>;

export type { User, Skill, Project, SkillDnaReport, CareerReadiness };
