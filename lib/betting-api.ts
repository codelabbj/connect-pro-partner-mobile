// Betting platform API functions

import { authService } from './auth';
import { formatApiErrorMessage } from './utils'
import {
  BettingPlatform,
  BettingPlatformsResponse,
  BettingPlatformsWithPermissionsResponse,
  BettingPlatformsWithStatsResponse,
  BettingTransaction,
  BettingTransactionsResponse,
  CreateDepositPayload,
  CreateWithdrawalPayload,
  CreateTransactionResponse,
  VerifyUserIdPayload,
  VerifyUserIdResponse,
  BettingCommissionStats,
  UnpaidCommissionsResponse,
  CommissionRates,
  PaymentHistoryResponse,
  ExternalPlatformData,
} from './betting';

class BettingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Get all platforms user is authorized to use
  async getPlatforms(): Promise<BettingPlatformsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/platforms/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get platforms error:', error);
      throw error;
    }
  }

  // Get platform detail by UID
  async getPlatformDetail(platformUid: string): Promise<BettingPlatform> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/platforms/${platformUid}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get platform detail error:', error);
      throw error;
    }
  }

  // Get platforms with permissions
  async getPlatformsWithPermissions(): Promise<BettingPlatformsWithPermissionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/platforms/platforms_with_permissions/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get platforms with permissions error:', error);
      throw error;
    }
  }

  // Get platforms with stats
  async getPlatformsWithStats(): Promise<BettingPlatformsWithStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/platforms/platforms_with_stats/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get platforms with stats error:', error);
      throw error;
    }
  }

  // Get betting transactions with filters
  async getBettingTransactions(params: {
    status?: string;
    transaction_type?: string;
    platform?: string;
    ordering?: string;
    page?: number;
  } = {}): Promise<BettingTransactionsResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.status) searchParams.append('status', params.status);
      if (params.transaction_type) searchParams.append('transaction_type', params.transaction_type);
      if (params.platform) searchParams.append('platform', params.platform);
      if (params.ordering) searchParams.append('ordering', params.ordering);
      if (params.page) searchParams.append('page', params.page.toString());

      const url = `${this.baseUrl}/api/payments/betting/user/transactions/my_transactions/?${searchParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get betting transactions error:', error);
      throw error;
    }
  }

  // Verify betting user ID
  async verifyUserId(payload: VerifyUserIdPayload): Promise<VerifyUserIdResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/transactions/verify_user_id/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Verify user ID error:', error);
      throw error;
    }
  }

  // Create deposit transaction
  async createDeposit(payload: CreateDepositPayload): Promise<CreateTransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/transactions/create_deposit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Create deposit error:', error);
      throw error;
    }
  }

  // Create withdrawal transaction
  async createWithdrawal(payload: CreateWithdrawalPayload): Promise<CreateTransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/transactions/create_withdrawal/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Create withdrawal error:', error);
      throw error;
    }
  }

  // Get commission stats
  async getCommissionStats(params: {
    date_from?: string;
    date_to?: string;
  } = {}): Promise<BettingCommissionStats> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.date_from) searchParams.append('date_from', params.date_from);
      if (params.date_to) searchParams.append('date_to', params.date_to);

      const url = `${this.baseUrl}/api/payments/betting/user/commissions/my_stats/?${searchParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get commission stats error:', error);
      throw error;
    }
  }

  // Get unpaid commissions
  async getUnpaidCommissions(): Promise<UnpaidCommissionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/commissions/unpaid_commissions/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get unpaid commissions error:', error);
      throw error;
    }
  }

  // Get current commission rates
  async getCurrentRates(): Promise<CommissionRates> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/commissions/current_rates/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get commission rates error:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(limit: number = 50): Promise<PaymentHistoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/betting/user/commissions/payment_history/?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }

  // Get external platform data (public, no auth required)
  async getExternalPlatformData(): Promise<ExternalPlatformData[]> {
    try {
      const response = await fetch('https://api.blaffa.net/blaffa/app_name', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Non-blocking: return empty array on failure
        console.warn('Failed to fetch external platform data:', response.status);
        return [];
      }

      const data = await response.json();
      // Handle both array and object responses
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Non-blocking: return empty array on error
      console.warn('Error fetching external platform data:', error);
      return [];
    }
  }
}

// Create singleton instance
export const bettingService = new BettingService();





