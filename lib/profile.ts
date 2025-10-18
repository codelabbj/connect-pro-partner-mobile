// Profile service for handling user profile operations

export interface UserProfile {
  uid: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  display_name: string;
  is_verified: boolean;
  contact_method: string;
  created_at: string;
  updated_at: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_partner?: boolean;
}

export interface UpdateProfilePayload {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  contact_method?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
  changes: string[];
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

class ProfileService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Get user profile
  async getProfile(accessToken: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get profile');
      }

      const data: UserProfile = await response.json();
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(accessToken: string, payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If it's a validation error with field-specific messages, stringify it
        if (errorData && typeof errorData === 'object') {
          throw new Error(JSON.stringify(errorData));
        }
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data: UpdateProfileResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(accessToken: string, payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/password-update/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If it's a validation error with field-specific messages, stringify it
        if (errorData && typeof errorData === 'object') {
          throw new Error(JSON.stringify(errorData));
        }
        throw new Error(errorData.detail || 'Failed to change password');
      }

      const data: ChangePasswordResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const profileService = new ProfileService();
