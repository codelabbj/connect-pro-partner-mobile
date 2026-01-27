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

  // Load data on mount and page change
  useEffect(() => {
    loadAccountTransactions(currentPage)
  }, [currentPage])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  // Get transaction icon
  const getTransactionIcon = (transaction: AccountTransaction) => {
    return transaction.is_credit ? TrendingUp : TrendingDown
  }

  // Get status color
  const getStatusColor = (transaction: AccountTransaction) => {
    return transaction.is_credit ? "text-green-500" : "text-red-500"
  }

  if (isLoading && currentPage === 1) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading account history...</p>
        </div>
      </div>
    )
  }

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
      <div className="px-4 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 rounded-full ${
              theme === "dark"
                ? "text-gray-300 hover:bg-gray-700/50"
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={onNavigateBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Account History
            </h1>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              View your account balance changes
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 safe-area-inset-bottom">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className={`text-lg sm:text-xl font-bold truncate ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Balance Transactions ({totalCount})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className={`h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full transition-all duration-300 active:scale-95 touch-manipulation ${
                  theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-600"
                }`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            {error ? (
              <div className="text-center py-8 sm:py-10">
                <p className={`text-sm sm:text-base ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                  {error}
                </p>
                <Button
                  onClick={() => loadAccountTransactions(currentPage)}
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : transactions.length > 0 ? (
              <>
                {/* Transaction List */}
                <div className="space-y-0.5 sm:space-y-1 mb-4">
                  {transactions.map((transaction, index) => {
                    const TransactionIcon = getTransactionIcon(transaction)

                    return (
                      <div
                        key={transaction.uid}
                        className={`flex items-center justify-between py-3 sm:py-4 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                          theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-100/30"
                        } ${
                          index !== transactions.length - 1
                            ? theme === "dark"
                              ? "border-b border-gray-700/50"
                              : "border-b border-gray-200/50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                              transaction.is_credit
                                ? "bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-500"
                                : "bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-500"
                            }`}
                          >
                            <TransactionIcon className="w-5 h-5 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                              <p className={`font-semibold text-sm sm:text-base truncate ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {transaction.type_display}
                              </p>
                            </div>
                            <p className={`text-xs sm:text-sm truncate ${
                              theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}>
                              {formatDate(transaction.created_at)}
                            </p>
                            <p className={`text-xs sm:text-sm truncate mt-0.5 ${
                              theme === "dark" ? "text-gray-500" : "text-gray-500"
                            }`}>
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-0.5">
                              {transaction.reference && (
                                <>
                                  <span className="text-[10px] sm:text-xs opacity-50 hidden xs:inline">•</span>
                                  <span className="text-[10px] sm:text-xs font-mono opacity-70 truncate max-w-[80px] sm:max-w-none">
                                    {transaction.reference}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      copyReference(transaction.reference)
                                    }}
                                    className={`h-7 w-7 sm:h-6 sm:w-6 p-1.5 sm:p-1 rounded transition-all duration-200 active:scale-95 touch-manipulation flex-shrink-0 ${
                                      theme === "dark"
                                        ? "hover:bg-gray-600/50 active:bg-gray-600/70 text-gray-400 hover:text-gray-300"
                                        : "hover:bg-gray-200/50 active:bg-gray-300/70 text-gray-500 hover:text-gray-700"
                                    }`}
                                    title="Copy reference"
                                    aria-label="Copy reference"
                                  >
                                    <Copy className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                          <p className={`font-bold text-sm sm:text-base whitespace-nowrap ${getStatusColor(transaction)}`}>
                            {transaction.formatted_amount}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <DollarSign className="w-3 h-3 opacity-50" />
                            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {parseFloat(transaction.balance_after).toLocaleString()} FCFA
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoading}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 sm:py-10">
                <p className={`text-sm sm:text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  No account transactions found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
