// Recharge service for handling recharge operations

export interface RechargeData {
  uid: string;
  amount: string;
  formatted_amount: string;
  status: "pending" | "approved" | "rejected" | "expired" | "proof_submitted";
  status_display: string;
  transaction_date: string | null;
  proof_image: string | null;
  proof_description: string;
  reference: string;
  created_at: string;
  expires_at: string;
  can_submit_proof: boolean;
  can_be_reviewed: boolean;
  is_expired: boolean;
  time_remaining: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  processed_at: string | null;
  rejection_reason: string;
  admin_notes: string;
}

export interface RechargesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RechargeData[];
}

export interface CreateRechargePayload {
  amount: string;
  proof_image: File | null;
  proof_description: string;
  transaction_date: string | null;
}

class RechargeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Get user recharges
  async getRecharges(accessToken: string, page: number = 1, limit: number = 10): Promise<RechargesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/user/recharges/?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get recharges');
      }

      const data: RechargesResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get recharges error:', error);
      throw error;
    }
  }

  // Create a new recharge
  async createRecharge(accessToken: string, payload: CreateRechargePayload): Promise<RechargeData> {
    try {
      const formData = new FormData();
      formData.append('amount', payload.amount);
      formData.append('proof_description', payload.proof_description);
      
      if (payload.proof_image) {
        formData.append('proof_image', payload.proof_image);
      }
      
      if (payload.transaction_date) {
        formData.append('transaction_date', payload.transaction_date);
      }

      const response = await fetch(`${this.baseUrl}/api/payments/user/recharges/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If it's a validation error with field-specific messages, stringify it
        if (errorData && typeof errorData === 'object') {
          throw new Error(JSON.stringify(errorData));
        }
        throw new Error(errorData.detail || 'Failed to create recharge');
      }

      const data: RechargeData = await response.json();
      return data;
    } catch (error) {
      console.error('Create recharge error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const rechargeService = new RechargeService();
