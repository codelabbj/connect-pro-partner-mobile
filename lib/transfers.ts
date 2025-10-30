import { authService } from './auth'
import { formatApiErrorMessage } from './utils'

export interface TransferPayload {
	recipient: string
	amount: string
	note?: string
}

export interface TransferResponse {
	success: boolean
	message: string
	transfer?: any
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

	async myTransfers() {
		const res = await fetch(`${this.baseUrl}/api/payments/betting/user/transfers/my_transfers`, {
			headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
		})
		if (!res.ok) throw new Error(formatApiErrorMessage(await res.json()))
		return res.json()
	}
}

export const transfersService = new TransfersService()





