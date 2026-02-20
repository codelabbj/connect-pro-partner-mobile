"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	ArrowLeft,
	RefreshCw,
	Send,
	User,
	ArrowUpRight,
	ArrowDownLeft,
	Search as SearchIcon,
	Filter as FilterIcon,
	X as CloseIcon,
	ChevronDown,
	Calendar
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation, useAuth } from "@/lib/contexts"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { TransactionDetailsModal } from "./transaction-details-modal"
import { transfersService } from "@/lib/transfers"

export function TransferHistoryScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { resolvedTheme } = useTheme()
	const { t } = useTranslation()
	const { user } = useAuth()
	const { toast } = useToast()

	const [transfers, setTransfers] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [filters, setFilters] = useState<any>({ type: "", status: "", min_amount: "", max_amount: "", date_from: "", date_to: "" })
	const [filtersOpen, setFiltersOpen] = useState(false)
	const [selectedTransfer, setSelectedTransfer] = useState<any>(null)
	const [detailsOpen, setDetailsOpen] = useState(false)

	// Pull-to-refresh state
	const [pullToRefreshState, setPullToRefreshState] = useState({
		isPulling: false,
		pullDistance: 0,
		isRefreshing: false,
		startY: 0,
		currentY: 0,
		canPull: true,
	})

	const loadTransfers = async (showLoading = true) => {
		try {
			if (showLoading) setIsLoading(true)
			const response = await transfersService.myTransfers(filters)

			// Flatten the sent and received transfers into a single array
			const sent = response.sent_transfers || []
			const received = response.received_transfers || []

			// Combine and sort by created_at (decending)
			const combined = [...sent, ...received].sort((a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			)

			setTransfers(combined)
		} catch (err: any) {
			toast({
				title: "Erreur",
				description: err.message || "Impossible de charger l'historique des transferts",
				variant: "destructive"
			})
		} finally {
			setIsLoading(false)
			setIsRefreshing(false)
		}
	}

	useEffect(() => {
		loadTransfers()
	}, [filters.type, filters.status]) // Reload on status/type change immediately

	const handleApplyFilters = () => {
		loadTransfers()
		setFiltersOpen(false)
	}

	const handleClearFilters = () => {
		setFilters({
			type: "",
			status: "",
			min_amount: "",
			max_amount: "",
			date_from: "",
			date_to: "",
		})
		setFiltersOpen(false)
	}

	const handlePullToRefresh = async () => {
		setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
		await loadTransfers(false)
		setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
	}

	const handleRefresh = () => {
		setIsRefreshing(true)
		loadTransfers(false)
	}

	// Touch handlers for PTR
	const handleTouchStart = (e: React.TouchEvent) => {
		if (window.scrollY > 0) return
		setPullToRefreshState(prev => ({ ...prev, startY: e.touches[0].clientY, canPull: true }))
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!pullToRefreshState.canPull || pullToRefreshState.isRefreshing) return
		const distance = Math.min(Math.max(0, e.touches[0].clientY - pullToRefreshState.startY), 120)
		if (distance > 10) {
			e.preventDefault()
			setPullToRefreshState(prev => ({ ...prev, isPulling: true, pullDistance: distance }))
		}
	}

	const handleTouchEnd = () => {
		if (pullToRefreshState.pullDistance >= 80) handlePullToRefresh()
		else setPullToRefreshState(prev => ({ ...prev, isPulling: false, pullDistance: 0 }))
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('fr-FR', {
			day: '2-digit', month: '2-digit', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		})
	}

	return (
		<div className={`min-h-screen p-4 ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
			<div className="max-w-2xl mx-auto">
				<Button variant="ghost" onClick={onNavigateBack} className="mb-4">{t("common.back")}</Button>
				<Card>
					<CardHeader>
						<CardTitle>{t("transferHistory.title")}</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="py-20 text-center animate-pulse font-bold">{t("common.loading")}...</div>
						) : transfers.length > 0 ? (
							<div className="space-y-4">
								{transfers.map((tx, idx) => {
									// Direction logic from guide and response data
									const isReceived = user && (tx.receiver_email === user.email || tx.receiver_uid === user.uid);
									const sign = isReceived ? "+" : "-";
									const color = isReceived ? "text-green-500" : "text-red-500";
									const bgColor = isReceived ? "bg-green-500/10" : "bg-red-500/10";
									const label = isReceived ? "Transfert Reçu" : "Transfert Envoyé";
									const Icon = isReceived ? ArrowDownLeft : ArrowUpRight;
									const partnerName = isReceived ? tx.sender_name : tx.receiver_name;

									return (
										<div key={tx.uid} onClick={() => { setSelectedTransfer({ ...tx, isReceived }); setDetailsOpen(true); }}
											className="p-4 rounded-[1.5rem] bg-gray-50 dark:bg-gray-900/50 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer group">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} ${color}`}>
														<Icon className="w-5 h-5" />
													</div>
													<div className="min-w-0">
														<p className="font-bold text-sm truncate">
															{partnerName || 'Utilisateur'}
														</p>
														<p className="text-[10px] opacity-50 font-medium">{label} • {formatDate(tx.created_at)}</p>
													</div>
												</div>
												<div className="text-right">
													<p className={`font-black text-sm ${color}`}>
														{sign}{parseFloat(tx.amount).toLocaleString()} FCFA
													</p>
													<Badge className={`mt-1 text-[8px] uppercase font-black tracking-tighter ${tx.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
														tx.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
															'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
														}`}>
														{tx.status}
													</Badge>
												</div>
											</div>
											<div className="mt-3 flex items-center gap-2 opacity-50">
												<User className="w-3 h-3" />
												<p className="text-[10px] font-bold truncate">
													{isReceived ? `De: ${tx.sender_name}` : `À: ${tx.receiver_name}`}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
								<Send className="w-12 h-12" />
								<p className="font-bold">Aucun transfert trouvé</p>
							</div>
						)}
					</CardContent>
				</Card>

				<TransactionDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} transaction={selectedTransfer ? { ...selectedTransfer, historyType: 'transfer' } : null} />
			</div>
		</div>
	)
}
