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
import { useState, useEffect } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { rechargeService, RechargeData, RechargesResponse } from "@/lib/recharge"

interface RechargeHistoryScreenProps {
  onNavigateBack: () => void
}

export function RechargeHistoryScreen({ onNavigateBack }: RechargeHistoryScreenProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "rejected" | "proof_submitted">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { user, recharges, isLoading, refreshRecharges } = useAuth()

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

  // Refresh recharges
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

  // Use recharges from context instead of separate API calls
  useEffect(() => {
    console.log('Recharge History - User:', user)
    console.log('Recharge History - Recharges from context:', recharges)
    console.log('Recharge History - Total recharges:', recharges.length)
  }, [user, recharges])

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
    return `${parseFloat(amount).toLocaleString('fr-FR')} €`
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
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
    >
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
                {t("rechargeHistory.title")}
              </h1>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("rechargeHistory.subtitle")}
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
            onClick={handleRefreshRecharges}
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
              placeholder={t("rechargeHistory.searchPlaceholder")}
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
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
              className={`whitespace-nowrap ${
                filterStatus === "all" 
                  ? "bg-blue-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("rechargeHistory.filters.all")}
            </Button>
            <Button
              variant={filterStatus === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("approved")}
              className={`whitespace-nowrap ${
                filterStatus === "approved" 
                  ? "bg-green-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("rechargeHistory.filters.approved")}
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
              className={`whitespace-nowrap ${
                filterStatus === "pending" 
                  ? "bg-yellow-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("rechargeHistory.filters.pending")}
            </Button>
            <Button
              variant={filterStatus === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("rejected")}
              className={`whitespace-nowrap ${
                filterStatus === "rejected" 
                  ? "bg-red-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("rechargeHistory.filters.rejected")}
            </Button>
            <Button
              variant={filterStatus === "proof_submitted" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("proof_submitted")}
              className={`whitespace-nowrap ${
                filterStatus === "proof_submitted" 
                  ? "bg-blue-500 text-white" 
                  : theme === "dark" 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {t("rechargeHistory.filters.proofSubmitted")}
            </Button>
          </div>
        </div>
      </div>

      {/* Recharges List */}
      <div className="px-4 pb-8">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Recharges ({filteredRecharges.length})
              </CardTitle>
              <div className="flex gap-2">
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors duration-300 ${
                    theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600"
                  }`}
                  onClick={refreshRecharges}
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
                  onClick={handleRefreshRecharges}
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
                  className={`py-3 px-2 rounded-lg transition-colors duration-300 ${
                    theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-100/30"
                  } ${
                    index !== currentRecharges.length - 1
                      ? theme === "dark"
                        ? "border-b border-gray-700/50"
                        : "border-b border-gray-200/50"
                      : ""
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${statusInfo.bgColor}`}>
                        <Battery className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {recharge.formatted_amount}
                        </p>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {formatRechargeDate(recharge.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {recharge.formatted_amount}
                      </p>
                    </div>
                  </div>
                  
                  {/* Details Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                          <span className="font-medium">{t("rechargeHistory.reference")}:</span> {recharge.reference}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700`}
                          onClick={() => copyToClipboard(recharge.reference)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {recharge.is_expired && (
                        <p className="text-xs text-red-500">
                          <span className="font-medium">{t("rechargeHistory.status")}:</span> {t("rechargeHistory.expired")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                      <p className={`text-xs ${statusInfo.color}`}>
                        {statusInfo.text}
                      </p>
                    </div>
                  </div>
                </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
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
              className={`${
                theme === "dark" 
                  ? "border-gray-600 text-gray-300 disabled:text-gray-600" 
                  : "border-gray-300 text-gray-700 disabled:text-gray-400"
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("rechargeHistory.previous")}
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
              {t("rechargeHistory.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
