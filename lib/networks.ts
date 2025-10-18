// Networks service for handling mobile money networks

export interface Network {
  uid: string;
  nom: string;
  code: string;
  image: string | null;
  country: string;
  country_name: string;
  is_active: boolean;
  ussd_base_code: string;
  created_at: string;
  updated_at: string;
  sent_deposit_to_module: boolean;
  sent_withdrawal_to_module: boolean;
}

export interface NetworksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Network[];
}

class NetworksService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  // Get available networks
  async getNetworks(accessToken: string): Promise<NetworksResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/networks/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get networks');
      }

      const data: NetworksResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get networks error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const networksService = new NetworksService();
