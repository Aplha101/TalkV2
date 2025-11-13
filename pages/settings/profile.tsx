import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { profileUpdateSchema, passwordChangeSchema, accountDeactivationSchema, ProfileUpdateInput, PasswordChangeInput, AccountDeactivationInput } from '@/lib/schemas';
import { validatePassword } from '@/lib/auth';

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Profile form
  const profileForm = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: session?.user?.name || '',
      username: session?.user?.username || '',
      bio: '',
      status: 'OFFLINE',
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  // Account deactivation form
  const deactivationForm = useForm<AccountDeactivationInput>({
    resolver: zodResolver(accountDeactivationSchema),
  });

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);

        // Update form values
        profileForm.reset({
          displayName: data.user.displayName || '',
          username: data.user.username || '',
          bio: data.user.bio || '',
          status: data.user.status || 'OFFLINE',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const updateProfile = async (data: ProfileUpdateInput) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setUserProfile(result.data.user);

        // Update NextAuth session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: result.data.user.displayName,
            username: result.data.user.username,
            bio: result.data.user.bio,
            status: result.data.user.status,
          },
        });
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: PasswordChangeInput) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      // Verify current password
      const verifyResponse = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.currentPassword }),
      });

      if (!verifyResponse.ok) {
        setError('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      // Update password
      const updateResponse = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: data.newPassword }),
      });

      const result: ApiResponse = await updateResponse.json();

      if (result.success) {
        setSuccessMessage('Password changed successfully!');
        passwordForm.reset();
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateAccount = async (data: AccountDeactivationInput) => {
    if (!confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Sign out and redirect to landing page
        await signOut({ redirect: false });
        router.push('/');
      } else {
        setError(result.error || 'Failed to deactivate account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'status-online';
      case 'IDLE': return 'status-idle';
      case 'DO_NOT_DISTURB': return 'status-dnd';
      case 'INVISIBLE': return 'status-offline';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'IDLE': return 'Idle';
      case 'DO_NOT_DISTURB': return 'Do Not Disturb';
      case 'INVISIBLE': return 'Invisible';
      default: return 'Offline';
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-text">User Settings</h1>
          <p className="text-text-secondary mt-2">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-surface-hover text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text'
                }`}
              >
                My Account
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'security'
                    ? 'bg-surface-hover text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'danger'
                    ? 'bg-surface-hover text-danger'
                    : 'text-text-secondary hover:bg-surface hover:text-text'
                }`}
              >
                Danger Zone
              </button>
            </nav>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            {/* Success/Error messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-md">
                <p className="text-success">{successMessage}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-md">
                <p className="text-danger">{error}</p>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-text mb-6">Profile Information</h2>

                  {/* Avatar section */}
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="avatar w-20 h-20 text-2xl">
                      {userProfile?.avatarUrl ? (
                        <img
                          src={userProfile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        session?.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled
                      >
                        Change Avatar (Coming Soon)
                      </button>
                      <p className="text-sm text-text-muted mt-2">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-6">
                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        className={`input w-full ${profileForm.formState.errors.displayName ? 'input-error' : ''}`}
                        {...profileForm.register('displayName')}
                        disabled={isLoading}
                      />
                      {profileForm.formState.errors.displayName && (
                        <p className="mt-1 text-sm text-danger">
                          {profileForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        className={`input w-full ${profileForm.formState.errors.username ? 'input-error' : ''}`}
                        {...profileForm.register('username')}
                        disabled={isLoading}
                      />
                      {profileForm.formState.errors.username && (
                        <p className="mt-1 text-sm text-danger">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        className={`input w-full resize-none ${profileForm.formState.errors.bio ? 'input-error' : ''}`}
                        placeholder="Tell us about yourself"
                        {...profileForm.register('bio')}
                        disabled={isLoading}
                      />
                      {profileForm.formState.errors.bio && (
                        <p className="mt-1 text-sm text-danger">
                          {profileForm.formState.errors.bio.message}
                        </p>
                      )}
                      <p className="text-sm text-text-muted mt-1">
                        {profileForm.watch('bio')?.length || 0}/280 characters
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Status
                      </label>
                      <select
                        className={`input w-full ${profileForm.formState.errors.status ? 'input-error' : ''}`}
                        {...profileForm.register('status')}
                        disabled={isLoading}
                      >
                        <option value="ONLINE">🟢 Online</option>
                        <option value="IDLE">🟡 Idle</option>
                        <option value="DO_NOT_DISTURB">🔴 Do Not Disturb</option>
                        <option value="INVISIBLE">⚫ Invisible</option>
                        <option value="OFFLINE">⚫ Offline</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-text mb-6">Change Password</h2>

                  <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className={`input w-full ${passwordForm.formState.errors.currentPassword ? 'input-error' : ''}`}
                        placeholder="Enter current password"
                        {...passwordForm.register('currentPassword')}
                        disabled={isLoading}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-sm text-danger">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className={`input w-full ${passwordForm.formState.errors.newPassword ? 'input-error' : ''}`}
                        placeholder="Enter new password"
                        {...passwordForm.register('newPassword')}
                        disabled={isLoading}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-sm text-danger">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className={`input w-full ${passwordForm.formState.errors.confirmNewPassword ? 'input-error' : ''}`}
                        placeholder="Confirm new password"
                        {...passwordForm.register('confirmNewPassword')}
                        disabled={isLoading}
                      />
                      {passwordForm.formState.errors.confirmNewPassword && (
                        <p className="mt-1 text-sm text-danger">
                          {passwordForm.formState.errors.confirmNewPassword.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="card p-6 border border-danger/20">
                  <h2 className="text-xl font-semibold text-danger mb-2">Danger Zone</h2>
                  <p className="text-text-secondary mb-6">
                    Irreversible and destructive actions. Please be careful.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-danger/5 rounded-md">
                      <h3 className="font-medium text-text mb-2">Deactivate Account</h3>
                      <p className="text-sm text-text-secondary mb-4">
                        Deactivating your account will remove your profile and all associated data. This action cannot be undone.
                      </p>

                      <form onSubmit={deactivationForm.handleSubmit(deactivateAccount)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            className={`input w-full ${deactivationForm.formState.errors.password ? 'input-error' : ''}`}
                            placeholder="Enter your password to confirm"
                            {...deactivationForm.register('password')}
                            disabled={isLoading}
                          />
                          {deactivationForm.formState.errors.password && (
                            <p className="mt-1 text-sm text-danger">
                              {deactivationForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-2">
                            Type <span className="font-mono bg-surface px-2 py-1 rounded">DEACTIVATE</span> to confirm
                          </label>
                          <input
                            type="text"
                            className={`input w-full ${deactivationForm.formState.errors.confirmation ? 'input-error' : ''}`}
                            placeholder="Type DEACTIVATE"
                            {...deactivationForm.register('confirmation')}
                            disabled={isLoading}
                          />
                          {deactivationForm.formState.errors.confirmation && (
                            <p className="mt-1 text-sm text-danger">
                              {deactivationForm.formState.errors.confirmation.message}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="btn btn-danger"
                        >
                          {isLoading ? 'Deactivating...' : 'Deactivate Account'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}