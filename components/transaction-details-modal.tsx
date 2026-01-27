"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/contexts"
import { useTheme } from "@/lib/contexts"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, X } from "lucide-react"

export interface TransactionDetailsModalProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	isOpen?: boolean
	onClose?: () => void
	transaction?: any
}

export function TransactionDetailsModal({ open, onOpenChange, isOpen, onClose, transaction }: TransactionDetailsModalProps) {
	const { t } = useTranslation()
	const { theme } = useTheme()
	const { toast } = useToast()
	const [mounted, setMounted] = useState(false)

	// Support both prop patterns: open/onOpenChange and isOpen/onClose
	const effectiveOpen = typeof open === 'boolean' ? open : (typeof isOpen === 'boolean' ? isOpen : false)
	const handleClose = () => {
		if (onOpenChange) {
			onOpenChange(false)
		} else if (onClose) {
			onClose()
		}
	}

	const isBetting = transaction && (transaction.historyType === 'betting' || typeof transaction?.betting_user_id === 'string' || transaction?.betting)

	useEffect(() => {
		setMounted(true)
	}, [])

	const copyToClipboard = async (value?: string) => {
		if (!value) return
		try {
			await navigator.clipboard.writeText(value)
			toast({ title: t("common.copied"), description: value })
		} catch {}
	}

	// Format date helper
	const formatDate = (dateString?: string) => {
		if (!dateString) return ''
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch {
			return dateString
		}
	}

	// Format amount helper
	const formatAmount = (amount?: string | number, type?: string) => {
		if (!amount) return '0'
		const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
		const formatted = numAmount.toLocaleString('fr-FR')
		if (type === 'deposit' || transaction?.historyType === 'recharge' || transaction?.historyType === 'auto-recharge') {
			return `+${formatted}`
		}
		if (type === 'withdrawal' || transaction?.historyType === 'transfer') {
			return `-${formatted}`
		}
		return formatted
	}

	// Get status color
	const getStatusColor = (status?: string) => {
		switch (status) {
			case "success":
			case "sent_to_user":
			case "approved":
			case "completed":
				return "bg-green-500/10 text-green-500 border-green-500/20"
			case "pending":
			case "proof_submitted":
				return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
			case "failed":
			case "rejected":
			case "expired":
				return "bg-red-500/10 text-red-500 border-red-500/20"
			default:
				return "bg-gray-500/10 text-gray-500 border-gray-500/20"
		}
	}

	if (!mounted || !effectiveOpen) return null

	const modalContent = (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-500"
				onClick={handleClose}
				style={{
					opacity: effectiveOpen ? 1 : 0,
					pointerEvents: effectiveOpen ? 'auto' : 'none',
				}}
			/>

			{/* Bottom Sheet */}
			<div
				className={`fixed bottom-0 left-0 right-0 h-[50vh] w-full rounded-t-2xl shadow-2xl z-50 transition-all duration-500 ease-out ${
					theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
				}`}
				style={{
					transform: effectiveOpen ? 'translateY(0)' : 'translateY(100%)',
					opacity: effectiveOpen ? 1 : 0,
				}}
			>
				{/* Drag Handle */}
				<div className="flex justify-center pt-3 pb-2">
					<div className={`w-10 h-1 rounded-full ${
						theme === "dark" ? "bg-gray-600" : "bg-gray-300"
					}`} />
				</div>

				{/* Header - Fixed */}
				<div className={`px-6 pb-4 border-b ${
					theme === "dark" ? "border-gray-700" : "border-gray-200"
				}`}>
					<div className="flex items-center justify-between">
						<h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
							{t("transactionDetails.title")}
						</h2>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleClose}
							className={`h-8 w-8 ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
						>
							<X className="w-5 h-5" />
						</Button>
					</div>
				</div>

				{/* Scrollable Content */}
				<div className="overflow-y-auto max-h-[calc(50vh-80px)] px-6 py-4">
					<div className="space-y-4 text-sm">
						{/* Reference */}
						{transaction?.reference && (
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
										{t("transactionDetails.reference")}:
									</span>
									<span className="ml-2 font-mono">{transaction.reference}</span>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => copyToClipboard(transaction.reference)}
									className={`h-8 w-8 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
								>
									<Copy className="w-4 h-4" />
								</Button>
							</div>
						)}

						{/* Amount */}
						{transaction?.amount && (
							<div>
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("transactionDetails.amount")}:
								</span>
								<span className={`ml-2 font-semibold ${
									(transaction?.type === 'deposit' || transaction?.historyType === 'recharge' || transaction?.historyType === 'auto-recharge') 
										? "text-green-500" 
										: (transaction?.type === 'withdrawal' || transaction?.historyType === 'transfer')
										? "text-red-500"
										: theme === "dark" ? "text-white" : "text-gray-900"
								}`}>
									{formatAmount(transaction.amount, transaction?.type || transaction?.transaction_type)} FCFA
								</span>
							</div>
						)}

						{/* Status */}
						{transaction?.status && (
							<div className="flex items-center gap-2">
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("transactionDetails.status")}:
								</span>
								<Badge className={getStatusColor(transaction.status)}>
									{transaction.status_display || transaction.status}
								</Badge>
							</div>
						)}

						{/* Date */}
						{transaction?.created_at && (
							<div>
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("transactionDetails.date")}:
								</span>
								<span className="ml-2">{formatDate(transaction.created_at)}</span>
							</div>
						)}

						{/* Recipient */}
						{(transaction?.recipient_name || transaction?.display_recipient_name) && (
							<div>
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("transactionDetails.recipient")}:
								</span>
								<span className="ml-2">{transaction.display_recipient_name || transaction.recipient_name}</span>
							</div>
						)}

						{(transaction?.recipient_phone) && (
							<div>
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("transactionDetails.recipientPhone")}:
								</span>
								<span className="ml-2">{transaction.recipient_phone}</span>
							</div>
						)}

						{/* Network */}
						{transaction?.network && (
							<div>
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("transactionDetails.network")}:
								</span>
								<span className="ml-2">
									{typeof transaction.network === 'object' ? transaction.network.nom : transaction.network} {transaction.network.code && `(${transaction.network.code})`}
									{transaction.network.country_name && ` - ${transaction.network.country_name}`}
								</span>
							</div>
						)}

						{/* Phone Number (for auto-recharge) */}
						{transaction?.historyType === 'auto-recharge' && transaction?.phone_number && (
							<div>
								<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
									{t("autoRechargeTransactionDetail.phoneNumber")}:
								</span>
								<span className="ml-2">{transaction.phone_number}</span>
							</div>
						)}

						{/* Balance Changes */}
						{/* {(transaction?.balance_before || transaction?.balance_after) && (
							<div className={`pt-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
								<div className="font-medium mb-2">{t("transactionDetails.balanceChanges")}</div>
								<div className="space-y-1">
									{transaction.balance_before && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.balanceBefore")}:
											</span>
											<span className="ml-2">{parseFloat(transaction.balance_before).toLocaleString('fr-FR')} FCFA</span>
										</div>
									)}
									{transaction.balance_after && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.balanceAfter")}:
											</span>
											<span className="ml-2">{parseFloat(transaction.balance_after).toLocaleString('fr-FR')} FCFA</span>
										</div>
									)}
								</div>
							</div>
						)} */}

						{/* Betting Details */}
						{isBetting && (
							<div className={`pt-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
								<div className={`font-medium mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
									{t("transactionDetails.betting.heading")}
								</div>
								<div className="space-y-2">
									{(transaction?.betting?.transaction_type || transaction?.transaction_type) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.type")}:
											</span>
											<span className="ml-2">{transaction?.betting?.transaction_type || transaction?.transaction_type}</span>
										</div>
									)}
									{(transaction?.betting?.betting_user_id || transaction?.betting_user_id) && (
										<div className="flex items-center justify-between">
											<div>
												<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
													{t("transactionDetails.betting.userId")}:
												</span>
												<span className="ml-2 font-mono">{transaction?.betting?.betting_user_id || transaction?.betting_user_id}</span>
											</div>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(transaction?.betting?.betting_user_id || transaction?.betting_user_id)}
												className={`h-8 w-8 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									)}
									{(transaction?.betting?.withdrawal_code || transaction?.withdrawal_code) && (
										<div className="flex items-center justify-between">
											<div>
												<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
													{t("transactionDetails.betting.withdrawalCode")}:
												</span>
												<span className="ml-2 font-mono">{transaction?.betting?.withdrawal_code || transaction?.withdrawal_code}</span>
											</div>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(transaction?.betting?.withdrawal_code || transaction?.withdrawal_code)}
												className={`h-8 w-8 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									)}
									{/* {(transaction?.betting?.external_transaction_id || transaction?.external_transaction_id) && (
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
													{t("transactionDetails.betting.externalId")}:
												</span>
												<span className="ml-2 font-mono break-all">{transaction?.betting?.external_transaction_id || transaction?.external_transaction_id}</span>
											</div>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(transaction?.betting?.external_transaction_id || transaction?.external_transaction_id)}
												className={`h-8 w-8 flex-shrink-0 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									)} */}
									{/* {(transaction?.betting?.commission_rate || transaction?.commission_rate) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.commissionRate")}:
											</span>
											<span className="ml-2">{(transaction?.betting?.commission_rate || transaction?.commission_rate)}%</span>
										</div>
									)}
									{(transaction?.betting?.commission_amount || transaction?.commission_amount) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.commissionAmount")}:
											</span>
											<span className="ml-2">{parseFloat(transaction?.betting?.commission_amount || transaction?.commission_amount || '0').toLocaleString('fr-FR')} FCFA</span>
										</div>
									)}
									{(transaction?.betting?.commission_paid_at || transaction?.commission_paid_at) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.commissionPaidAt")}:
											</span>
											<span className="ml-2">{formatDate(transaction?.betting?.commission_paid_at || transaction?.commission_paid_at)}</span>
										</div>
									)}
									{(transaction?.betting?.partner_balance_before || transaction?.partner_balance_before) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.balanceBefore")}:
											</span>
											<span className="ml-2">{parseFloat(transaction?.betting?.partner_balance_before || transaction?.partner_balance_before || '0').toLocaleString('fr-FR')} FCFA</span>
										</div>
									)}
									{(transaction?.betting?.partner_balance_after || transaction?.partner_balance_after) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.balanceAfter")}:
											</span>
											<span className="ml-2">{parseFloat(transaction?.betting?.partner_balance_after || transaction?.partner_balance_after || '0').toLocaleString('fr-FR')} FCFA</span>
										</div>
									)} */}
									{(transaction?.betting?.cancellation_requested_at || transaction?.cancellation_requested_at) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.cancellationRequestedAt")}:
											</span>
											<span className="ml-2">{formatDate(transaction?.betting?.cancellation_requested_at || transaction?.cancellation_requested_at)}</span>
										</div>
									)}
									{(transaction?.betting?.cancelled_at || transaction?.cancelled_at) && (
										<div>
											<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
												{t("transactionDetails.betting.cancelledAt")}:
											</span>
											<span className="ml-2">{formatDate(transaction?.betting?.cancelled_at || transaction?.cancelled_at)}</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)

	return createPortal(modalContent, document.body)
}


 