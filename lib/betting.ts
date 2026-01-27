// Betting platform types and interfaces

export interface BettingPlatform {
  uid: string;
  name: string;
  logo: string | null;
  is_active: boolean;
  external_id: string;
  min_deposit_amount: string;
  max_deposit_amount: string;
  min_withdrawal_amount: string;
  max_withdrawal_amount: string;
  description?: string;
  can_deposit?: boolean;
  can_withdraw?: boolean;
  permission_is_active?: boolean;
  granted_by_name?: string;
  permission_granted_at?: string;
  // Merged from external API
  city?: string;
  street?: string;
  external_image?: string;
}

export interface BettingPlatformWithStats extends BettingPlatform {
  my_stats?: {
    total_transactions: number;
    successful_transactions: number;
    total_amount: number;
    total_commission: number;
    unpaid_commission: number;
  };
}

export interface BettingPlatformsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BettingPlatform[];
}

export interface BettingPlatformsWithPermissionsResponse {
  total_platforms: number;
  authorized_count: number;
  unauthorized_count: number;
  authorized_platforms: BettingPlatform[];
  unauthorized_platforms: BettingPlatform[];
  all_platforms: BettingPlatform[];
}

export interface BettingPlatformsWithStatsResponse {
  summary: {
    total_platforms: number;
    authorized_count: number;
    unauthorized_count: number;
    platforms_with_transactions: number;
  };
  authorized_platforms: BettingPlatformWithStats[];
  unauthorized_platforms: BettingPlatformWithStats[];
}

export interface BettingTransaction {
  uid: string;
  reference: string;
  partner_name: string;
  platform_name: string;
  transaction_type: "deposit" | "withdrawal";
  amount: string;
  status: "success" | "pending" | "failed" | "cancelled";
  betting_user_id: string;
  withdrawal_code: string | null;
  external_transaction_id: string | null;
  commission_rate: string;
  commission_paid_at: string | null;
  commission_amount: string;
  commission_paid: boolean;
  created_at: string;
  external_response: any;
  cancellation_requested_at: string | null;
  cancelled_at: string | null;
  partner_refunded: boolean;
  partner_balance_before: string;
  partner_balance_after: string;
}

export interface BettingTransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BettingTransaction[];
}

export interface CreateDepositPayload {
  platform_uid: string;
  betting_user_id: string;
  amount: string;
}

export interface CreateWithdrawalPayload {
  platform_uid: string;
  betting_user_id: string;
  withdrawal_code: string;
}

export interface VerifyUserIdPayload {
  platform_uid: string;
  betting_user_id: number;
}

export interface VerifyUserIdResponse {
  UserId: number;
  Name: string;
  CurrencyId: number;
}

export interface CreateTransactionResponse {
  success: boolean;
  message: string;
  transaction: BettingTransaction;
}

export interface BettingCommissionStats {
  total_transactions: number;
  total_commission: string;
  paid_commission: string;
  unpaid_commission: string;
  by_platform: Array<{
    platform__name: string;
    count: number;
    total_commission: number;
    unpaid_commission: number;
  }>;
}

export interface UnpaidCommission {
  uid: string;
  reference: string;
  partner_name: string;
  platform_name: string;
  transaction_type: string;
  amount: string;
  status: string;
  commission_amount: string;
  commission_paid: boolean;
  created_at: string;
}

export interface UnpaidCommissionsResponse {
  total_unpaid_amount: number;
  transaction_count: number;
  transactions: UnpaidCommission[];
}

export interface CommissionRates {
  deposit_rate: number;
  withdrawal_rate: number;
  last_updated: string | null;
  updated_by: string | null;
  message: string;
}

export interface CommissionPayment {
  uid: string;
  partner: number;
  partner_name: string;
  total_amount: string;
  transaction_count: number;
  paid_by: number;
  paid_by_name: string;
  period_start: string;
  period_end: string;
  notes: string;
  created_at: string;
}

export interface PaymentHistoryResponse {
  payment_count: number;
  total_paid_amount: number;
  payments: CommissionPayment[];
}

export interface ExternalPlatformData {
  id: string;
  image?: string;
  city?: string;
  street?: string;
  name?: string;
  public_name?: string;
  deposit_tuto_content?: string;
  [key: string]: any;
}





