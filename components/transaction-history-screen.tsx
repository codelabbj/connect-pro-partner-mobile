"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  Download,
  Copy,
  RefreshCw,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { transactionsService, Transaction, TransactionsResponse } from "@/lib/transactions"
import { TransactionDetailsModal } from "./transaction-details-modal"
import { Badge } from "@/components/ui/badge"

interface TransactionHistoryScreenProps {
  onNavigateBack: () => void
}

export function TransactionHistoryScreen({ onNavigateBack }: TransactionHistoryScreenProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdrawal">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
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
  const { user, transactions, isLoading, refreshTransactions } = useAuth()

  const itemsPerPage = 10

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Refresh transactions (pull-to-refresh)
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await refreshTransactions()
      setCurrentPage(1)
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
    }
  }

  // Refresh transactions (manual button)
  const handleRefreshTransactions = async () => {
    setIsRefreshing(true)
    try {
      await refreshTransactions()
      setCurrentPage(1)
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    } finally {
      setIsRefreshing(false)
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
    const distance = Math.min(Math.max(0, e.touches[0].clientY - pullToRefreshState.startY), 120)
    if (distance > 10) {
      e.preventDefault()
      setPullToRefreshState(prev => ({ ...prev, isPulling: true, pullDistance: distance }))
    }
  }

  const handleTouchEnd = () => {
    if (pullToRefreshState.pullDistance >= 80 && !pullToRefreshState.isRefreshing) {
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

  // Helper functions
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": case "sent_to_user": return "text-green-500 bg-green-500/10 border-green-500/20"
      case "pending": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "failed": return "text-red-500 bg-red-500/10 border-red-500/20"
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === "all" || t.type === filterType
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm === "" ||
      t.display_recipient_name?.toLowerCase().includes(searchLower) ||
      t.recipient_phone?.toLowerCase().includes(searchLower) ||
      t.reference?.toLowerCase().includes(searchLower)
    return matchesType && matchesSearch
  })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const currentTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => setCurrentPage(1), [filterType, searchTerm])

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
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onNavigateBack} className="rounded-full shadow-sm bg-white/50 dark:bg-gray-800/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black">{t("transactionHistory.title")}</h1>
            <p className="text-sm opacity-60 font-medium">{t("transactionHistory.subtitle")}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-opacity" />
            <input type="text" placeholder={t("transactionHistory.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border-0 shadow-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["all", "deposit", "withdrawal"].map(type => (
              <Button key={type} variant={filterType === type ? "default" : "outline"} size="sm" onClick={() => setFilterType(type as any)}
                className={`rounded-full px-6 whitespace-nowrap font-bold shadow-sm ${filterType === type ? "bg-blue-600 shadow-blue-500/20" : ""}`}>
                {t(`transactionHistory.filters.${type === "all" ? "all" : type === "deposit" ? "deposits" : "withdrawals"}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-6 pb-12">
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center animate-pulse font-bold">{t("transactionHistory.loading")}</div>
          ) : currentTransactions.length > 0 ? (
            currentTransactions.map((tx, idx) => (
              <div key={tx.uid} onClick={() => { setSelectedTransaction(tx); setDetailsOpen(true); }}
                className="p-5 rounded-[2rem] bg-white dark:bg-gray-800 shadow-xl dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden group">

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tx.type === 'deposit' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg truncate leading-tight">{tx.display_recipient_name || tx.recipient_phone}</p>
                      <p className="text-xs opacity-50 font-medium">{formatTransactionDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${tx.type === 'deposit' ? 'text-green-500' : ''}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.formatted_amount}
                    </p>
                    <Badge className={`mt-1 font-black text-[10px] uppercase border tracking-tighter ${getStatusColor(tx.status)}`}>
                      {tx.status_display}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black">{tx.network.nom.slice(0, 2)}</div>
                    <p className="text-xs font-bold opacity-70 truncate max-w-[150px]">{tx.reference}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => { e.stopPropagation(); copyToClipboard(tx.reference); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Search className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-bold opacity-40">{t("transactionHistory.noTransactions")}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft /></Button>
            <div className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm font-black text-sm">{currentPage} / {totalPages}</div>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}><ChevronRight /></Button>
          </div>
        )}

        <TransactionDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} transaction={selectedTransaction ? { ...selectedTransaction, historyType: 'transaction' } : null} />
      </div>
    </div>
  )
}
