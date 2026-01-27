"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { autoRechargeService, AutoRechargeTransactionDetail, AutoRechargeStatus } from "@/lib/auto-recharge"
import { formatAmount } from "@/lib/utils"
import { authService } from "@/lib/auth"

interface AutoRechargeTransactionDetailScreenProps {
  transactionUid: string
  onNavigateBack: () => void
}

export function AutoRechargeTransactionDetailScreen({ 
  transactionUid,
  onNavigateBack 
}: AutoRechargeTransactionDetailScreenProps): JSX.Element {
  const [transaction, setTransaction] = useState<AutoRechargeTransactionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  
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

  // Load transaction detail
  const loadTransactionDetail = async () => {
    const accessToken = authService.getAccessToken()
    if (!accessToken) return
    
    setIsLoading(true)
    setError("")
    try {
      const data = await autoRechargeService.getTransactionDetail(accessToken, transactionUid)
      setTransaction(data)
    } catch (error: any) {
      console.error('Failed to load transaction detail:', error)
      setError(error?.message || 'Failed to load transaction details')
    } finally {
      setIsLoading(false)
    }
  }

  // Check transaction status
  const checkStatus = async () => {
    const accessToken = authService.getAccessToken()
    if (!accessToken) return
    
    setIsRefreshing(true)
    try {
      const statusData = await autoRechargeService.getTransactionStatus(accessToken, transactionUid)
      if (transaction) {
        setTransaction({
          ...transaction,
          status: statusData.status as AutoRechargeStatus,
          status_display: statusData.status_display,
          completed_at: statusData.completed_at,
          failed_at: statusData.failed_at,
          error_message: statusData.error_message,
        })
      }
    } catch (error: any) {
      console.error('Failed to check status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTransactionDetail()
  }, [transactionUid])

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

  // Refresh transaction (pull-to-refresh)
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await loadTransactionDetail()
      await checkStatus()
    } catch (error) {
      console.error('Pull-to-refresh error:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
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

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("autoRechargeTransactionDetail.na")
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Helper function to get status color and icon
  const getStatusInfo = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('success') || statusLower.includes('completed')) {
      return {
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        icon: CheckCircle,
        text: t("autoRechargeTransactions.status.success")
      }
    }
    if (statusLower.includes('pending') || statusLower.includes('processing')) {
      return {
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        icon: Clock,
        text: t("autoRechargeTransactions.status.pending")
      }
    }
    if (statusLower.includes('failed') || statusLower.includes('error')) {
      return {
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        icon: XCircle,
        text: t("autoRechargeTransactions.status.failed")
      }
    }
    return {
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      icon: Clock,
      text: status
    }
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
              <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("autoRechargeTransactionDetail.title")}
              </h1>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("autoRechargeTransactionDetail.subtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 w-10 p-0 rounded-full transition-colors duration-300 ${
              theme === "dark" 
                ? "hover:bg-gray-700/50 text-gray-300" 
                : "hover:bg-gray-100/50 text-gray-600"
            }`}
            onClick={checkStatus}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-8">
        {isLoading ? (
          <Card className={`border-0 shadow-xl backdrop-blur-sm ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}>
            <CardContent className="py-8">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("autoRechargeTransactionDetail.loading")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className={`border-0 shadow-xl backdrop-blur-sm ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}>
            <CardContent className="py-8">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <p className={`text-sm ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                  {error}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : transaction ? (
          <div className="space-y-4">
            {/* Status Card */}
            <Card className={`border-0 shadow-xl backdrop-blur-sm ${
              theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {t("autoRechargeTransactionDetail.status")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusInfo = getStatusInfo(transaction.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusInfo.bgColor}`}>
                          <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-lg ${statusInfo.color}`}>
                            {transaction.status_display || statusInfo.text}
                          </p>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {transaction.status}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details Card */}
            <Card className={`border-0 shadow-xl backdrop-blur-sm ${
              theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {t("autoRechargeTransactionDetail.transactionDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reference */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("autoRechargeTransactionDetail.reference")}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-mono font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {transaction.reference}
                    </span>
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

                {/* Network */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("autoRechargeTransactionDetail.network")}:
                  </span>
                  <div className="flex items-center gap-2">
                    {transaction.network.image ? (
                      <img 
                        src={transaction.network.image} 
                        alt={transaction.network.nom}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {transaction.network.nom}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("autoRechargeTransactionDetail.phoneNumber")}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {transaction.phone_number}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700`}
                      onClick={() => copyToClipboard(transaction.phone_number)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("autoRechargeTransactionDetail.amount")}:
                  </span>
                  <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {formatAmount(transaction.amount)} FCFA
                  </span>
                </div>

                {/* Fee */}
                {transaction.fee && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("autoRechargeTransactionDetail.fee")}:
                    </span>
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatAmount(transaction.fee)} FCFA
                    </span>
                  </div>
                )}

                {/* Total Amount */}
                {transaction.total_amount && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {t("autoRechargeTransactionDetail.total")}:
                    </span>
                    <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatAmount(transaction.total_amount)} FCFA
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps Card */}
            <Card className={`border-0 shadow-xl backdrop-blur-sm ${
              theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {t("autoRechargeTransactionDetail.timestamps")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("autoRechargeTransactionDetail.createdAt")}:
                  </span>
                  <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {formatDate(transaction.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("autoRechargeTransactionDetail.updatedAt")}:
                  </span>
                  <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {formatDate(transaction.updated_at)}
                  </span>
                </div>
                {transaction.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("autoRechargeTransactionDetail.completedAt")}:
                    </span>
                    <span className={`text-sm font-medium text-green-500`}>
                      {formatDate(transaction.completed_at)}
                    </span>
                  </div>
                )}
                {transaction.failed_at && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("autoRechargeTransactionDetail.failedAt")}:
                    </span>
                    <span className={`text-sm font-medium text-red-500`}>
                      {formatDate(transaction.failed_at)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Message */}
            {transaction.error_message && (
              <Card className={`border-0 shadow-xl backdrop-blur-sm border-red-500/20 ${
                theme === "dark" ? "bg-red-900/10 text-white" : "bg-red-50 text-gray-900"
              }`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-bold text-red-500`}>
                    {t("autoRechargeTransactionDetail.errorMessage")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>
                    {transaction.error_message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

