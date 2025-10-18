// Transaction creation service

export interface CreateTransactionPayload {
  type: "deposit" | "withdrawal";
  amount: number;
  recipient_phone: string;
  network: string;
}

export interface CreateTransactionResponse {
  uid: string;
  reference: string;
  type: string;
  amount: string;
  recipient_phone: string;
  recipient_name: string | null;
  objet: string;
  status: string;
  network: string;
  network_name: string;
  created_at: string;
  updated_at: string;
}

class CreateTransactionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Create a new transaction
  async createTransaction(accessToken: string, payload: CreateTransactionPayload): Promise<CreateTransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/user/transactions/`, {
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
        throw new Error(errorData.detail || 'Failed to create transaction');
      }

      const data: CreateTransactionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const createTransactionService = new CreateTransactionService();
