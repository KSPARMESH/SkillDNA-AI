'use client';

import { useState, useEffect, FormEvent } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  getProfileApi,
  updateProfileApi,
  getProjectsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from '@/services/api.service';

export interface UserProfileDetails {
  id?: string;
  userId?: string;
  summary?: string | null;
  targetRole?: string | null;
  yearsOfExperience?: number;
  expectedSalary?: number | null;
  availabilityStatus?: string | null;
  totalSkillDnaScore?: number;
  totalReadinessScore?: number;
}

export interface UserData {
  id: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  githubUsername?: string | null;
  leetcodeUsername?: string | null;
  hackerrankUsername?: string | null;
  linkedinUrl?: string | null;
  profile?: UserProfileDetails;
  skills?: any[];
  projects?: any[];
}

export interface ProfileFormState {
  headline: string;
  bio: string;
  location: string;
  targetRole: string;
  yearsOfExperience: number | '';
  expectedSalary: number | '';
  availabilityStatus: string;
}

export interface ProjectItem {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  repoUrl?: string | null;
  liveUrl?: string | null;
  techStack: string[];
  starsCount: number;
  forksCount: number;
  linesOfCode: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  projectSkills?: Array<{ id: string; skillId: string; skill?: { id: string; name: string } }>;
}

export interface ProjectFormState {
  title: string;
  description: string;
  category: string;
  repoUrl: string;
  liveUrl: string;
  techStack: string;
  starsCount: number | '';
  forksCount: number | '';
  linesOfCode: number | '';
  status: string;
}

