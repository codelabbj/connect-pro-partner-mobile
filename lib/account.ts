// Account service for handling user account data

export interface AccountData {
  uid: string;
  balance: string;
  formatted_balance: string;
  total_recharged: string;
  total_deposited: string;
  total_withdrawn: string;
  is_active: boolean;
  is_frozen: boolean;
  daily_deposit_limit: string;
  daily_withdrawal_limit: string;
  last_transaction_at: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  net_flow: number;
  utilization_rate: number;
}

class AccountService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Get user account data
  async getAccountData(accessToken: string): Promise<AccountData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/user/account/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get account data');
      }

      const data: AccountData = await response.json();
      return data;
    } catch (error) {
      console.error('Get account data error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const accountService = new AccountService();
