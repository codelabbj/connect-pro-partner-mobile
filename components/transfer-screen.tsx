"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, Search, Send, User, ChevronRight, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { transfersService } from "@/lib/transfers"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface UserSearchResult {
	uid: string
	name?: string
	display_name?: string
	email?: string
	phone?: string
}

export function TransferScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { resolvedTheme } = useTheme()
	const { t } = useTranslation()
	const { toast } = useToast()
	const [recipientSearch, setRecipientSearch] = useState("")
	const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
	const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null)
	const [amount, setAmount] = useState("")
	const [description, setDescription] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [searching, setSearching] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")

	// Pull-to-refresh state (visual only)
	const [pullToRefreshState, setPullToRefreshState] = useState({
		isPulling: false,
		pullDistance: 0,
		isRefreshing: false,
		startY: 0,
		currentY: 0,
		canPull: true,
	})
	const containerRef = useRef<HTMLDivElement>(null)

	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const refreshThreshold = 80
	const maxPullDistance = 120
	const pullingThreshold = 10

	// Debounced search
	useEffect(() => {
		// Only search if length >= 2 or if it's exactly "@"
		if (recipientSearch.length < 2 && recipientSearch !== "@") {
			setSearchResults([])
			setSearching(false)
			return
		}

		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

		setSearching(true)
		searchTimeoutRef.current = setTimeout(async () => {
			try {
				// Strip leading @ if present
				const query = recipientSearch.startsWith("@")
					? recipientSearch.substring(1)
					: recipientSearch

				// Don't search if query becomes empty after stripping @, 
				// unless the original search was exactly "@" (searching for all/recent)
				if (!query && recipientSearch !== "@") {
					setSearchResults([])
					setSearching(false)
					return
				}

				const results = await transfersService.searchUsers(query)
				// Handle both array and paginated results
				const userList = Array.isArray(results) ? results : (results.results || [])
				setSearchResults(userList)
			} catch (err) {
				console.error("Search failed:", err)
			} finally {
				setSearching(false)
			}
		}, 500)

		return () => {
			if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
		}
	}, [recipientSearch])

	const handlePullToRefresh = async () => {
		setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
		try {
			await new Promise(resolve => setTimeout(resolve, 1000))
		} catch (error) {
			console.error('Pull-to-refresh error:', error)
		} finally {
			setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
		}
	}

	const handleTouchStart = (e: React.TouchEvent) => {
		if (!pullToRefreshState.canPull || window.scrollY > 0) return
		setPullToRefreshState({
			isPulling: false,
			pullDistance: 0,
			isRefreshing: false,
			startY: e.touches[0].clientY,
			currentY: e.touches[0].clientY,
			canPull: true,
		})
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (window.scrollY > 0 || pullToRefreshState.isRefreshing) {
			setPullToRefreshState(prev => ({ ...prev, canPull: false }))
			return
		}
		const currentY = e.touches[0].clientY
		const distance = Math.max(0, currentY - pullToRefreshState.startY)
		const limitedDistance = Math.min(distance, maxPullDistance)
		if (limitedDistance > pullingThreshold) {
			e.preventDefault()
			setPullToRefreshState(prev => ({
				...prev,
				isPulling: true,
				pullDistance: limitedDistance,
				currentY,
			}))
		}
	}

	const handleTouchEnd = () => {
		if (pullToRefreshState.pullDistance >= refreshThreshold && !pullToRefreshState.isRefreshing) {
			handlePullToRefresh()
		} else {
			setPullToRefreshState({
				isPulling: false,
				pullDistance: 0,
				isRefreshing: false,
				startY: 0,
				currentY: 0,
				canPull: true,
			})
		}
	}

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY === 0) {
				setPullToRefreshState(prev => ({ ...prev, canPull: true }))
			} else {
				setPullToRefreshState(prev => ({ ...prev, canPull: false, isPulling: false, pullDistance: 0 }))
			}
		}
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedRecipient) {
			setError("Veuillez sélectionner un destinataire")
			return
		}

		setError("")
		setSuccess("")
		setSubmitting(true)
		try {
			const response = await transfersService.createTransfer({
				receiver_uid: selectedRecipient.uid,
				amount: amount,
				description: description
			})

			if (response.success) {
				setSuccess(response.message || "Transfert effectué avec succès")
				toast({
					title: "Succès",
					description: "Le transfert a été envoyé avec succès",
				})
				// Redirect to dashboard after a short delay
				setTimeout(() => {
					onNavigateBack()
				}, 2000)
			} else {
				throw new Error(response.message || "Échec du transfert")
			}
		} catch (err: any) {
			setError(err?.message || "Échec du transfert")
			toast({
				title: "Erreur",
				description: err?.message || "Une erreur est survenue lors du transfert",
				variant: "destructive"
			})
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div
			ref={containerRef}
			className={`min-h-screen transition-all duration-300 ${resolvedTheme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}
			style={{
				transform: `translateY(${pullToRefreshState.pullDistance}px)`,
				transition: pullToRefreshState.isPulling ? 'none' : 'transform 0.3s ease-out',
			}}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Pull-to-refresh indicator */}
			{(pullToRefreshState.isPulling || pullToRefreshState.isRefreshing) && (
				<div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
					}`}>
					<RefreshCw className={`w-5 h-5 ${pullToRefreshState.isRefreshing ? 'animate-spin' : ''
						} ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
				</div>
			)}

			<div className="px-6 pt-12 pb-8">
				<div className="flex items-center gap-4 mb-8">
					<Button variant="ghost" size="icon" onClick={onNavigateBack} className="rounded-full bg-white/50 dark:bg-gray-800/50 shadow-sm">
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-black">Transférer</h1>
						<p className="text-sm opacity-60 font-medium">Envoyez des fonds instantanément</p>
					</div>
				</div>

				<div className="max-w-xl mx-auto space-y-6">
					<Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-visible dark:bg-gray-800">
						<CardHeader className="pb-2">
							<CardTitle className="text-xl font-black">Nouveau Transfert</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={submit} className="space-y-6">
								{error && (
									<div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20`}>
										<AlertCircle className="w-5 h-5" />
										{error}
									</div>
								)}
								{success && (
									<div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold bg-green-500/10 text-green-500 border border-green-500/20`}>
										<CheckCircle className="w-5 h-5" />
										{success}
									</div>
								)}

								{/* Recipient Selection */}
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Destinataire</label>
									{!selectedRecipient ? (
										<div className="relative">
											<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
											<Input
												placeholder="Rechercher par nom, email ou @"
												value={recipientSearch}
												onChange={(e) => setRecipientSearch(e.target.value)}
												className="pl-12 h-14 rounded-2xl border-0 bg-gray-100 dark:bg-gray-900 font-bold focus-visible:ring-blue-500"
											/>
											{searching && (
												<div className="absolute right-4 top-1/2 -translate-y-1/2">
													<RefreshCw className="w-4 h-4 animate-spin opacity-50" />
												</div>
											)}

											{(searching || searchResults.length > 0) && (recipientSearch.length >= 2 || recipientSearch === "@") && (
												<div className="absolute top-16 left-0 right-0 z-50 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-hide text-gray-900 dark:text-white">
													{searching && searchResults.length === 0 && (
														<div className="p-8 text-center text-gray-500 dark:text-gray-400">
															<RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-30 text-blue-500" />
															<p className="text-xs font-bold">Recherche de destinataires...</p>
														</div>
													)}

													{!searching && searchResults.length === 0 && (
														<div className="p-8 text-center text-gray-500 dark:text-gray-400">
															<User className="w-6 h-6 mx-auto mb-2 opacity-30" />
															<p className="text-xs font-bold">Aucun utilisateur trouvé</p>
														</div>
													)}

													{searchResults.map((user) => (
														<div
															key={user.uid}
															onClick={() => {
																setSelectedRecipient(user)
																setRecipientSearch("")
																setSearchResults([])
																setError("")
															}}
															className="p-4 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700"
														>
															<div className="flex items-center gap-3">
																<div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
																	<User className="w-5 h-5" />
																</div>
																<div className="min-w-0">
																	<p className="font-bold text-sm truncate text-gray-900 dark:text-gray-100">
																		{user.display_name || user.name || 'Utilisateur'}
																	</p>
																	{user.email && (
																		<p className="text-[10px] opacity-60 truncate text-gray-500 dark:text-gray-400 font-medium">
																			{user.email}
																		</p>
																	)}
																</div>
															</div>
															<ChevronRight className="w-4 h-4 opacity-30 text-gray-400" />
														</div>
													))}
												</div>
											)}
										</div>
									) : (
										<div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
													<User className="w-5 h-5" />
												</div>
												<div>
													<p className="font-black text-sm">{selectedRecipient.display_name || selectedRecipient.name || 'Utilisateur'}</p>
													{selectedRecipient.email && (
														<p className="text-[10px] opacity-50 font-medium">{selectedRecipient.email}</p>
													)}
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedRecipient(null)}
												className="text-[10px] font-black uppercase text-blue-500 hover:bg-transparent"
											>
												Changer
											</Button>
										</div>
									)}
								</div>

								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Montant (FCFA)</label>
									<div className="relative">
										<Input
											type="number"
											placeholder="0"
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
											required
											className="h-14 rounded-2xl border-0 bg-gray-100 dark:bg-gray-900 font-bold text-xl focus-visible:ring-blue-500"
										/>
										<div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs opacity-20">XOF</div>
									</div>
								</div>

								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Description (Facultatif)</label>
									<Input
										placeholder="Pour quoi est ce transfert?"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										className="h-14 rounded-2xl border-0 bg-gray-100 dark:bg-gray-900 font-bold focus-visible:ring-blue-500"
									/>
								</div>

								<Button
									type="submit"
									disabled={submitting || !selectedRecipient || !amount}
									className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
								>
									{submitting ? (
										<RefreshCw className="w-5 h-5 animate-spin" />
									) : (
										<>
											<Send className="w-5 h-5" />
											Envoyer Maintenant
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					<div className="p-6 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 space-y-2">
						<div className="flex items-center gap-2 text-orange-500">
							<AlertCircle className="w-4 h-4" />
							<p className="text-[10px] font-black uppercase tracking-wider">Attention</p>
						</div>
						<p className="text-xs font-bold opacity-60 leading-relaxed italic">
							Les transferts entre utilisateurs sont instantanés et irréversibles.
							Veuillez toujours vérifier les informations du destinataire avant de valider.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
