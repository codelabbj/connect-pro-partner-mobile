// Authentication service for handling login, token management, and refresh

import { formatApiErrorMessage } from './utils'

export interface User {
  uid: string;
  email: string;
  phone: string;
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
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RefreshPayload {
  refresh: string;
}

class AuthService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    // You can set this from environment variables
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    
    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
      
      // Start automatic refresh if we have tokens
      if (this.accessToken && this.refreshToken) {
        this.startTokenRefresh();
      }
    }
  }

  // Login method
  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      const data: AuthResponse = await response.json();
      
      // Store tokens
      this.setTokens(data.access, data.refresh);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Refresh token method
  async refreshAccessToken(): Promise<RefreshResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      const data: RefreshResponse = await response.json();
      
      // Update tokens
      this.setTokens(data.access, data.refresh);
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear tokens and redirect to login
      this.logout();
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(): Promise<User> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      const user: User = await response.json();
      return user;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Validate token method
  async validateToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Set tokens and store in localStorage
  private setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
    
    // Start automatic refresh
    this.startTokenRefresh();
  }

  // Start automatic token refresh
  private startTokenRefresh(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 5 minutes before expiry (assuming 1 hour expiry)
    const refreshInterval = 55 * 60 * 1000; // 55 minutes in milliseconds
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        this.logout();
      }
    }, refreshInterval);
  }

  // Logout method
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Get current refresh token
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.refreshToken;
  }

  // Get authenticated headers for API calls
  getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }
}

// Create singleton instance
export const authService = new AuthService();
