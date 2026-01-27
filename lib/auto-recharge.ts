// Auto-recharge service for handling auto-recharge operations
import { formatApiErrorMessage } from './utils'
import { authService } from './auth'

export interface AutoRechargeNetwork {
  network: {
    uid: string
    nom: string
    code: string
    image: string | null
    country: string
    country_name: string
    is_active: boolean
    ussd_base_code: string
    created_at: string
    updated_at: string
    sent_deposit_to_module: boolean
    sent_withdrawal_to_module: boolean
  }
  aggregator: {
    uid: string
    name: string
    code: string
    description: string
  }
  min_amount: string
  max_amount: string
  fixed_fee: string
  percentage_fee: string
  aggregator_network_code: string
  aggregator_country_code: string
}

export interface AvailableNetworksResponse {
  count: number
  networks: AutoRechargeNetwork[]
}

export type AutoRechargeStatus = 'pending' | 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired'

export interface AutoRechargeTransaction {
  uid: string
  network: {
    uid: string
    nom: string
    code: string
    image: string | null
    country_name: string
  }
  amount: string
  formatted_amount: string
  phone_number: string
  status: AutoRechargeStatus
  status_display: string
  reference: string
  created_at: string
  updated_at: string
  completed_at: string | null
  failed_at: string | null
  error_message: string | null
  fee: string
  total_amount: string
}

export interface AutoRechargeTransactionsResponse {
  count: number
  next: string | null
  previous: string | null
  results: AutoRechargeTransaction[]
}

export interface AutoRechargeTransactionDetail extends AutoRechargeTransaction {
  // Additional detail fields if any
}

export interface AutoRechargeTransactionStatus {
  status: string
  status_display: string
  completed_at: string | null
  failed_at: string | null
  error_message: string | null
}

export interface InitiateAutoRechargePayload {
  network: string // network_uid
  amount: number
  phone_number: string
}

export interface InitiateAutoRechargeResponse {
  message: string
  transaction: {
    uid: string
    reference: string
    external_reference: string
    user: number
    user_display_name: string
    network: {
      uid: string
      nom: string
      code: string
      image: string | null
      country: string
      country_name: string
      is_active: boolean
      ussd_base_code: string
      created_at: string
      updated_at: string
      sent_deposit_to_module: boolean
      sent_withdrawal_to_module: boolean
      payment_link: string
      payment_ussd: string
    }
    aggregator: {
      uid: string
      name: string
      code: string
      description: string
      default_callback_url: string
      has_link: boolean
      has_ussd: boolean
    }
    phone_number: string
    amount: string
    formatted_amount: string
    fees: string
    formatted_fees: string
    total_amount: string
    formatted_total_amount: string
    amount_credited: string
    formatted_amount_credited: string
    commission_amount: string
    status: string
    status_display: string
    payment_link: string | null
    callback_received: boolean
    is_expired: boolean
    initiated_at: string
    completed_at: string | null
    expires_at: string
    processing_duration: number | null
    error_message: string
    retry_count: number
    created_at: string
    updated_at: string
    metadata: Record<string, any>
    payment_ussd: string | null
  }
}

class AutoRechargeService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  }

  // Get available networks
  async getAvailableNetworks(accessToken: string): Promise<AvailableNetworksResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-recharge/available-networks/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(formatApiErrorMessage(errorData))
      }

      const data: AvailableNetworksResponse = await response.json()
      return data
    } catch (error) {
      console.error('Get available networks error:', error)
      throw error
    }
  }

  // Get auto-recharge transactions
  async getTransactions(accessToken: string, page: number = 1, limit: number = 10): Promise<AutoRechargeTransactionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-recharge/transactions/?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(formatApiErrorMessage(errorData))
      }

      const data: AutoRechargeTransactionsResponse = await response.json()
      return data
    } catch (error) {
      console.error('Get auto-recharge transactions error:', error)
      throw error
    }
  }

  // Get auto-recharge transaction detail
  async getTransactionDetail(accessToken: string, transactionUid: string): Promise<AutoRechargeTransactionDetail> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-recharge/transactions/${transactionUid}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(formatApiErrorMessage(errorData))
      }

      const data: AutoRechargeTransactionDetail = await response.json()
      return data
    } catch (error) {
      console.error('Get auto-recharge transaction detail error:', error)
      throw error
    }
  }

  // Get auto-recharge transaction status
  async getTransactionStatus(accessToken: string, transactionUid: string): Promise<AutoRechargeTransactionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-recharge/transactions/${transactionUid}/status/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(formatApiErrorMessage(errorData))
      }

      const data: AutoRechargeTransactionStatus = await response.json()
      return data
    } catch (error) {
      console.error('Get auto-recharge transaction status error:', error)
      throw error
    }
  }

  // Initiate auto-recharge
  async initiateAutoRecharge(accessToken: string, payload: InitiateAutoRechargePayload): Promise<InitiateAutoRechargeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-recharge/initiate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(formatApiErrorMessage(errorData))
      }

      const data: InitiateAutoRechargeResponse = await response.json()
      return data
    } catch (error) {
      console.error('Initiate auto-recharge error:', error)
      throw error
    }
  }
}

// Create singleton instance
export const autoRechargeService = new AutoRechargeService()

