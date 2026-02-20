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
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts"
import { transfersService, TransferListParams } from "@/lib/transfers"
import { TransactionDetailsModal } from "./transaction-details-modal"
import { Badge } from "@/components/ui/badge"

interface TransferHistoryScreenProps {
	onNavigateBack: () => void
}

export function TransferHistoryScreen({ onNavigateBack }: TransferHistoryScreenProps): JSX.Element {
	const [transfers, setTransfers] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)
	const [detailsOpen, setDetailsOpen] = useState(false)
	const [filtersOpen, setFiltersOpen] = useState(false)

	// Filter State
	const [filters, setFilters] = useState<TransferListParams>({
		type: "",
		status: "",
		min_amount: "",
		max_amount: "",
		date_from: "",
		date_to: "",
	})

	const { user } = useAuth()
	const { theme } = useTheme()
	const { t } = useTranslation()
	const { toast } = useToast()

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
		<div className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}
			style={{ transform: `translateY(${pullToRefreshState.pullDistance}px)`, transition: pullToRefreshState.isPulling ? 'none' : 'transform 0.3s' }}
			onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>

			{/* PTR Indicator */}
			{(pullToRefreshState.isPulling || pullToRefreshState.isRefreshing) && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center">
					<RefreshCw className={`w-5 h-5 ${pullToRefreshState.isRefreshing ? 'animate-spin' : ''}`} />
				</div>
			)}

			{/* Header */}
			<div className="px-6 pt-12 pb-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" onClick={onNavigateBack} className="rounded-full bg-white/50 dark:bg-gray-800/50 shadow-sm">
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<div>
							<h1 className="text-2xl font-black">Historique Transferts</h1>
							<p className="text-sm opacity-60 font-medium">Vos transferts entre utilisateurs</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setFiltersOpen(!filtersOpen)}
						className={`rounded-full ${filtersOpen ? "bg-blue-500 text-white" : "bg-white/50 dark:bg-gray-800/50"}`}
					>
						<FilterIcon className="w-5 h-5" />
					</Button>
				</div>

				{/* Collapsible Filters */}
				{filtersOpen && (
					<Card className="mb-6 border-0 shadow-xl rounded-[2rem] overflow-hidden dark:bg-gray-800 animate-in slide-in-from-top duration-300">
						<CardContent className="p-6 space-y-4">
							<div className="flex items-center justify-between mb-2">
								<h3 className="font-black text-sm uppercase tracking-widest opacity-50">Filtres Avancés</h3>
								<Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs font-bold text-blue-500">Réinitialiser</Button>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase opacity-40 ml-1">Direction</label>
									<select
										value={filters.type}
										onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
										className="w-full h-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 px-4 font-bold text-sm focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Tous</option>
										<option value="sent">Envoyés</option>
										<option value="received">Reçus</option>
									</select>
								</div>
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase opacity-40 ml-1">Statut</label>
									<select
										value={filters.status}
										onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
										className="w-full h-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 px-4 font-bold text-sm focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Tous</option>
										<option value="completed">Complété</option>
										<option value="pending">En attente</option>
										<option value="failed">Échoué</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase opacity-40 ml-1">Montant Min</label>
									<Input
										type="number"
										placeholder="0"
										value={filters.min_amount}
										onChange={(e) => setFilters(prev => ({ ...prev, min_amount: e.target.value }))}
										className="h-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 font-bold"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase opacity-40 ml-1">Montant Max</label>
									<Input
										type="number"
										placeholder="999999"
										value={filters.max_amount}
										onChange={(e) => setFilters(prev => ({ ...prev, max_amount: e.target.value }))}
										className="h-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 font-bold"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase opacity-40 ml-1">Du</label>
									<div className="relative">
										<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
										<Input
											type="date"
											value={filters.date_from}
											onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
											className="h-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 pl-10 font-bold text-xs"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase opacity-40 ml-1">Au</label>
									<div className="relative">
										<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
										<Input
											type="date"
											value={filters.date_to}
											onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
											className="h-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 pl-10 font-bold text-xs"
										/>
									</div>
								</div>
							</div>

							<Button onClick={handleApplyFilters} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black">
								Appliquer les filtres
							</Button>
						</CardContent>
					</Card>
				)}
			</div>

			<div className="px-6 pb-12">
				<Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden dark:bg-gray-800">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xl font-black">Transferts ({transfers.length})</CardTitle>
						<Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="rounded-full">
							<RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
						</Button>
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
