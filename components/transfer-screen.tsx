"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"

export function TransferScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { theme, resolvedTheme } = useTheme()
	const { t } = useTranslation()
	const [recipient, setRecipient] = useState("")
	const [amount, setAmount] = useState("")
	const [note, setNote] = useState("")
	const [submitting, setSubmitting] = useState(false)
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
	
	const refreshThreshold = 80
	const maxPullDistance = 120
	const pullingThreshold = 10

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
		setError("")
		setSuccess("")
		setSubmitting(true)
		try {
			// Placeholder – implement actual transfer service in lib/transfers.ts
			await new Promise((r) => setTimeout(r, 600))
			setSuccess("Transfer submitted")
		} catch (err: any) {
			setError(err?.message || "Failed to submit transfer")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div 
			ref={containerRef}
			className={`min-h-screen p-4 ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
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
				<div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl shadow-lg ${
					resolvedTheme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
				}`}>
					<RefreshCw className={`w-5 h-5 ${
						pullToRefreshState.isRefreshing ? 'animate-spin' : ''
					} ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
				</div>
			)}
			<div className="max-w-md mx-auto">
				<Button variant="ghost" onClick={onNavigateBack} className="mb-4">{t("common.back")}</Button>
				<Card>
					<CardHeader>
						<CardTitle>{t("transfer.title")}</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={submit} className="space-y-4">
							{error && <div className="text-sm text-red-500">{t("transfer.failed")}</div>}
							{success && <div className="text-sm text-green-600">{t("transfer.submitted")}</div>}
							<Input placeholder={t("transfer.recipientPlaceholder") as string} value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
							<Input placeholder={t("transfer.amountPlaceholder") as string} value={amount} onChange={(e) => setAmount(e.target.value)} required />
							<Input placeholder={t("transfer.notePlaceholder") as string} value={note} onChange={(e) => setNote(e.target.value)} />
							<Button type="submit" disabled={submitting} className="w-full">{submitting ? t("transfer.sending") : t("transfer.send")}</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}


