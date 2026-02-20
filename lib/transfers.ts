import { authService } from './auth'
import { formatApiErrorMessage } from './utils'

export interface TransferPayload {
	receiver_uid: string
	amount: string
	description: string
}

export interface TransferResponse {
	success: boolean
	message: string
	transfer?: any
}

export interface TransferData {
	uid: string
	reference: string
	sender: number
	sender_name: string
	sender_email: string
	receiver: number
	receiver_name: string
	receiver_email: string
	amount: string
	fees: string
	status: string
	description: string
	sender_balance_before: string
	sender_balance_after: string
	receiver_balance_before: string
	receiver_balance_after: string
	completed_at: string
	failed_reason?: string
	created_at: string
	updated_at: string
}

export interface TransferListResponse {
	success: boolean
	summary: {
		total_sent: number
		total_received: number
		amount_sent: number
		amount_received: number
	}
	sent_transfers: TransferData[]
	received_transfers: TransferData[]
}

export interface TransferListParams {
	type?: string
	status?: string
	min_amount?: string
	max_amount?: string
	date_from?: string
	date_to?: string
	ordering?: string
}

class TransfersService {
	private baseUrl: string

	constructor() {
		this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
	}

	async searchUsers(q: string) {
		const url = `${this.baseUrl}/api/auth/users/search/?search=${encodeURIComponent(q)}`
		const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() } })
		if (!res.ok) throw new Error(formatApiErrorMessage(await res.json()))
		return res.json()
	}

	async createTransfer(payload: TransferPayload): Promise<TransferResponse> {
		const res = await fetch(`${this.baseUrl}/api/payments/betting/user/transfers/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
			body: JSON.stringify(payload),
		})
		if (!res.ok) throw new Error(formatApiErrorMessage(await res.json()))
		return res.json()
	}

	async listTransfers(params: TransferListParams = {}) {
		const sp = new URLSearchParams()
		Object.entries(params).forEach(([k, v]) => { if (v) sp.append(k, v as string) })
		const res = await fetch(`${this.baseUrl}/api/payments/betting/user/transfers/?${sp.toString()}`, {
			headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
		})
		if (!res.ok) throw new Error(formatApiErrorMessage(await res.json()))
		return res.json()
	}

	async myTransfers(params: TransferListParams = {}): Promise<TransferListResponse> {
		const sp = new URLSearchParams()
		Object.entries(params).forEach(([k, v]) => { if (v) sp.append(k, v as string) })
		const queryString = sp.toString()
		const url = `${this.baseUrl}/api/payments/betting/user/transfers/my_transfers${queryString ? `?${queryString}` : ''}`
		const res = await fetch(url, {
			headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
		})
		if (!res.ok) throw new Error(formatApiErrorMessage(await res.json()))
		return res.json()
	}
}

export const transfersService = new TransfersService()





