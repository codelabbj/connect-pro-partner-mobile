// Account history service for handling account balance transactions
import { formatApiErrorMessage } from './utils'

export interface AccountTransaction {
  uid: string;
  type: string;
  type_display: string;
  amount: string;
  formatted_amount: string;
  balance_before: string;
  balance_after: string;
  description: string;
  is_credit: boolean;
  is_debit: boolean;
  created_at: string;
  reference: string;
  related_payment_reference?: string;
  related_payment_recipient?: string;
  metadata?: Record<string, any>;
}

export interface AccountTransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AccountTransaction[];
}

class AccountHistoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Get account transactions (balance history)
  async getAccountTransactions(accessToken: string, page: number = 1, pageSize: number = 10): Promise<AccountTransactionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/user/account/transactions/?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiErrorMessage(errorData));
      }

      const data: AccountTransactionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get account transactions error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const accountHistoryService = new AccountHistoryService();
