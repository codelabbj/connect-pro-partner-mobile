"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { accountHistoryService, AccountTransaction, AccountTransactionsResponse } from "@/lib/account-history"
import { TransactionDetailsModal } from "./transaction-details-modal"

interface AccountHistoryScreenProps {
  onNavigateBack: () => void
}

export function AccountHistoryScreen({ onNavigateBack }: AccountHistoryScreenProps): JSX.Element {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<AccountTransaction | null>(null)
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
  const containerRef = useRef<HTMLDivElement>(null)

  const { theme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()

  const itemsPerPage = 10

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

  // Load account transactions
  const loadAccountTransactions = async (page: number = 1, showLoading: boolean = true) => {
    const accessToken = authService.getAccessToken()
    if (!accessToken) {
      setError("Not authenticated")
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) setIsLoading(true)
      setError(null)

      const response: AccountTransactionsResponse = await accountHistoryService.getAccountTransactions(
        accessToken,
        page,
        itemsPerPage
      )

      setTransactions(response.results)
      setTotalCount(response.count)
      setTotalPages(Math.ceil(response.count / itemsPerPage))
      setCurrentPage(page)
    } catch (error: any) {
      console.error('Failed to load account transactions:', error)
      setError(error?.message || "Failed to load account transactions")
      toast({
        title: t("common.error"),
        description: error?.message || "Failed to load account transactions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Pull-to-refresh handler
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await loadAccountTransactions(currentPage, false)
    } catch (error) {
      console.error('Pull-to-refresh error:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
    }
  }

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAccountTransactions(currentPage, false)
  }

  // Copy reference to clipboard
  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference)
      toast({
        title: "Reference copied",
        description: `Reference ${reference} copied to clipboard`,
      })
    } catch (error) {
      console.error('Failed to copy reference:', error)
      toast({
        title: "Copy failed",
        description: "Failed to copy reference to clipboard",
        variant: "destructive",
      })
    }
  }

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!pullToRefreshState.canPull || window.scrollY > 0) return
    setPullToRefreshState(prev => ({ ...prev, startY: e.touches[0].clientY, currentY: e.touches[0].clientY, canPull: true }))
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || pullToRefreshState.isRefreshing) {
      setPullToRefreshState(prev => ({ ...prev, canPull: false }))
      return
    }
    const distance = Math.min(Math.max(0, e.touches[0].clientY - pullToRefreshState.startY), maxPullDistance)
    if (distance > pullingThreshold) {
      e.preventDefault()
      setPullToRefreshState(prev => ({ ...prev, isPulling: true, pullDistance: distance }))
    }
  }

  const handleTouchEnd = () => {
    if (pullToRefreshState.pullDistance >= refreshThreshold && !pullToRefreshState.isRefreshing) {
      handlePullToRefresh()
    } else {
      setPullToRefreshState(prev => ({ ...prev, isPulling: false, pullDistance: 0 }))
    }
  }

  useEffect(() => {
    const handleScroll = () => setPullToRefreshState(prev => ({ ...prev, canPull: window.scrollY === 0 }))
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load data on mount and page change
  useEffect(() => {
    loadAccountTransactions(currentPage)
  }, [currentPage])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (isLoading && currentPage === 1) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading account history...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}
      style={{ transform: `translateY(${pullToRefreshState.pullDistance}px)`, transition: pullToRefreshState.isPulling ? 'none' : 'transform 0.3s' }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>

      {/* PTR Indicator */}
      {(pullToRefreshState.isPulling || pullToRefreshState.isRefreshing) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center">
          <RefreshCw className={`w-5 h-5 ${pullToRefreshState.isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onNavigateBack} className="rounded-full bg-white/50 dark:bg-gray-800/50 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black">Account History</h1>
            <p className="text-sm opacity-60 font-medium">Balance changes and history</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-12">
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-black">Transactions ({totalCount})</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="rounded-full">
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-10">
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <Button onClick={() => loadAccountTransactions(currentPage)} variant="outline">Retry</Button>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx, idx) => (
                  <div key={tx.uid} onClick={() => { setSelectedTransaction(tx); setDetailsOpen(true); }}
                    className="p-4 rounded-[1.5rem] bg-gray-50 dark:bg-gray-900/50 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.is_credit ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tx.is_credit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{tx.type_display}</p>
                          <p className="text-[10px] opacity-50 font-medium">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${tx.is_credit ? 'text-green-500' : ''}`}>
                          {tx.is_credit ? '+' : '-'}{tx.formatted_amount}
                        </p>
                        <p className="text-[10px] opacity-40 font-bold">Bal: {parseFloat(tx.balance_after).toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center opacity-40 font-bold">No history available</div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-gray-700">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronLeft /> Prev</Button>
                <p className="text-xs font-black opacity-50">{currentPage} / {totalPages}</p>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next <ChevronRight /></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <TransactionDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} transaction={selectedTransaction ? { ...selectedTransaction, historyType: 'transaction' } : null} />
      </div>
    </div>
  )
}
