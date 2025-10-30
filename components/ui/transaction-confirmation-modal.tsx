"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/contexts"

type TransactionType = "deposit" | "withdrawal"

interface NetworkLite {
	uid: string
	nom?: string
	code?: string
}

export interface TransactionConfirmationData {
	type: TransactionType
	amount: string
	recipientPhone: string
	selectedNetwork?: NetworkLite
}

export function TransactionConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	transactionData,
	isProcessing,
}: {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	transactionData: TransactionConfirmationData
	isProcessing?: boolean
}) {
	const { resolvedTheme } = useTheme()
	const isDark = resolvedTheme === "dark"

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className={isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>
				<DialogHeader>
					<DialogTitle>
						{transactionData.type === "deposit" ? "Confirm Deposit" : "Confirm Withdrawal"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 text-sm">
					<div className="flex justify-between"><span className="opacity-70">Type</span><span className="font-medium capitalize">{transactionData.type}</span></div>
					<div className="flex justify-between"><span className="opacity-70">Amount</span><span className="font-semibold">{transactionData.amount} FCFA</span></div>
					<div className="flex justify-between"><span className="opacity-70">Recipient</span><span className="font-medium">{transactionData.recipientPhone}</span></div>
					{transactionData.selectedNetwork && (
						<div className="flex justify-between"><span className="opacity-70">Network</span><span className="font-medium">{transactionData.selectedNetwork.nom || transactionData.selectedNetwork.code}</span></div>
					)}
				</div>
				<DialogFooter className="mt-4 gap-2 sm:gap-3">
					<Button variant="outline" onClick={onClose} disabled={!!isProcessing}>Cancel</Button>
					<Button onClick={onConfirm} disabled={!!isProcessing}>
						{isProcessing ? "Processing..." : "Confirm"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}


