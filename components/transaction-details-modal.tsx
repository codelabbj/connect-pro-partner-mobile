"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy } from "lucide-react"

export interface TransactionDetailsModalProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	isOpen?: boolean
	onClose?: () => void
	transaction?: any
}

export function TransactionDetailsModal({ open, onOpenChange, transaction }: TransactionDetailsModalProps) {
	const { t } = useTranslation()
	const { toast } = useToast()
	const effectiveOpen = typeof open === 'boolean' ? open : !!(typeof (arguments[0] as any)?.isOpen === 'boolean' && (arguments[0] as any).isOpen)
	const effectiveOnChange = onOpenChange || (((arguments[0] as any)?.onClose) ? ((val: boolean) => { if (!val) (arguments[0] as any).onClose() }) : undefined)

	const isBetting = transaction && (transaction.historyType === 'betting' || typeof transaction?.betting_user_id === 'string' || transaction?.betting)

	const copyToClipboard = async (value?: string) => {
		if (!value) return
		try {
			await navigator.clipboard.writeText(value)
			toast({ title: t("common.copied"), description: value })
		} catch {}
	}

	return (
		<Dialog open={effectiveOpen} onOpenChange={effectiveOnChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("transactionDetails.title")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 text-sm">
					<div className="flex items-center justify-between">
						<div><span className="opacity-70">{t("transactionDetails.reference")}:</span> {transaction?.reference}</div>
						<Button variant="ghost" size="icon" onClick={() => copyToClipboard(transaction?.reference)}>
							<Copy className="w-4 h-4" />
						</Button>
					</div>
					<div><span className="opacity-70">{t("transactionDetails.amount")}:</span> {transaction?.amount} FCFA</div>
					<div className="flex items-center gap-2">
						<span className="opacity-70">{t("transactionDetails.status")}:</span>
						<Badge variant="secondary">{transaction?.status}</Badge>
					</div>
					<div><span className="opacity-70">{t("transactionDetails.date")}:</span> {transaction?.created_at}</div>

					{isBetting && (
						<div className="pt-2 border-t">
							<div className="font-medium mb-2">{t("transactionDetails.betting.heading")}</div>
							<div className="space-y-2">
								{(transaction?.betting?.transaction_type || transaction?.transaction_type) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.type")}:</span> {transaction?.betting?.transaction_type || transaction?.transaction_type}</div>
								)}
								{(transaction?.betting?.betting_user_id || transaction?.betting_user_id) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.userId")}:</span> {transaction?.betting?.betting_user_id || transaction?.betting_user_id}</div>
								)}
								{(transaction?.betting?.withdrawal_code || transaction?.withdrawal_code) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.withdrawalCode")}:</span> {transaction?.betting?.withdrawal_code || transaction?.withdrawal_code}</div>
								)}
								{(transaction?.betting?.external_transaction_id || transaction?.external_transaction_id) && (
									<div className="flex items-center justify-between">
										<div><span className="opacity-70">{t("transactionDetails.betting.externalId")}:</span> {transaction?.betting?.external_transaction_id || transaction?.external_transaction_id}</div>
										<Button variant="ghost" size="icon" onClick={() => copyToClipboard(transaction?.betting?.external_transaction_id || transaction?.external_transaction_id)}>
											<Copy className="w-4 h-4" />
										</Button>
									</div>
								)}
								{(transaction?.betting?.commission_rate || transaction?.commission_rate) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.commissionRate")}:</span> {transaction?.betting?.commission_rate || transaction?.commission_rate}%</div>
								)}
								{(transaction?.betting?.commission_amount || transaction?.commission_amount) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.commissionAmount")}:</span> {transaction?.betting?.commission_amount || transaction?.commission_amount} FCFA</div>
								)}
								{(transaction?.betting?.commission_paid_at || transaction?.commission_paid_at) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.commissionPaidAt")}:</span> {transaction?.betting?.commission_paid_at || transaction?.commission_paid_at}</div>
								)}
								{(transaction?.betting?.partner_balance_before || transaction?.partner_balance_before) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.balanceBefore")}:</span> {transaction?.betting?.partner_balance_before || transaction?.partner_balance_before} FCFA</div>
								)}
								{(transaction?.betting?.partner_balance_after || transaction?.partner_balance_after) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.balanceAfter")}:</span> {transaction?.betting?.partner_balance_after || transaction?.partner_balance_after} FCFA</div>
								)}
								{(transaction?.betting?.cancellation_requested_at || transaction?.cancellation_requested_at) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.cancellationRequestedAt")}:</span> {transaction?.betting?.cancellation_requested_at || transaction?.cancellation_requested_at}</div>
								)}
								{(transaction?.betting?.cancelled_at || transaction?.cancelled_at) && (
									<div><span className="opacity-70">{t("transactionDetails.betting.cancelledAt")}:</span> {transaction?.betting?.cancelled_at || transaction?.cancelled_at}</div>
								)}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}


 