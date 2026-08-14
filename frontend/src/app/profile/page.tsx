'use client';

import { useState, useEffect, FormEvent } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { getProfileApi, updateProfileApi } from '@/services/api.service';

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Controlled Form Inputs
  const [formState, setFormState] = useState<ProfileFormState>({
    headline: '',
    bio: '',
    location: '',
    targetRole: '',
    yearsOfExperience: 0,
    expectedSalary: '',
    availabilityStatus: 'OPEN_TO_WORK',
  });

  // Field validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const validateForm = (): boolean => {
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

    if (!validateForm()) {
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

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="glass-panel p-12 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-medium">Loading candidate profile...</p>
          </div>
        )}

        {/* Fetch Error State */}
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

        {/* Profile Content */}
        {!isLoading && profile && (
          <>
            {/* Success Feedback Alert */}
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

                  {/* 2-Column Grid: Location & Target Role */}
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

                  {/* 3-Column Grid: Years of Exp, Expected Salary, Availability Status */}
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

                  {/* Form Action Buttons */}
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
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
