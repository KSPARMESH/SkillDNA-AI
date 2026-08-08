import { UserRole, AccountStatus, AuthProvider } from '../enums/user.enum';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: AccountStatus;
  provider: AuthProvider;
  emailVerified: boolean;
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IUserProfile {
  id: string;
  userId: string;
  summary?: string | null;
  targetRole?: string | null;
  yearsOfExperience: number;
  expectedSalary?: number | null;
  totalSkillDnaScore: number;
  totalReadinessScore: number;
}