const INITIAL_PROJECT_FORM: ProjectFormState = {
  title: '',
  description: '',
  category: 'WEB_APP',
  repoUrl: '',
  liveUrl: '',
  techStack: '',
  starsCount: 0,
  forksCount: 0,
  linesOfCode: 0,
  status: 'COMPLETED',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formState, setFormState] = useState<ProfileFormState>({
    headline: '',
    bio: '',
    location: '',
    targetRole: '',
    yearsOfExperience: 0,
    expectedSalary: '',
    availabilityStatus: 'OPEN_TO_WORK',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Project Modal State (Create / Edit)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(INITIAL_PROJECT_FORM);
  const [projectValidationErrors, setProjectValidationErrors] = useState<Record<string, string>>(
    {},
  );
  const [isSubmittingProject, setIsSubmittingProject] = useState<boolean>(false);
  const [projectModalError, setProjectModalError] = useState<string | null>(null);

  // Delete Project Confirmation Modal State
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const populateFormFromProfile = (data: UserData) => {
    setFormState({
      headline: data.headline || '',
      bio: data.bio || '',
      location: data.location || '',
      targetRole: data.profile?.targetRole || '',
      yearsOfExperience: data.profile?.yearsOfExperience ?? 0,
      expectedSalary:
        data.profile?.expectedSalary !== null && data.profile?.expectedSalary !== undefined
          ? data.profile.expectedSalary
          : '',
      availabilityStatus: data.profile?.availabilityStatus || 'OPEN_TO_WORK',
    });
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await getProfileApi();
      if (response && response.success && response.data) {
        setProfile(response.data);
        populateFormFromProfile(response.data);
      } else {
        setFetchError(response?.message || 'Failed to load user profile.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'A network error occurred while loading profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    setProjectsError(null);
    try {
      const response = await getProjectsApi();
      if (response && response.success && Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjectsError(response?.message || 'Failed to load projects.');
      }
    } catch (err: any) {
      setProjectsError(err?.message || 'A network error occurred while loading projects.');
    } finally {
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchProjects();
  }, []);

  // Profile Edit Handlers
  const handleOpenEdit = () => {
    if (profile) {
      populateFormFromProfile(profile);
    }
    setSaveError(null);
    setSuccessMessage(null);
    setValidationErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      populateFormFromProfile(profile);
    }
    setSaveError(null);
    setValidationErrors({});
    setIsEditing(false);
  };

  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formState.yearsOfExperience !== '') {
      const expNum = Number(formState.yearsOfExperience);
      if (isNaN(expNum) || expNum < 0) {
        errors.yearsOfExperience = 'Years of experience must be a non-negative number.';
      } else if (expNum > 60) {
        errors.yearsOfExperience = 'Years of experience cannot exceed 60.';
      }
    }

    if (formState.expectedSalary !== '') {
      const salNum = Number(formState.expectedSalary);
      if (isNaN(salNum) || salNum < 0) {
        errors.expectedSalary = 'Expected salary must be a non-negative number.';
      }
    }

    if (formState.headline && formState.headline.length > 150) {
      errors.headline = 'Headline must not exceed 150 characters.';
    }

    if (formState.bio && formState.bio.length > 1000) {
      errors.bio = 'Bio must not exceed 1000 characters.';
    }

    if (formState.location && formState.location.length > 100) {
      errors.location = 'Location must not exceed 100 characters.';
    }

    if (formState.targetRole && formState.targetRole.length > 100) {
      errors.targetRole = 'Target role must not exceed 100 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (!validateProfileForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        headline: formState.headline.trim() || undefined,
        bio: formState.bio.trim() || undefined,
        location: formState.location.trim() || undefined,
        targetRole: formState.targetRole.trim() || undefined,
        yearsOfExperience:
          formState.yearsOfExperience === '' ? 0 : Number(formState.yearsOfExperience),
        expectedSalary: formState.expectedSalary === '' ? null : Number(formState.expectedSalary),
        availabilityStatus: formState.availabilityStatus || 'OPEN_TO_WORK',
      };

      const response = await updateProfileApi(payload);

      if (response && response.success && response.data) {
        setProfile(response.data);
        populateFormFromProfile(response.data);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
      } else {
        setSaveError(response?.message || 'Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'A network error occurred while updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Project Modal Handlers
  const handleOpenAddProject = () => {
    setEditingProjectId(null);
    setProjectForm(INITIAL_PROJECT_FORM);
    setProjectValidationErrors({});
    setProjectModalError(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: ProjectItem) => {
    setEditingProjectId(proj.id);
    setProjectForm({
      title: proj.title,
      description: proj.description,
      category: proj.category || 'WEB_APP',
      repoUrl: proj.repoUrl || '',
      liveUrl: proj.liveUrl || '',
      techStack: Array.isArray(proj.techStack) ? proj.techStack.join(', ') : '',
      starsCount: proj.starsCount ?? 0,
      forksCount: proj.forksCount ?? 0,
      linesOfCode: proj.linesOfCode ?? 0,
      status: proj.status || 'COMPLETED',
    });
    setProjectValidationErrors({});
    setProjectModalError(null);
    setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProjectId(null);
    setProjectForm(INITIAL_PROJECT_FORM);
    setProjectValidationErrors({});
    setProjectModalError(null);
  };

  const validateProjectForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!projectForm.title || !projectForm.title.trim()) {
      errors.title = 'Project title is required.';
    } else if (projectForm.title.trim().length > 150) {
      errors.title = 'Title must not exceed 150 characters.';
    }

    if (!projectForm.description || !projectForm.description.trim()) {
      errors.description = 'Project description is required.';
    } else if (projectForm.description.trim().length > 5000) {
      errors.description = 'Description must not exceed 5000 characters.';
    }

    if (projectForm.starsCount !== '') {
      const stars = Number(projectForm.starsCount);
      if (isNaN(stars) || stars < 0 || !Number.isInteger(stars)) {
        errors.starsCount = 'Stars count must be a non-negative integer.';
      }
    }

    if (projectForm.forksCount !== '') {
      const forks = Number(projectForm.forksCount);
      if (isNaN(forks) || forks < 0 || !Number.isInteger(forks)) {
        errors.forksCount = 'Forks count must be a non-negative integer.';
      }
    }

    if (projectForm.linesOfCode !== '') {
      const loc = Number(projectForm.linesOfCode);
      if (isNaN(loc) || loc < 0 || !Number.isInteger(loc)) {
        errors.linesOfCode = 'Lines of code must be a non-negative integer.';
      }
    }

    if (projectForm.repoUrl && projectForm.repoUrl.trim()) {
      try {
        new URL(projectForm.repoUrl.trim());
      } catch {
        errors.repoUrl = 'Please enter a valid URL (e.g. https://github.com/owner/repo).';
      }
    }

    if (projectForm.liveUrl && projectForm.liveUrl.trim()) {
      try {
        new URL(projectForm.liveUrl.trim());
      } catch {
        errors.liveUrl = 'Please enter a valid URL (e.g. https://example.com).';
      }
    }

    setProjectValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProjectModalError(null);

    if (!validateProjectForm()) {
      return;
    }

    setIsSubmittingProject(true);
    try {
      const parsedTechStack = projectForm.techStack
        ? projectForm.techStack
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        category: projectForm.category,
        repoUrl: projectForm.repoUrl.trim() || undefined,
        liveUrl: projectForm.liveUrl.trim() || undefined,
        techStack: parsedTechStack,
        starsCount: projectForm.starsCount === '' ? 0 : Number(projectForm.starsCount),
        forksCount: projectForm.forksCount === '' ? 0 : Number(projectForm.forksCount),
        linesOfCode: projectForm.linesOfCode === '' ? 0 : Number(projectForm.linesOfCode),
        status: projectForm.status || 'COMPLETED',
      };

      if (editingProjectId) {
        // Update existing project
        const response = await updateProjectApi(editingProjectId, payload);
        if (response && response.success && response.data) {
          setProjects((prev) => prev.map((p) => (p.id === editingProjectId ? response.data : p)));
          handleCloseProjectModal();
          setSuccessMessage('Project updated successfully!');
        } else {
          setProjectModalError(response?.message || 'Failed to update project.');
        }
      } else {
        // Create new project
        const response = await createProjectApi(payload);
        if (response && response.success && response.data) {
          setProjects((prev) => [response.data, ...prev]);
          handleCloseProjectModal();
          setSuccessMessage('Project created successfully!');
        } else {
          setProjectModalError(response?.message || 'Failed to create project.');
        }
      }
    } catch (err: any) {
      setProjectModalError(err?.message || 'A network error occurred while saving the project.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // Delete Project Handlers
  const handleOpenDeleteConfirm = (proj: ProjectItem) => {
    setProjectToDelete(proj);
    setDeleteError(null);
  };

  const handleCloseDeleteConfirm = () => {
    setProjectToDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeletingProject(true);
    setDeleteError(null);
    try {
      const response = await deleteProjectApi(projectToDelete.id);
      if (response && response.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        setSuccessMessage(`Project "${projectToDelete.title}" deleted successfully.`);
        handleCloseDeleteConfirm();
      } else {
        setDeleteError(response?.message || 'Failed to delete project.');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'A network error occurred while deleting the project.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const getInitials = (first?: string, last?: string) => {
    const f = (first || '').trim()[0] || '';
    const l = (last || '').trim()[0] || '';
    return (f + l).toUpperCase() || 'U';
  };

  const formatAvailabilityLabel = (status?: string | null) => {
    switch (status) {
      case 'OPEN_TO_WORK':
        return 'Open to Work';
      case 'ACTIVELY_INTERVIEWING':
        return 'Actively Interviewing';
      case 'CASUALLY_LOOKING':
        return 'Casually Looking';
      case 'NOT_LOOKING':
        return 'Not Looking';
      default:
        return status || 'Open to Work';
    }
  };

  const formatCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'WEB_APP':
        return 'Web Application';
      case 'MOBILE_APP':
        return 'Mobile App';
      case 'BACKEND_SERVICE':
        return 'Backend Service';
      case 'AI_ML_MODEL':
        return 'AI / ML Model';
      case 'CLI_TOOL':
        return 'CLI Tool';
      case 'OPEN_SOURCE':
        return 'Open Source';
      case 'OTHER':
        return 'Other';
      default:
        return cat || 'Web App';
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        {/* Profile Loading Skeleton */}
        {isLoading && (
          <div className="glass-panel p-12 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-medium">Loading candidate profile...</p>
          </div>
        )}

        {/* Profile Fetch Error */}
        {!isLoading && fetchError && (
          <div className="glass-panel p-8 text-center space-y-4 border border-rose-900/50 bg-rose-950/20">
            <p className="text-sm font-semibold text-rose-400">{fetchError}</p>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-800 rounded-lg hover:bg-emerald-950/60 transition-all"
            >
              Retry Loading Profile
            </button>
          </div>
        )}

        {/* Success Global Notification Banner */}
        {successMessage && (
          <div
            id="profile-success-alert"
            className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-fade-in"
          >
            <span>✓ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && profile && (
          <>
            {/* Profile Overview Header Card */}
            <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg shadow-emerald-900/30">
                  {getInitials(profile.firstName, profile.lastName)}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1
                      id="profile-name-display"
                      className="text-2xl sm:text-3xl font-black text-slate-100"
                    >
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {profile.role}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full">
                      {formatAvailabilityLabel(profile.profile?.availabilityStatus)}
                    </span>
                  </div>
                  <p id="profile-headline-display" className="text-sm font-medium text-emerald-400">
                    {profile.headline || 'No headline specified'}
                  </p>
                  <p
                    id="profile-location-display"
                    className="text-xs text-slate-400 flex items-center gap-1.5"
                  >
                    <span>📍 {profile.location || 'Location not specified'}</span>
                    <span>•</span>
                    <span>✉ {profile.email}</span>
                  </p>
                </div>
              </div>

              {!isEditing && (
                <button
                  id="edit-profile-btn"
                  onClick={handleOpenEdit}
                  className="w-full sm:w-auto glass-button px-5 py-2.5 text-xs font-bold text-emerald-400 rounded-xl flex items-center justify-center gap-2 hover:border-emerald-400 transition-all cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>

            {/* EDIT PROFILE FORM PANEL */}
            {isEditing && (
              <div
                id="edit-profile-form-container"
                className="glass-panel p-6 sm:p-8 space-y-6 border border-emerald-500/40 shadow-2xl shadow-emerald-950/20"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Edit Profile Details</h2>
                    <p className="text-xs text-slate-400">
                      Update your headline, career trajectory, bio, and job readiness preferences.
                    </p>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1"
                  >
                    ✕ Close
                  </button>
                </div>

                {saveError && (
                  <div
                    id="profile-save-error"
                    className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium"
                  >
                    {saveError}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Headline */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-headline-input"
                      className="text-xs font-semibold text-slate-300 flex justify-between"
                    >
                      <span>Professional Headline</span>
                      <span className="text-[10px] text-slate-500">
                        {formState.headline.length}/150
                      </span>
                    </label>
                    <input
                      id="profile-headline-input"
                      type="text"
                      placeholder="e.g. Senior Full Stack AI Engineer & Open Source Maintainer"
                      value={formState.headline}
                      onChange={(e) => setFormState({ ...formState, headline: e.target.value })}
                      maxLength={150}
                      disabled={isSaving}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    {validationErrors.headline && (
                      <p className="text-[10px] text-rose-400 font-medium">
                        {validationErrors.headline}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-bio-input"
                      className="text-xs font-semibold text-slate-300 flex justify-between"
                    >
                      <span>Bio & Summary</span>
                      <span className="text-[10px] text-slate-500">
                        {formState.bio.length}/1000
                      </span>
                    </label>
                    <textarea
                      id="profile-bio-input"
                      rows={4}
                      placeholder="Share your background, key technologies, and engineering passion..."
                      value={formState.bio}
                      onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                      maxLength={1000}
                      disabled={isSaving}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    {validationErrors.bio && (
                      <p className="text-[10px] text-rose-400 font-medium">
                        {validationErrors.bio}
                      </p>
                    )}
                  </div>

                  {/* Location & Target Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-location-input"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Location
                      </label>
                      <input
                        id="profile-location-input"
                        type="text"
                        placeholder="e.g. Tamil Nadu, India / San Francisco, CA"
                        value={formState.location}
                        onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                        maxLength={100}
                        disabled={isSaving}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {validationErrors.location && (
                        <p className="text-[10px] text-rose-400 font-medium">
                          {validationErrors.location}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-targetRole-input"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Target Role
                      </label>
                      <input
                        id="profile-targetRole-input"
                        type="text"
                        placeholder="e.g. Lead AI Systems Engineer"
                        value={formState.targetRole}
                        onChange={(e) => setFormState({ ...formState, targetRole: e.target.value })}
                        maxLength={100}
                        disabled={isSaving}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {validationErrors.targetRole && (
                        <p className="text-[10px] text-rose-400 font-medium">
                          {validationErrors.targetRole}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metrics & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-yearsOfExperience-input"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Years of Experience
                      </label>
                      <input
                        id="profile-yearsOfExperience-input"
                        type="number"
                        min="0"
                        max="60"
                        step="1"
                        placeholder="0"
                        value={formState.yearsOfExperience}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            yearsOfExperience:
                              e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                          })
                        }
                        disabled={isSaving}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {validationErrors.yearsOfExperience && (
                        <p className="text-[10px] text-rose-400 font-medium">
                          {validationErrors.yearsOfExperience}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-expectedSalary-input"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Expected Salary (USD / Annual)
                      </label>
                      <input
                        id="profile-expectedSalary-input"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="e.g. 140000"
                        value={formState.expectedSalary}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            expectedSalary:
                              e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                          })
                        }
                        disabled={isSaving}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {validationErrors.expectedSalary && (
                        <p className="text-[10px] text-rose-400 font-medium">
                          {validationErrors.expectedSalary}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-availabilityStatus-input"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Availability Status
                      </label>
                      <select
                        id="profile-availabilityStatus-input"
                        value={formState.availabilityStatus}
                        onChange={(e) =>
                          setFormState({ ...formState, availabilityStatus: e.target.value })
                        }
                        disabled={isSaving}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="OPEN_TO_WORK">Open to Work</option>
                        <option value="ACTIVELY_INTERVIEWING">Actively Interviewing</option>
                        <option value="CASUALLY_LOOKING">Casually Looking</option>
                        <option value="NOT_LOOKING">Not Looking</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      id="cancel-edit-btn"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-5 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="save-profile-btn"
                      disabled={isSaving}
                      className="glass-button px-6 py-2.5 text-xs font-bold text-emerald-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Read-Only Profile Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* About & Bio Card */}
              <div className="glass-panel p-6 space-y-3 border border-slate-800">
                <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <span>About & Bio</span>
                </h2>
                <p
                  id="profile-bio-display"
                  className="text-xs text-slate-300 leading-relaxed whitespace-pre-line"
                >
                  {profile.bio || 'No personal bio added yet. Click "Edit Profile" to add one.'}
                </p>
              </div>

              {/* Career Trajectory & Preferences Card */}
              <div className="glass-panel p-6 space-y-4 border border-slate-800">
                <h2 className="text-base font-bold text-slate-200">Career Overview</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Target Role</span>
                    <span id="profile-targetRole-display" className="font-semibold text-slate-200">
                      {profile.profile?.targetRole || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Years of Experience</span>
                    <span id="profile-experience-display" className="font-semibold text-slate-200">
                      {profile.profile?.yearsOfExperience ?? 0} years
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Expected Salary</span>
                    <span
                      id="profile-salary-display"
                      className="font-semibold text-emerald-400 font-mono"
                    >
                      {profile.profile?.expectedSalary
                        ? `$${Number(profile.profile.expectedSalary).toLocaleString()}/yr`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Job Search Status</span>
                    <span
                      id="profile-availability-display"
                      className="font-semibold text-slate-200"
                    >
                      {formatAvailabilityLabel(profile.profile?.availabilityStatus)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PROJECTS SECTION */}
            {/* ========================================================================= */}
            <div className="space-y-6 pt-4">
              {/* Projects Section Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-100">Engineering Projects</h2>
                    <span
                      id="projects-count-badge"
                      className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full"
                    >
                      {projects.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Showcase your architectures, repositories, live deployments, and system builds.
                  </p>
                </div>
                <button
                  id="add-project-btn"
                  onClick={handleOpenAddProject}
                  className="glass-button px-4 py-2 text-xs font-bold text-emerald-400 rounded-xl flex items-center gap-1.5 hover:border-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-950/30"
                >
                  <span className="text-base leading-none">+</span> Add Project
                </button>
              </div>

              {/* Projects Loading State */}
              {isProjectsLoading && (
                <div className="glass-panel p-10 text-center space-y-3 border border-slate-800">
                  <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-400">Loading your project portfolio...</p>
                </div>
              )}

              {/* Projects Error State */}
              {!isProjectsLoading && projectsError && (
                <div className="glass-panel p-6 text-center space-y-3 border border-rose-900/40 bg-rose-950/20">
                  <p className="text-xs text-rose-400 font-semibold">{projectsError}</p>
                  <button
                    onClick={fetchProjects}
                    className="px-3 py-1.5 text-[11px] font-bold text-emerald-400 border border-emerald-800 rounded-lg hover:bg-emerald-950/60 transition-all"
                  >
                    Retry Loading Projects
                  </button>
                </div>
              )}

              {/* Projects Empty State */}
              {!isProjectsLoading && !projectsError && projects.length === 0 && (
                <div
                  id="projects-empty-state"
                  className="glass-panel p-10 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl">
                    📁
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">No projects added yet</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Add your engineering projects to highlight your tech stack, system
                      architecture, and code contributions to recruiters.
                    </p>
                  </div>
                  <button
                    id="add-first-project-btn"
                    onClick={handleOpenAddProject}
                    className="glass-button px-5 py-2 text-xs font-bold text-emerald-400 rounded-xl inline-flex items-center gap-1.5 hover:border-emerald-400 transition-all cursor-pointer"
                  >
                    <span>+</span> Add Your First Project
                  </button>
                </div>
              )}

              {/* Projects Cards Grid */}
              {!isProjectsLoading && !projectsError && projects.length > 0 && (
                <div id="projects-grid-container" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      id={`project-card-${proj.id}`}
                      className="glass-panel p-5 space-y-4 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Card Header: Category Badge, Status Badge & Actions */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold rounded-md uppercase">
                              {formatCategoryLabel(proj.category)}
                            </span>
                            {proj.status && (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md">
                                {proj.status}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              id={`edit-project-btn-${proj.id}`}
                              onClick={() => handleOpenEditProject(proj)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors rounded hover:bg-slate-800/60"
                              title="Edit Project"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              id={`delete-project-btn-${proj.id}`}
                              onClick={() => handleOpenDeleteConfirm(proj)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded hover:bg-slate-800/60"
                              title="Delete Project"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Title & Slug */}
                        <div className="space-y-0.5">
                          <h3
                            id={`project-title-${proj.id}`}
                            className="text-base font-bold text-slate-100"
                          >
                            {proj.title}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono">slug: {proj.slug}</p>
                        </div>

                        {/* Description */}
                        <p
                          id={`project-desc-${proj.id}`}
                          className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line"
                        >
                          {proj.description}
                        </p>

                        {/* Tech Stack Chips */}
                        {Array.isArray(proj.techStack) && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.techStack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 text-slate-300 text-[10px] font-medium rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Metrics & Links */}
                      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          {proj.starsCount > 0 && <span>⭐ {proj.starsCount}</span>}
                          {proj.forksCount > 0 && <span>🍴 {proj.forksCount}</span>}
                          {proj.linesOfCode > 0 && (
                            <span>💻 {proj.linesOfCode.toLocaleString()} loc</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {proj.repoUrl && (
                            <a
                              href={proj.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 hover:underline"
                            >
                              <span>Repository ↗</span>
                            </a>
                          )}
                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 hover:underline"
                            >
                              <span>Live Demo ↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* ADD / EDIT PROJECT MODAL */}
            {/* ========================================================================= */}
            {isProjectModalOpen && (
              <div
                id="project-modal-backdrop"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
              >
                <div
                  id="project-modal-card"
                  className="glass-panel w-full max-w-xl p-6 sm:p-8 space-y-5 border border-emerald-500/40 shadow-2xl my-8"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 id="project-modal-title" className="text-lg font-bold text-slate-100">
                      {editingProjectId
                        ? 'Edit Engineering Project'
                        : 'Add New Engineering Project'}
                    </h2>
                    <button
                      id="close-project-modal-btn"
                      onClick={handleCloseProjectModal}
                      className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {projectModalError && (
                    <div
                      id="project-modal-error"
                      className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium"
                    >
                      {projectModalError}
                    </div>
                  )}

                  <form onSubmit={handleSaveProject} className="space-y-4">
                    {/* Project Title */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="project-title-input"
                        className="text-xs font-semibold text-slate-300 flex justify-between"
                      >
                        <span>Project Title *</span>
                        <span className="text-[10px] text-slate-500">
                          {projectForm.title.length}/150
                        </span>
                      </label>
                      <input
                        id="project-title-input"
                        type="text"
                        placeholder="e.g. Distributed Vector Similarity Engine"
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                        maxLength={150}
                        disabled={isSubmittingProject}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {projectValidationErrors.title && (
                        <p className="text-[10px] text-rose-400 font-medium">
                          {projectValidationErrors.title}
                        </p>
                      )}
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-category-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Project Category *
                        </label>
                        <select
                          id="project-category-input"
                          value={projectForm.category}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, category: e.target.value })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          <option value="WEB_APP">Web Application</option>
                          <option value="MOBILE_APP">Mobile Application</option>
                          <option value="BACKEND_SERVICE">Backend / Microservice</option>
                          <option value="AI_ML_MODEL">AI / ML Model</option>
                          <option value="CLI_TOOL">CLI Tool</option>
                          <option value="OPEN_SOURCE">Open Source Library</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-status-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Project Status
                        </label>
                        <select
                          id="project-status-input"
                          value={projectForm.status}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, status: e.target.value })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          <option value="COMPLETED">Completed</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="MAINTAINED">Actively Maintained</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="project-description-input"
                        className="text-xs font-semibold text-slate-300 flex justify-between"
                      >
                        <span>Description & Technical Architecture *</span>
                        <span className="text-[10px] text-slate-500">
                          {projectForm.description.length}/5000
                        </span>
                      </label>
                      <textarea
                        id="project-description-input"
                        rows={4}
                        placeholder="Explain system architecture, technical problems solved, algorithms used, and results achieved..."
                        value={projectForm.description}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, description: e.target.value })
                        }
                        maxLength={5000}
                        disabled={isSubmittingProject}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {projectValidationErrors.description && (
                        <p className="text-[10px] text-rose-400 font-medium">
                          {projectValidationErrors.description}
                        </p>
                      )}
                    </div>

                    {/* Tech Stack */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="project-techStack-input"
                        className="text-xs font-semibold text-slate-300 flex justify-between"
                      >
                        <span>Tech Stack</span>
                        <span className="text-[10px] text-slate-500">comma separated</span>
                      </label>
                      <input
                        id="project-techStack-input"
                        type="text"
                        placeholder="e.g. TypeScript, React, Next.js, Node.js, PostgreSQL, Docker"
                        value={projectForm.techStack}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, techStack: e.target.value })
                        }
                        disabled={isSubmittingProject}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    {/* URLs: Repo & Live */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-repoUrl-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Repository URL
                        </label>
                        <input
                          id="project-repoUrl-input"
                          type="url"
                          placeholder="https://github.com/org/repo"
                          value={projectForm.repoUrl}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, repoUrl: e.target.value })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        {projectValidationErrors.repoUrl && (
                          <p className="text-[10px] text-rose-400 font-medium">
                            {projectValidationErrors.repoUrl}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-liveUrl-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Live Demo URL
                        </label>
                        <input
                          id="project-liveUrl-input"
                          type="url"
                          placeholder="https://project.domain.com"
                          value={projectForm.liveUrl}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, liveUrl: e.target.value })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        {projectValidationErrors.liveUrl && (
                          <p className="text-[10px] text-rose-400 font-medium">
                            {projectValidationErrors.liveUrl}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metrics: Stars, Forks, Lines of Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-starsCount-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Stars Count
                        </label>
                        <input
                          id="project-starsCount-input"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={projectForm.starsCount}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              starsCount:
                                e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                            })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        {projectValidationErrors.starsCount && (
                          <p className="text-[10px] text-rose-400 font-medium">
                            {projectValidationErrors.starsCount}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-forksCount-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Forks Count
                        </label>
                        <input
                          id="project-forksCount-input"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={projectForm.forksCount}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              forksCount:
                                e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                            })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        {projectValidationErrors.forksCount && (
                          <p className="text-[10px] text-rose-400 font-medium">
                            {projectValidationErrors.forksCount}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-linesOfCode-input"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Lines of Code
                        </label>
                        <input
                          id="project-linesOfCode-input"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={projectForm.linesOfCode}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              linesOfCode:
                                e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                            })
                          }
                          disabled={isSubmittingProject}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        {projectValidationErrors.linesOfCode && (
                          <p className="text-[10px] text-rose-400 font-medium">
                            {projectValidationErrors.linesOfCode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        id="cancel-project-modal-btn"
                        onClick={handleCloseProjectModal}
                        disabled={isSubmittingProject}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="save-project-btn"
                        disabled={isSubmittingProject}
                        className="glass-button px-5 py-2 text-xs font-bold text-emerald-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                      >
                        {isSubmittingProject ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            {editingProjectId ? 'Saving...' : 'Creating...'}
                          </>
                        ) : editingProjectId ? (
                          'Save Changes'
                        ) : (
                          'Create Project'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* DELETE PROJECT CONFIRMATION DIALOG */}
            {/* ========================================================================= */}
            {projectToDelete && (
              <div
                id="delete-modal-backdrop"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
              >
                <div
                  id="delete-modal-card"
                  className="glass-panel w-full max-w-md p-6 space-y-4 border border-rose-900/60 bg-slate-950 shadow-2xl"
                >
                  <div className="flex items-center gap-3 text-rose-400">
                    <span className="text-xl">⚠️</span>
                    <h3 className="text-base font-bold text-slate-100">
                      Delete Engineering Project
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Are you sure you want to delete{' '}
                    <span className="font-bold text-rose-300">"{projectToDelete.title}"</span>? This
                    action will remove this project permanently from your SkillDNA portfolio.
                  </p>

                  {deleteError && (
                    <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      id="cancel-delete-project-btn"
                      onClick={handleCloseDeleteConfirm}
                      disabled={isDeletingProject}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="confirm-delete-project-btn"
                      onClick={handleConfirmDelete}
                      disabled={isDeletingProject}
                      className="px-5 py-2 text-xs font-bold text-rose-100 bg-rose-900/80 border border-rose-700 hover:bg-rose-800 rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-rose-950/50"
                    >
                      {isDeletingProject ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-rose-300/30 border-t-rose-300 rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Project'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
