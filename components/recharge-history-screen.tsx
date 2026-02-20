"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Battery,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  Download,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { rechargeService, RechargeData, RechargesResponse } from "@/lib/recharge"
import { Badge } from "@/components/ui/badge"
import { TransactionDetailsModal } from "./transaction-details-modal"

interface RechargeHistoryScreenProps {
  onNavigateBack: () => void
}

export function RechargeHistoryScreen({ onNavigateBack }: RechargeHistoryScreenProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "rejected" | "proof_submitted">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRecharge, setSelectedRecharge] = useState<RechargeData | null>(null)
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

  const { resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const { user, recharges, isLoading, refreshRecharges } = useAuth()

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

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

  // Refresh recharges (pull-to-refresh)
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await refreshRecharges()
      setCurrentPage(1)
    } catch (error) {
      console.error('Failed to refresh recharges:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
    }
  }

  // Refresh recharges (manual button)
  const handleRefreshRecharges = async () => {
    setIsRefreshing(true)
    try {
      await refreshRecharges()
      setCurrentPage(1) // Reset to first page after refresh
    } catch (error) {
      console.error('Failed to refresh recharges:', error)
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

  // Helper function to format recharge date
  const formatRechargeDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper function to format recharge amount
  const formatRechargeAmount = (amount: string) => {
    return `${parseFloat(amount).toLocaleString('fr-FR')} FCFA`
  }

  // Helper function to get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return {
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          icon: CheckCircle,
          text: "Approuvée"
        }
      case "pending":
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          icon: Clock,
          text: "En attente"
        }
      case "rejected":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          icon: XCircle,
          text: "Rejetée"
        }
      case "proof_submitted":
        return {
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          icon: CheckCircle,
          text: "Preuve soumise"
        }
      default:
        return {
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          icon: Clock,
          text: "Inconnu"
        }
    }
  }

  // Filter recharges based on status and search term
  const filteredRecharges = recharges.filter(recharge => {
    const matchesStatus = filterStatus === "all" || recharge.status === filterStatus
    const matchesSearch = searchTerm === "" ||
      recharge.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recharge.formatted_amount.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecharges.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecharges = filteredRecharges.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, searchTerm])

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-300 ${resolvedTheme === "dark"
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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
          }`}>
          <RefreshCw className={`w-5 h-5 ${pullToRefreshState.isRefreshing ? 'animate-spin' : ''
            } ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
        </div>
      )}
      {/* Header */}
      <div className="px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-full transition-colors duration-300 ${resolvedTheme === "dark"
                ? "hover:bg-gray-700/50 text-gray-300"
                : "hover:bg-gray-100/50 text-gray-600"
                }`}
              onClick={onNavigateBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("rechargeHistory.title")}
              </h1>
              <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("rechargeHistory.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"
              }`} />
            <input
              type="text"
              placeholder={t("rechargeHistory.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-0 transition-colors duration-300 ${resolvedTheme === "dark"
                ? "bg-gray-800/80 text-white placeholder-gray-400"
                : "bg-white/80 text-gray-900 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", "approved", "pending", "rejected", "proof_submitted"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status as any)}
                className={`whitespace-nowrap ${filterStatus === status
                  ? status === "approved" ? "bg-green-500 text-white" : status === "pending" ? "bg-yellow-500 text-white" : status === "rejected" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                  : resolvedTheme === "dark"
                    ? "border-gray-600 text-gray-300"
                    : "border-gray-300 text-gray-700"
                  }`}
              >
                {t(`rechargeHistory.filters.${status === "all" ? "all" : status === "approved" ? "approved" : status === "pending" ? "pending" : status === "rejected" ? "rejected" : "proofSubmitted"}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharges List */}
      <div className="px-4 pb-8">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${resolvedTheme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
            }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                Recharges ({filteredRecharges.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className={`h-10 w-10 p-0 rounded-full transition-colors duration-300 ${resolvedTheme === "dark"
                  ? "hover:bg-gray-700/50 text-gray-300"
                  : "hover:bg-gray-100/50 text-gray-600"
                  }`}
                onClick={handleRefreshRecharges}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <div className="text-center py-8">
                <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("rechargeHistory.loading")}
                </p>
              </div>
            ) : currentRecharges.length > 0 ? (
              currentRecharges.map((recharge, index) => {
                const statusInfo = getStatusInfo(recharge.status)
                const StatusIcon = statusInfo.icon

                return (
                  <div
                    key={recharge.uid}
                    onClick={() => {
                      setSelectedRecharge(recharge)
                      setDetailsOpen(true)
                    }}
                    className={`py-3 px-2 rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${resolvedTheme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-100/50"
                      } ${index !== currentRecharges.length - 1
                        ? resolvedTheme === "dark" ? "border-b border-gray-700/50" : "border-b border-gray-200/50"
                        : ""
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${statusInfo.bgColor}`}>
                          <Battery className={`w-5 h-5 ${statusInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-base ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {recharge.formatted_amount}
                          </p>
                          <p className={`text-xs ${resolvedTheme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                            {formatRechargeDate(recharge.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`px-2 py-0 text-[10px] uppercase font-bold border ${statusInfo.bgColor} ${statusInfo.color} border-current/20`}>
                          {statusInfo.text}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${resolvedTheme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                          Ref: <span className="font-mono">{recharge.reference}</span>
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(recharge.reference)
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {recharge.is_expired && (
                        <p className="text-[10px] text-red-500 font-bold uppercase">EXPIRÉ</p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10">
                <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("rechargeHistory.noRecharges")}
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
              className={`${resolvedTheme === "dark"
                ? "border-gray-600 text-gray-300 disabled:text-gray-600"
                : "border-gray-300 text-gray-700 disabled:text-gray-400"
                }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("rechargeHistory.previous")}
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i))
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 p-0 ${currentPage === pageNum
                      ? "bg-blue-500 text-white"
                      : resolvedTheme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"
                      }`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`${resolvedTheme === "dark"
                ? "border-gray-600 text-gray-300 disabled:text-gray-600"
                : "border-gray-300 text-gray-700 disabled:text-gray-400"
                }`}
            >
              {t("rechargeHistory.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        <TransactionDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          transaction={selectedRecharge ? { ...selectedRecharge, historyType: 'recharge' } : null}
        />
      </div>
    </div>
  )
}
