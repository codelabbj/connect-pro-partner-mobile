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

interface TransactionHistoryScreenProps {
  onNavigateBack: () => void
}

export function TransactionHistoryScreen({ onNavigateBack }: TransactionHistoryScreenProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdrawal">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
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
      // You could add a toast notification here if you have one
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

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
      setCurrentPage(1) // Reset to first page after refresh
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Pull-to-refresh: Touch start handler
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

  // Pull-to-refresh: Touch move handler
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

  // Pull-to-refresh: Touch end handler
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

  // Scroll detection for pull-to-refresh
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

  // Use transactions from context instead of separate API calls
  useEffect(() => {
    console.log('Transaction History - User:', user)
    console.log('Transaction History - Transactions from context:', transactions)
    console.log('Transaction History - Total transactions:', transactions.length)
  }, [user, transactions])

  // Helper function to format transaction date
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper function to format transaction amount
  const formatTransactionAmount = (amount: string, type: string) => {
    const formattedAmount = parseFloat(amount).toLocaleString('fr-FR')
    return type === "deposit" ? `+${formattedAmount}` : `-${formattedAmount}`
  }

  // Helper function to get transaction status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "sent_to_user":
        return "text-green-500"
      case "pending":
        return "text-yellow-500"
      case "failed":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  // Filter transactions based on type and search term
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesSearch = searchTerm === "" || 
      transaction.display_recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.recipient_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchTerm])

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
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
          theme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
        }`}>
          <RefreshCw className={`w-5 h-5 ${
            pullToRefreshState.isRefreshing ? 'animate-spin' : ''
          } ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
        </div>
      )}
      {/* Header */}
      <div className="px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-full transition-colors duration-300 ${
                theme === "dark" 
                  ? "hover:bg-gray-700/50 text-gray-300" 
                  : "hover:bg-gray-100/50 text-gray-600"
              }`}
              onClick={onNavigateBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("transactionHistory.title")}
              </h1>
              <p className={`text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("transactionHistory.subtitle")}
              </p>
            </div>
          </div>
          {/* <Button
            variant="ghost"
            size="sm"
            className={`h-10 w-10 p-0 rounded-full transition-colors duration-300 ${
              theme === "dark" 
                ? "hover:bg-gray-700/50 text-gray-300" 
                : "hover:bg-gray-100/50 text-gray-600"
            }`}
            onClick={handleRefreshTransactions}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button> */}
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`} />
            <input
              type="text"
              placeholder={t("transactionHistory.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-0 transition-colors duration-300 ${
                theme === "dark" 
                  ? "bg-gray-800/80 text-white placeholder-gray-400" 
                  : "bg-white/80 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
              className={`whitespace-nowrap ${
                filterType === "all" 
                  ? "bg-blue-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("transactionHistory.filters.all")}
            </Button>
            <Button
              variant={filterType === "deposit" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("deposit")}
              className={`whitespace-nowrap ${
                filterType === "deposit" 
                  ? "bg-green-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("transactionHistory.filters.deposits")}
            </Button>
            <Button
              variant={filterType === "withdrawal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("withdrawal")}
              className={`whitespace-nowrap ${
                filterType === "withdrawal" 
                  ? "bg-red-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("transactionHistory.filters.withdrawals")}
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 pb-8">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Transactions ({filteredTransactions.length})
              </CardTitle>
              <div className="flex gap-2">
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors duration-300 ${
                    theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600"
                  }`}
                  onClick={refreshTransactions}
                >
                  <Search className="w-4 h-4" />
                </Button> */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 p-0 rounded-full transition-colors duration-300 ${
                    theme === "dark" 
                      ? "hover:bg-gray-700/50 text-gray-300" 
                      : "hover:bg-gray-100/50 text-gray-600"
                  }`}
                  onClick={handleRefreshTransactions}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors duration-300 ${
                    theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600"
                  }`}
                >
                  <Download className="w-4 h-4" />
                </Button> */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <div className="text-center py-8">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("transactionHistory.loading")}
                </p>
              </div>
            ) : currentTransactions.length > 0 ? (
              currentTransactions.map((transaction, index) => (
                <div
                  key={transaction.uid}
                  className={`py-3 px-2 rounded-lg transition-colors duration-300 ${
                    theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-100/30"
                  } ${
                    index !== currentTransactions.length - 1
                      ? theme === "dark"
                        ? "border-b border-gray-700/50"
                        : "border-b border-gray-200/50"
                      : ""
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${
                          transaction.type === "deposit"
                            ? "bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-500"
                            : theme === "dark"
                              ? "bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300"
                              : "bg-gradient-to-br from-gray-200 to-gray-100 text-gray-600"
                        }`}
                      >
                        {transaction.type === "deposit" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-base ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {transaction.display_recipient_name || transaction.recipient_phone}
                        </p>
                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {formatTransactionDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-bold text-base ${
                          transaction.type === "deposit"
                            ? "text-green-500"
                            : theme === "dark"
                              ? "text-white"
                              : "text-gray-900"
                        }`}
                      >
                        {transaction.type === "deposit" ? `+${transaction.formatted_amount}` : `-${transaction.formatted_amount}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Details Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                        <span className="font-medium">{t("transactionHistory.network")}:</span> {transaction.network.nom}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                          <span className="font-medium">{t("transactionHistory.reference")}:</span> {transaction.reference}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700`}
                          onClick={() => copyToClipboard(transaction.reference)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.status === "success" || transaction.status === "sent_to_user"
                          ? "bg-green-500"
                          : transaction.status === "pending"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}></div>
                      <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                        {transaction.status_display}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className={`text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("transactionHistory.noTransactions")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`${
                theme === "dark" 
                  ? "border-gray-600 text-gray-300 disabled:text-gray-600" 
                  : "border-gray-300 text-gray-700 disabled:text-gray-400"
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("transactionHistory.previous")}
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 p-0 ${
                      currentPage === pageNum 
                        ? "bg-blue-500 text-white" 
                        : theme === "dark" 
                          ? "border-gray-600 text-gray-300" 
                          : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`${
                theme === "dark" 
                  ? "border-gray-600 text-gray-300 disabled:text-gray-600" 
                  : "border-gray-300 text-gray-700 disabled:text-gray-400"
              }`}
            >
              {t("transactionHistory.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
