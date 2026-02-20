"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Bell,
  Settings,
  MoreHorizontal,
  History,
  Battery,
  Send,
  Activity,
  Smartphone,
  Zap,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts"
import { authService } from "@/lib/auth"
import { bettingService } from "@/lib/betting-api"
import { transactionsService } from "@/lib/transactions"
import { rechargeService } from "@/lib/recharge"
import { transfersService } from "@/lib/transfers"
import { autoRechargeService } from "@/lib/auto-recharge"
import { TransactionDetailsModal } from "@/components/transaction-details-modal"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DashboardScreenProps {
  onNavigateToDeposit: () => void
  onNavigateToWithdraw: () => void
  onNavigateToSettings: () => void
  onNavigateToNotifications: () => void
  onNavigateToTransactionHistory?: () => void
  onNavigateToAccountHistory?: () => void
  onNavigateToRechargeHistory?: () => void
  onNavigateToTransferHistory?: () => void
  onNavigateToBettingTransactions?: () => void
  onNavigateToAutoRecharge?: () => void
  onNavigateToAutoRechargeTransactions?: () => void
  onNavigateToRecharge?: () => void
  onNavigateToTransfer?: () => void
}

export function DashboardScreen({
  onNavigateToDeposit,
  onNavigateToWithdraw,
  onNavigateToSettings,
  onNavigateToNotifications,
  onNavigateToTransactionHistory,
  onNavigateToAccountHistory,
  onNavigateToRechargeHistory,
  onNavigateToTransferHistory,
  onNavigateToBettingTransactions,
  onNavigateToAutoRecharge,
  onNavigateToAutoRechargeTransactions,
  onNavigateToRecharge,
  onNavigateToTransfer,
}: DashboardScreenProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [recentHistory, setRecentHistory] = useState<any[]>([])
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
  const { user, accountData, transactions, refreshTransactions, refreshAccountData, refreshRecharges } = useAuth()
  const { toast } = useToast()

  // Copy reference to clipboard
  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference)
      toast({
        title: t("dashboard.referenceCopied"),
        description: `${t("dashboard.referenceCopiedDesc")}: ${reference}`,
      })
    } catch (error) {
      console.error('Failed to copy reference:', error)
      toast({
        title: t("dashboard.copyFailed"),
        description: t("dashboard.copyFailedDesc"),
        variant: "destructive",
      })
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Load unified recent history
  const loadRecentHistory = async () => {
    const accessToken = authService.getAccessToken()
    if (!accessToken) return

    try {
      const [accountTx, bettingTx, recharges, transfers, autoRecharges] = await Promise.allSettled([
        transactionsService.getTransactions(accessToken, 1, 3),
        bettingService.getBettingTransactions({ page: 1, ordering: '-created_at' }),
        rechargeService.getRecharges(accessToken, 1, 3),
        transfersService.myTransfers(),
        autoRechargeService.getTransactions(accessToken, 1, 3),
      ])

      const unified: any[] = []

      // Add account transactions
      if (accountTx.status === 'fulfilled') {
        accountTx.value.results.slice(0, 3).forEach(tx => {
          unified.push({
            ...tx,
            historyType: 'transaction',
            created_at: tx.created_at,
          })
        })
      }

      // Add betting transactions
      if (bettingTx.status === 'fulfilled') {
        bettingTx.value.results.slice(0, 3).forEach(tx => {
          unified.push({
            ...tx,
            historyType: 'betting',
            created_at: tx.created_at,
          })
        })
      }

      // Add recharges
      if (recharges.status === 'fulfilled') {
        recharges.value.results.slice(0, 3).forEach(recharge => {
          unified.push({
            ...recharge,
            historyType: 'recharge',
            created_at: recharge.created_at,
            amount: recharge.amount,
          })
        })
      }

      // Add transfers
      if (transfers.status === 'fulfilled') {
        const transfersData = transfers.value
        // Map sent and received transfers to unified format with direction
        const sent = (transfersData.sent_transfers || []).map((t: any) => ({ ...t, isReceived: false }))
        const received = (transfersData.received_transfers || []).map((t: any) => ({ ...t, isReceived: true }))
        const allTransfers = [...sent, ...received]

        allTransfers.slice(0, 3).forEach((transfer: Record<string, any>) => {
          unified.push({
            ...transfer,
            historyType: 'transfer',
            created_at: transfer.created_at || new Date().toISOString(),
            amount: transfer.amount || '0',
            reference: transfer.reference || transfer.uid || '',
            status: transfer.status || 'pending',
            status_display: transfer.status_display || transfer.status || 'Pending',
            isReceived: transfer.isReceived
          })
        })
      }

      // Add auto-recharge transactions
      if (autoRecharges.status === 'fulfilled') {
        autoRecharges.value.results.slice(0, 3).forEach((autoRecharge: Record<string, any>) => {
          unified.push({
            ...autoRecharge,
            historyType: 'auto-recharge',
            created_at: autoRecharge.created_at,
            amount: autoRecharge.amount,
            formatted_amount: autoRecharge.formatted_amount || autoRecharge.amount,
            reference: autoRecharge.reference || autoRecharge.uid || '',
            status: autoRecharge.status || 'pending',
            status_display: autoRecharge.status_display || autoRecharge.status || 'Pending',
          })
        })
      }

      // Sort by date (newest first) and limit to top 5
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentHistory(unified.slice(0, 5))
    } catch (error) {
      console.error('Failed to load recent history:', error)
    }
  }

  // Load history on mount and when transactions change
  useEffect(() => {
    loadRecentHistory()
  }, [transactions])

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

  // Refresh all data (used by pull-to-refresh)
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await Promise.all([
        refreshAccountData(),
        refreshTransactions(),
        refreshRecharges(),
        loadRecentHistory(),
      ])
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
    }
  }

  // Refresh transactions (manual button)
  const handleRefreshTransactions = async () => {
    setIsRefreshing(true)
    try {
      await refreshTransactions()
      await loadRecentHistory()
      toast({
        title: t("dashboard.refresh"),
        description: t("dashboard.refreshSuccess"),
      })
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
      toast({
        title: t("dashboard.refreshFailed"),
        description: t("dashboard.refreshFailed"),
        variant: "destructive",
      })
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


  // Helper function to format transaction date
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return t("dashboard.transactions.time.justNow")
    if (diffInHours < 24) return t("dashboard.transactions.time.hours", { count: diffInHours })
    const diffInDays = Math.floor(diffInHours / 24)
    return t("dashboard.transactions.time.days", { count: diffInDays })
  }

  // Helper function to format transaction amount
  const formatTransactionAmount = (amount: string, type: string) => {
    const formattedAmount = parseFloat(amount).toLocaleString()
    return type === "deposit" ? `+${formattedAmount}` : `-${formattedAmount}`
  }

  // Helper function to get transaction status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "sent_to_user":
      case "approved":
      case "completed":  // Auto-recharge completed
        return "text-green-500"
      case "pending":
      case "proof_submitted":
      case "initiated":  // Auto-recharge initiated
      case "processing": // Auto-recharge processing
        return "text-yellow-500"
      case "failed":
      case "rejected":
      case "expired":    // Auto-recharge expired
      case "cancelled":  // Auto-recharge cancelled
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  // Get type icon based on history type
  const getTypeIcon = (item: any) => {
    switch (item.historyType) {
      case 'transaction':
        return item.type === 'deposit' ? TrendingUp : TrendingDown
      case 'betting':
        return item.transaction_type === 'deposit' ? TrendingUp : TrendingDown
      case 'recharge':
        return Battery
      case 'transfer':
        return Send
      case 'auto-recharge':
        return Smartphone
      default:
        return Activity
    }
  }

  // Get type badge label
  const getTypeBadge = (item: any) => {
    switch (item.historyType) {
      case 'transaction':
        return item.type === 'deposit' ? t("dashboard.transactions.deposit") : t("dashboard.transactions.withdrawal")
      case 'betting':
        return item.transaction_type === 'deposit' ? t("betting.transactions.filters.deposit") : t("betting.transactions.filters.withdrawal")
      case 'recharge':
        return t("nav.recharge")
      case 'transfer':
        return t("nav.transfer")
      case 'auto-recharge':
        return t("nav.autoRecharge")
      default:
        return t("common.all")
    }
  }

  // Get recipient/partner name
  const getRecipientName = (item: any) => {
    if (item.historyType === 'transaction') {
      return item.display_recipient_name || item.recipient_phone
    }
    if (item.historyType === 'betting') {
      return item.platform_name || item.partner_name
    }
    if (item.historyType === 'recharge') {
      return t("nav.recharge")
    }
    if (item.historyType === 'transfer') {
      return item.recipient_name || item.recipient_email || t("nav.transfer")
    }
    if (item.historyType === 'auto-recharge') {
      return item.network?.nom || item.phone_number || t("nav.autoRecharge")
    }
    return t("common.all")
  }

  // Handle item click to open details modal
  const handleItemClick = (item: any) => {
    setSelectedTransaction(item)
    setDetailsModalOpen(true)
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-300 ${theme === "dark"
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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl shadow-lg ${theme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
          }`}>
          <RefreshCw className={`w-5 h-5 ${pullToRefreshState.isRefreshing ? 'animate-spin' : ''
            } ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
        </div>
      )}
      {/* Header */}
      <div className="px-4 pt-16 pb-8 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className={`text-2xl font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{t("dashboard.greeting")}</h1>
            <p className={`text-4xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {user ? `${user.first_name} ${user.last_name}` : t("dashboard.userName")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-full ${theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600"}`}
              onClick={onNavigateToNotifications}
              title={t("dashboard.notifications")}
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-full ${theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600"}`}
              onClick={onNavigateToSettings}
              title={t("dashboard.settings")}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="relative">
          {/* Background Gradient */}
          <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${theme === "dark"
            ? "bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-gray-800/80"
            : "bg-gradient-to-br from-blue-50/80 via-white/60 to-purple-50/80"
            } backdrop-blur-xl`}></div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className={`w-full h-full rounded-full blur-3xl ${theme === "dark" ? "bg-blue-500/30" : "bg-blue-400/20"
              }`}></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-15">
            <div className={`w-full h-full rounded-full blur-2xl ${theme === "dark" ? "bg-purple-500/30" : "bg-purple-400/20"
              }`}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-base font-semibold tracking-wide uppercase ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                {t("dashboard.totalBalance")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className={`h-10 w-10 p-0 rounded-2xl transition-all duration-300 ${theme === "dark"
                  ? "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                  : "hover:bg-gray-100/50 text-gray-600 hover:text-gray-900"
                  } hover:scale-110`}
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            </div>

            <div className="mb-8">
              <p className={`text-5xl font-black tracking-tight mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                {showBalance ? (accountData?.formatted_balance || "••••••") : "••••••"}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <p className="text-base text-green-500 font-bold">
                    {accountData ? `${accountData.utilization_rate.toFixed(1)}% utilization` : t("dashboard.growth")}
                  </p>
                </div>
                {onNavigateToRecharge && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRechargeModal(true)}
                    className={`h-8 px-3 text-xs font-medium rounded-full transition-all duration-300 ${theme === "dark"
                      ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200"
                      : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 hover:text-purple-700"
                      } hover:scale-105 active:scale-95`}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    {t("nav.recharge")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {/* Deposit Button */}
          <Button
            onClick={onNavigateToDeposit}
            className={`group relative h-28 sm:h-32 flex-col gap-2 sm:gap-4 border-0 overflow-hidden transition-all duration-500 ease-out ${theme === "dark"
              ? "bg-transparent hover:bg-blue-500/10 text-white"
              : "bg-transparent hover:bg-blue-500/10 text-gray-900"
              } hover:scale-[1.03] active:scale-[0.97] p-2`}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>

            {/* Icon */}
            <TrendingUp className="relative z-10 text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 w-7 h-7 sm:w-8 sm:h-8" />

            {/* Text */}
            <span className="relative z-10 text-xs sm:text-sm font-bold tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-500 text-center">
              {t("dashboard.actions.deposit")}
            </span>

            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-2xl border border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Button>

          {/* Transfer UV Button */}
          <Button
            onClick={onNavigateToTransfer}
            className={`group relative h-28 sm:h-32 flex-col gap-2 sm:gap-4 border-0 overflow-hidden transition-all duration-500 ease-out ${theme === "dark"
              ? "bg-transparent hover:bg-purple-500/10 text-white"
              : "bg-transparent hover:bg-purple-500/10 text-gray-900"
              } hover:scale-[1.03] active:scale-[0.97] p-2`}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>

            {/* Icon */}
            <Send className="relative z-10 text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 w-7 h-7 sm:w-8 sm:h-8" />

            {/* Text */}
            <span className="relative z-10 text-xs sm:text-sm font-bold tracking-wide group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors duration-500 text-center">
              Transfert UV
            </span>

            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-2xl border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Button>

          {/* Withdraw Button */}
          <Button
            onClick={onNavigateToWithdraw}
            className={`group relative h-28 sm:h-32 flex-col gap-2 sm:gap-4 border-0 overflow-hidden transition-all duration-500 ease-out ${theme === "dark"
              ? "bg-transparent hover:bg-green-500/10 text-white"
              : "bg-transparent hover:bg-green-500/10 text-gray-900"
              } hover:scale-[1.03] active:scale-[0.97] p-2`}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>

            {/* Icon */}
            <TrendingDown className="relative z-10 text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 w-7 h-7 sm:w-8 sm:h-8" />

            {/* Text */}
            <span className="relative z-10 text-xs sm:text-sm font-bold tracking-wide group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors duration-500 text-center">
              {t("dashboard.actions.withdraw")}
            </span>

            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-2xl border border-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-3 sm:px-4 pb-6 sm:pb-8 safe-area-inset-bottom">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
            }`}
        >
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className={`text-xl sm:text-2xl font-bold truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("dashboard.recentTransactions")}
              </CardTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full transition-all duration-300 active:scale-95 touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-600"
                    }`}
                  onClick={handleRefreshTransactions}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                {(onNavigateToTransactionHistory || onNavigateToRechargeHistory || onNavigateToTransferHistory || onNavigateToBettingTransactions || onNavigateToAutoRechargeTransactions) && (
                  <div ref={dropdownRef} className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full transition-all duration-300 active:scale-95 touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-600"
                        }`}
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <MoreHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
                    </Button>
                    {showDropdown && (
                      <div className={`absolute right-0 top-12 sm:top-10 z-50 w-[calc(100vw-2rem)] sm:w-64 max-w-[280px] sm:max-w-none rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-xl ${theme === "dark" ? "bg-gray-800/95 border border-gray-700" : "bg-white/95 border border-gray-200"
                        } overflow-hidden`}>
                        <div className="p-1.5 sm:p-2">
                          {onNavigateToTransactionHistory && (
                            <Button
                              variant="ghost"
                              className={`w-full justify-start h-12 sm:h-12 px-3 sm:px-4 text-sm sm:text-base active:scale-[0.98] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-700"
                                }`}
                              onClick={() => {
                                onNavigateToTransactionHistory()
                                setShowDropdown(false)
                              }}
                            >
                              <History className="w-5 h-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{t("nav.transactionHistory")}</span>
                            </Button>
                          )}
                          {onNavigateToAccountHistory && (
                            <Button
                              variant="ghost"
                              className={`w-full justify-start h-12 sm:h-12 px-3 sm:px-4 text-sm sm:text-base active:scale-[0.98] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-700"
                                }`}
                              onClick={() => {
                                onNavigateToAccountHistory()
                                setShowDropdown(false)
                              }}
                            >
                              <Activity className="w-5 h-5 mr-2 sm:mr-3 text-purple-500 flex-shrink-0" />
                              <span className="truncate">{t("nav.accountHistory")}</span>
                            </Button>
                          )}
                          {onNavigateToRechargeHistory && (
                            <Button
                              variant="ghost"
                              className={`w-full justify-start h-12 sm:h-12 px-3 sm:px-4 text-sm sm:text-base active:scale-[0.98] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-700"
                                }`}
                              onClick={() => {
                                onNavigateToRechargeHistory()
                                setShowDropdown(false)
                              }}
                            >
                              <Battery className="w-5 h-5 mr-2 sm:mr-3 text-purple-500 flex-shrink-0" />
                              <span className="truncate">{t("nav.rechargeHistory")}</span>
                            </Button>
                          )}
                          {onNavigateToTransferHistory && (
                            <Button
                              variant="ghost"
                              className={`w-full justify-start h-12 sm:h-12 px-3 sm:px-4 text-sm sm:text-base active:scale-[0.98] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-700"
                                }`}
                              onClick={() => {
                                onNavigateToTransferHistory()
                                setShowDropdown(false)
                              }}
                            >
                              <Send className="w-5 h-5 mr-2 sm:mr-3 text-green-500 flex-shrink-0" />
                              <span className="truncate">{t("nav.transferHistory")}</span>
                            </Button>
                          )}
                          {onNavigateToBettingTransactions && (
                            <Button
                              variant="ghost"
                              className={`w-full justify-start h-12 sm:h-12 px-3 sm:px-4 text-sm sm:text-base active:scale-[0.98] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-700"
                                }`}
                              onClick={() => {
                                onNavigateToBettingTransactions()
                                setShowDropdown(false)
                              }}
                            >
                              <Activity className="w-5 h-5 mr-2 sm:mr-3 text-yellow-500 flex-shrink-0" />
                              <span className="truncate">{t("nav.bettingTransactions")}</span>
                            </Button>
                          )}
                          {onNavigateToAutoRechargeTransactions && (
                            <Button
                              variant="ghost"
                              className={`w-full justify-start h-12 sm:h-12 px-3 sm:px-4 text-sm sm:text-base active:scale-[0.98] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/50 active:bg-gray-700/70 text-gray-300" : "hover:bg-gray-100/50 active:bg-gray-200/70 text-gray-700"
                                }`}
                              onClick={() => {
                                onNavigateToAutoRechargeTransactions()
                                setShowDropdown(false)
                              }}
                            >
                              <Smartphone className="w-5 h-5 mr-2 sm:mr-3 text-indigo-500 flex-shrink-0" />
                              <span className="truncate">{t("nav.autoRechargeHistory")}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-0.5 sm:space-y-1">
            {recentHistory.length > 0 ? (
              recentHistory.map((item, index) => {
                const TypeIcon = getTypeIcon(item)
                const isDeposit = (item.historyType === 'transaction' && item.type === 'deposit') ||
                  (item.historyType === 'betting' && item.transaction_type === 'deposit') ||
                  (item.historyType === 'auto-recharge')
                const amount = item.formatted_amount || item.amount || '0'

                return (
                  <div
                    key={item.uid || item.reference || index}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center justify-between py-3 sm:py-4 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.99] touch-manipulation ${theme === "dark" ? "hover:bg-gray-700/30 active:bg-gray-700/40" : "hover:bg-gray-100/30 active:bg-gray-100/40"
                      } ${index !== recentHistory.length - 1
                        ? theme === "dark"
                          ? "border-b border-gray-700/50"
                          : "border-b border-gray-200/50"
                        : ""
                      }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${isDeposit || item.historyType === 'recharge' || item.historyType === 'auto-recharge' || (item.historyType === 'transfer' && item.isReceived)
                          ? "bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-500"
                          : (item.historyType === 'transfer' && !item.isReceived)
                            ? "bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-500"
                            : theme === "dark"
                              ? "bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300"
                              : "bg-gradient-to-br from-gray-200 to-gray-100 text-gray-600"
                          }`}
                      >
                        <TypeIcon className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                          <p className={`font-semibold text-base sm:text-lg truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {getRecipientName(item)}
                          </p>
                          <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 flex-shrink-0">
                            {getTypeBadge(item)}
                          </Badge>
                        </div>
                        <p className={`text-sm sm:text-base truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {formatTransactionDate(item.created_at)}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1">
                          <p className={`text-xs sm:text-sm ${getStatusColor(item.status)}`}>
                            {item.status_display || item.status || ''}
                          </p>
                          {item.reference && (
                            <>
                              <span className="text-xs sm:text-sm opacity-50 hidden xs:inline">•</span>
                              <span className="text-xs sm:text-sm font-mono opacity-70 truncate max-w-[100px] sm:max-w-none">{item.reference}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyReference(item.reference)
                                }}
                                className={`h-7 w-7 sm:h-6 sm:w-6 p-1.5 sm:p-1 rounded transition-all duration-200 active:scale-95 touch-manipulation flex-shrink-0 ${theme === "dark"
                                  ? "hover:bg-gray-600/50 active:bg-gray-600/70 text-gray-400 hover:text-gray-300"
                                  : "hover:bg-gray-200/50 active:bg-gray-300/70 text-gray-500 hover:text-gray-700"
                                  }`}
                                title={t("common.copy")}
                                aria-label={t("common.copy")}
                              >
                                <Copy className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                      <p
                        className={`font-bold text-base sm:text-lg whitespace-nowrap ${isDeposit || item.historyType === 'recharge' || item.historyType === 'auto-recharge' || (item.historyType === 'transfer' && item.isReceived)
                          ? "text-green-500"
                          : (item.historyType === 'transfer' && !item.isReceived)
                            ? "text-red-500"
                            : theme === "dark"
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                      >
                        <span className="hidden sm:inline">
                          {item.historyType === 'transaction'
                            ? formatTransactionAmount(item.amount, item.type)
                            : item.historyType === 'betting'
                              ? `${item.transaction_type === 'deposit' ? '+' : '-'}${parseFloat(item.amount).toLocaleString()}`
                              : item.historyType === 'recharge'
                                ? `+${parseFloat(item.amount).toLocaleString()}`
                                : item.historyType === 'auto-recharge'
                                  ? item.formatted_amount ? `+${item.formatted_amount}` : `+${parseFloat(item.amount).toLocaleString()}`
                                  : item.historyType === 'transfer'
                                    ? `${item.isReceived ? '+' : '-'}${parseFloat(item.amount).toLocaleString()}`
                                    : parseFloat(item.amount).toLocaleString()}{' '}FCFA
                        </span>
                        <span className="sm:hidden">
                          {item.historyType === 'transaction'
                            ? formatTransactionAmount(item.amount, item.type)
                            : item.historyType === 'betting'
                              ? `${item.transaction_type === 'deposit' ? '+' : '-'}${parseFloat(item.amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
                              : item.historyType === 'recharge'
                                ? `+${parseFloat(item.amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
                                : item.historyType === 'auto-recharge'
                                  ? item.formatted_amount ? `+${item.formatted_amount}` : `+${parseFloat(item.amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
                                  : item.historyType === 'transfer'
                                    ? `${item.isReceived ? '+' : '-'}${parseFloat(item.amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
                                    : parseFloat(item.amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}{' '}FCFA
                        </span>
                      </p>
                      <div className={`w-2 h-2 rounded-full ml-auto mt-1.5 sm:mt-2 ${item.status === "success" || item.status === "sent_to_user" || item.status === "approved" ||
                        (item.historyType === 'auto-recharge' && item.status === 'completed')
                        ? "bg-green-500"
                        : item.status === "pending" || item.status === "proof_submitted" ||
                          (item.historyType === 'auto-recharge' && (item.status === 'pending' || item.status === 'initiated' || item.status === 'processing'))
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        }`}></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 sm:py-12">
                <p className={`text-base sm:text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("dashboard.noTransactions")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        open={detailsModalOpen}
        onOpenChange={(open) => setDetailsModalOpen(open)}
        transaction={selectedTransaction}
      />

      {/* Recharge Options Modal */}
      <Dialog open={showRechargeModal} onOpenChange={setShowRechargeModal}>
        <DialogContent className={`max-w-md mx-auto ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold text-center ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
              {t("dashboard.rechargeOptions") || "Recharge Options"}
            </DialogTitle>
            <DialogDescription className={`text-sm text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
              {t("dashboard.rechargeOptionsDesc") || "Choose your recharge method"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {onNavigateToRecharge && (
              <Button
                onClick={() => {
                  onNavigateToRecharge()
                  setShowRechargeModal(false)
                }}
                className={`w-full h-14 text-base font-semibold transition-all duration-300 ${theme === "dark"
                  ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20"
                  } hover:scale-[1.02] active:scale-[0.98]`}
              >
                <Battery className="w-5 h-5 mr-3" />
                {t("nav.recharge")}
              </Button>
            )}

            {onNavigateToAutoRecharge && (
              <Button
                onClick={() => {
                  onNavigateToAutoRecharge()
                  setShowRechargeModal(false)
                }}
                className={`w-full h-14 text-base font-semibold transition-all duration-300 ${theme === "dark"
                  ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                  : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20"
                  } hover:scale-[1.02] active:scale-[0.98]`}
              >
                <Smartphone className="w-5 h-5 mr-3" />
                {t("nav.autoRecharge")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
