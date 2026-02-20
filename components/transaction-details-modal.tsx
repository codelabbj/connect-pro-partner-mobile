"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/contexts"
import { useTheme } from "@/lib/contexts"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, X, Eye } from "lucide-react"

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

	// Support both prop patterns
	const effectiveOpen = typeof open === 'boolean' ? open : (typeof isOpen === 'boolean' ? isOpen : false)
	const handleClose = () => {
		if (onOpenChange) onOpenChange(false)
		else if (onClose) onClose()
	}

	useEffect(() => {
		setMounted(true)
	}, [])

	const copyToClipboard = async (value?: string) => {
		if (!value) return
		try {
			await navigator.clipboard.writeText(value)
			toast({ title: t("common.copied"), description: value })
		} catch { }
	}

	const formatDate = (dateString?: string | null) => {
		if (!dateString) return 'N/A'
		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) return dateString
			return date.toLocaleString('fr-FR', {
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

	const formatAmount = (amount?: string | number | null) => {
		if (amount === undefined || amount === null) return '0'
		const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
		return numAmount.toLocaleString('fr-FR')
	}

	const getStatusColor = (status?: string) => {
		if (!status) return "bg-gray-500/10 text-gray-500 border-gray-500/20"
		const s = status.toLowerCase()
		if (['success', 'sent_to_user', 'approved', 'completed', 'proof_submitted'].includes(s))
			return "bg-green-500/10 text-green-500 border-green-500/20"
		if (['pending', 'processing'].includes(s))
			return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
		if (['failed', 'rejected', 'expired', 'cancelled'].includes(s))
			return "bg-red-500/10 text-red-500 border-red-500/20"
		return "bg-gray-500/10 text-gray-500 border-gray-500/20"
	}

	if (!mounted || !effectiveOpen || !transaction) return null

	// Determine transaction type
	const isTransfer = transaction.historyType === 'transfer' || (transaction.sender !== undefined && transaction.receiver !== undefined)
	const isBetting = transaction.historyType === 'betting' || transaction.platform_name !== undefined || transaction.betting
	const isRecharge = transaction.historyType === 'recharge' || transaction.recharge || (transaction.reference && transaction.reference.startsWith('RCH-'))
	const isUserTransaction = transaction.historyType === 'transaction' || transaction.type !== undefined

	const renderField = (label: string, value: any, isMono = false, isCopyable = false) => {
		if (value === undefined || value === null || value === "") return null
		return (
			<div className="flex items-center justify-between py-1">
				<span className={`opacity-70 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
					{label}:
				</span>
				<div className="flex items-center gap-2 max-w-[70%]">
					<span className={`text-right truncate ${isMono ? "font-mono text-xs" : ""} ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
						{typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}
					</span>
					{isCopyable && (
						<Button variant="ghost" size="icon" onClick={() => copyToClipboard(String(value))} className="h-6 w-6 flex-shrink-0">
							<Copy className="w-3 h-3" />
						</Button>
					)}
				</div>
			</div>
		)
	}

	const renderSectionHeader = (title: string) => (
		<div className={`mt-4 mb-2 pb-1 border-b font-semibold text-xs uppercase tracking-wider ${theme === "dark" ? "text-gray-500 border-gray-700" : "text-gray-400 border-gray-100"}`}>
			{title}
		</div>
	)

	return createPortal(
		<>
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all duration-300" onClick={handleClose} />
			<div className={`fixed bottom-0 left-0 right-0 h-[80vh] w-full rounded-t-[2.5rem] shadow-2xl z-[101] transition-all duration-500 ease-out overflow-hidden flex flex-col ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
				style={{ transform: effectiveOpen ? 'translateY(0)' : 'translateY(100%)' }}>

				<div className="flex justify-center pt-4 pb-2 flex-shrink-0">
					<div className={`w-12 h-1.5 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
				</div>

				<div className="px-6 pb-4 flex items-center justify-between flex-shrink-0">
					<div>
						<h2 className="text-2xl font-black">{t("transactionDetails.title")}</h2>
						<p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
							{transaction.reference || ''}
						</p>
					</div>
					<Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full h-10 w-10">
						<X className="w-6 h-6" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 pb-12 space-y-6 scrollbar-hide">
					{/* Status & Amount Highlight */}
					<div className={`p-6 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-2 ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
						<Badge className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border-2 ${getStatusColor(transaction.status)}`}>
							{transaction.status_display || transaction.status || 'N/A'}
						</Badge>
						<div className={`text-4xl font-black flex items-baseline gap-1 ${(isTransfer && transaction.isReceived !== undefined) ? (transaction.isReceived ? "text-green-500" : "text-red-500") :
								(isBetting) ? (transaction.transaction_type === 'deposit' ? "text-green-500" : "text-red-500") :
									(isRecharge || transaction.historyType === 'auto-recharge') ? "text-green-500" :
										(isUserTransaction) ? (transaction.type === 'deposit' ? "text-green-500" : "text-red-500") : ""
							}`}>
							{(isTransfer && transaction.isReceived !== undefined) ? (transaction.isReceived ? '+' : '-') :
								(isBetting) ? (transaction.transaction_type === 'deposit' ? '+' : '-') :
									(isRecharge || transaction.historyType === 'auto-recharge') ? '+' :
										(isUserTransaction) ? (transaction.type === 'deposit' ? '+' : '-') : ''}
							{formatAmount(transaction.amount)}
							<span className="text-sm font-medium opacity-50 uppercase">FCFA</span>
						</div>
						{transaction.created_at && (
							<p className="text-xs opacity-50 font-medium">
								{formatDate(transaction.created_at)}
							</p>
						)}
					</div>

					<div className="space-y-4">
						{renderSectionHeader("Détails Généraux")}
						{renderField("Référence", transaction.reference, true, true)}
						{renderField("Type", transaction.type_display || transaction.transaction_type_display || transaction.type || transaction.transaction_type)}
						{renderField("Description", transaction.description || transaction.objet || transaction.proof_description)}
						{renderField("Date de création", formatDate(transaction.created_at))}

						{/* Transfer Specific */}
						{isTransfer && (
							<>
								{renderSectionHeader("Transfert")}
								{renderField("Expéditeur", transaction.sender_name)}
								{renderField("Email Expéditeur", transaction.sender_email)}
								{renderField("Destinataire", transaction.receiver_name)}
								{renderField("Email Destinataire", transaction.receiver_email)}
								{renderField("Frais", `${formatAmount(transaction.fees)} FCFA`)}
								{renderField("Terminé le", formatDate(transaction.completed_at))}
								{renderField("Raison de l'échec", transaction.failed_reason)}

								{renderSectionHeader("Impact sur Solde")}
								{renderField("Solde Exp. Avant", `${formatAmount(transaction.sender_balance_before)} FCFA`)}
								{renderField("Solde Exp. Après", `${formatAmount(transaction.sender_balance_after)} FCFA`)}
								{renderField("Solde Dest. Avant", `${formatAmount(transaction.receiver_balance_before)} FCFA`)}
								{renderField("Solde Dest. Après", `${formatAmount(transaction.receiver_balance_after)} FCFA`)}
							</>
						)}

						{/* Betting Specific */}
						{isBetting && (
							<>
								{renderSectionHeader("Paris Sportifs")}
								{renderField("Plateforme", transaction.platform_name)}
								{renderField("ID Joueur", transaction.betting_user_id || transaction.betting?.betting_user_id, true, true)}
								{renderField("Code de Retrait", transaction.withdrawal_code || transaction.betting?.withdrawal_code, true, true)}
								{renderField("Type de Transaction", transaction.transaction_type || transaction.betting?.transaction_type)}
								{renderField("Commission", `${formatAmount(transaction.commission_amount || transaction.betting?.commission_amount)} FCFA`)}
								{renderField("Taux de Commission", `${transaction.commission_rate || transaction.betting?.commission_rate}%`)}
								{renderField("Commission Payée", transaction.commission_paid || transaction.betting?.commission_paid)}
								{renderField("Payé le", formatDate(transaction.commission_paid_at || transaction.betting?.commission_paid_at))}
								{renderField("Partenaire", transaction.partner_name)}
								{renderField("ID Externe", transaction.external_transaction_id || transaction.betting?.external_transaction_id, true, true)}

								{renderSectionHeader("Impact sur Solde Partenaire")}
								{renderField("Solde Avant", `${formatAmount(transaction.partner_balance_before || transaction.betting?.partner_balance_before)} FCFA`)}
								{renderField("Solde Après", `${formatAmount(transaction.partner_balance_after || transaction.betting?.partner_balance_after)} FCFA`)}

								{(transaction.external_response?.data?.error_message || transaction.error_message) && (
									<>
										{renderSectionHeader("Erreur Externe")}
										<div className={`p-3 rounded-xl text-xs font-medium ${theme === "dark" ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"}`}>
											{transaction.external_response?.data?.error_message || transaction.error_message}
										</div>
									</>
								)}
							</>
						)}

						{/* Recharge Specific */}
						{isRecharge && (
							<>
								{renderSectionHeader("Recharge de Compte")}
								{renderField("Montant Formaté", transaction.formatted_amount)}
								{renderField("Statut d'affichage", transaction.status_display)}
								{renderField("Date de transaction", formatDate(transaction.transaction_date))}
								{renderField("Expire le", formatDate(transaction.expires_at))}
								{renderField("Temps restant", transaction.time_remaining)}
								{renderField("Expiré", transaction.is_expired)}
								{renderField("Revu le", formatDate(transaction.reviewed_at))}
								{renderField("Traité le", formatDate(transaction.processed_at))}
								{renderField("Raison du rejet", transaction.rejection_reason)}
								{renderField("Notes Admin", transaction.admin_notes)}

								{transaction.proof_image && (
									<div className="space-y-2">
										<span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>PREUVE DE PAIEMENT</span>
										<div className="relative aspect-video rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
											<img src={transaction.proof_image} alt="Preuve" className="w-full h-full object-cover" />
											<Button variant="secondary" size="sm" className="absolute bottom-4 right-4 rounded-full shadow-lg" onClick={() => window.open(transaction.proof_image, '_blank')}>
												<Eye className="w-4 h-4 mr-2" /> Voir en grand
											</Button>
										</div>
									</div>
								)}
							</>
						)}

						{/* User Transaction Specific */}
						{isUserTransaction && !isTransfer && (
							<>
								{renderSectionHeader("Détails Backend")}
								{renderField("Téléphone Récipiendaire", transaction.recipient_phone, true, true)}
								{renderField("Nom Récipiendaire", transaction.display_recipient_name || transaction.recipient_name)}
								{renderField("Réseau", transaction.network?.nom || transaction.network)}
								{renderField("Commencé le", formatDate(transaction.started_at))}
								{renderField("Terminé le", formatDate(transaction.completed_at))}
								{renderField("Durée de traitement", transaction.processing_duration)}
								{renderField("Tentatives", `${transaction.retry_count} / ${transaction.max_retries}`)}
								{renderField("Traité par", transaction.processed_by_name)}
								{renderField("Priorité", transaction.priority)}
								{renderField("ID Externe", transaction.external_id, true, true)}
								{renderField("Frais", `${formatAmount(transaction.fees)} FCFA`)}
								{renderField("Callback URL", transaction.callback_url, true, true)}

								{renderSectionHeader("Impact sur Solde")}
								{renderField("Solde Avant", `${formatAmount(transaction.balance_before)} FCFA`)}
								{renderField("Solde Après", `${formatAmount(transaction.balance_after)} FCFA`)}

								{transaction.error_message && (
									<>
										{renderSectionHeader("Message d'erreur")}
										<div className={`p-4 rounded-3xl text-xs font-bold leading-relaxed ${theme === "dark" ? "bg-red-900/20 text-red-300" : "bg-red-50 text-red-700"}`}>
											{transaction.error_message}
										</div>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</>
		, document.body)
}


