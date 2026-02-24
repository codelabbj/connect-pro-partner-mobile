import { formatApiErrorMessage } from './utils'

export interface BulkBatch {
    uid: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
    total_count: number;
    succeeded_count: number;
    failed_count: number;
    processed_count: number;
    total_amount: string;
    succeeded_amount: string;
    progress_percent: number;
    is_finished: boolean;
    created_at: string;
    completed_at: string | null;
    started_at: string | null;
    processing_duration: number | null;
}

export interface BulkTransaction {
    uid: string;
    recipient_phone: string;
    amount: string;
    network: {
        uid: string;
        nom: string;
        code: string;
        image: string | null;
    };
    objet: string;
    status: 'pending' | 'success' | 'failed';
    reference: string | null;
    error_message: string | null;
    retry_count: number;
    processed_at: string | null;
}

export interface BulkBatchesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: BulkBatch[];
}

export interface BulkTransactionsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: BulkTransaction[];
}

export interface BulkSubmissionPayload {
    transactions: {
        amount: string;
        recipient_phone: string;
        network: string; // Network UID
        objet: string;
        external_id?: string | null;
    }[];
}

class BulkPaymentService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    }

    // Get authorized networks for bulk transfers
    async getAuthorizedNetworks(accessToken: string) {
        try {
            const response = await fetch(`${this.baseUrl}/api/payments/user/transactions/bulk-deposit/networks/`, {
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

            return await response.json();
        } catch (error) {
            console.error('Get bulk networks error:', error);
            throw error;
        }
    }

    // Get historical batches
    async getBatches(accessToken: string, page: number = 1, filters: Record<string, string> = {}) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                page_size: '10',
                ...filters
            });

            const response = await fetch(`${this.baseUrl}/api/payments/user/transactions/bulk-deposit/list/?${queryParams}`, {
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

            return await response.json() as BulkBatchesResponse;
        } catch (error) {
            console.error('Get bulk batches error:', error);
            throw error;
        }
    }

    // Submit a new batch
    async submitBatch(accessToken: string, payload: BulkSubmissionPayload) {
        try {
            const response = await fetch(`${this.baseUrl}/api/payments/user/transactions/bulk-deposit/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(formatApiErrorMessage(errorData));
            }

            return await response.json();
        } catch (error) {
            console.error('Submit bulk batch error:', error);
            throw error;
        }
    }

    // Get batch summary
    async getBatchSummary(accessToken: string, uid: string) {
        try {
            const response = await fetch(`${this.baseUrl}/api/payments/user/transactions/bulk-deposit/${uid}/`, {
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

            return await response.json() as BulkBatch;
        } catch (error) {
            console.error('Get batch summary error:', error);
            throw error;
        }
    }

    // Get transactions within a batch
    async getBatchTransactions(accessToken: string, uid: string, page: number = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/api/payments/user/transactions/bulk-deposit/${uid}/transactions/?page=${page}`, {
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

            return await response.json() as BulkTransactionsResponse;
        } catch (error) {
            console.error('Get batch transactions error:', error);
            throw error;
        }
    }
}

export const bulkPaymentService = new BulkPaymentService();
