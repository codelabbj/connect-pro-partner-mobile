"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Activity,
  CreditCard,
  History,
  Settings,
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { bettingService } from "@/lib/betting-api"
import {
  BettingCommissionStats,
  UnpaidCommissionsResponse,
  CommissionRates,
  PaymentHistoryResponse
} from "@/lib/betting"

interface BettingCommissionsScreenProps {
  onNavigateBack: () => void
}

export function BettingCommissionsScreen({ onNavigateBack }: BettingCommissionsScreenProps) {
  const [commissionStats, setCommissionStats] = useState<BettingCommissionStats | null>(null)
  const [unpaidCommissions, setUnpaidCommissions] = useState<UnpaidCommissionsResponse | null>(null)
  const [commissionRates, setCommissionRates] = useState<CommissionRates | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "unpaid" | "rates" | "history">("overview")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { theme, resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()

  // Load all commission data
  const loadCommissionData = async () => {
    try {
      const [stats, unpaid, rates, history] = await Promise.all([
        bettingService.getCommissionStats({ date_from: startDate || undefined, date_to: endDate || undefined }),
        bettingService.getUnpaidCommissions(),
        bettingService.getCurrentRates(),
        bettingService.getPaymentHistory()
      ])

      setCommissionStats(stats)
      setUnpaidCommissions(unpaid)
      setCommissionRates(rates)
      setPaymentHistory(history)
    } catch (error) {
      console.error('Failed to load commission data:', error)
      toast({
        title: t("betting.commissions.errorTitle"),
        description: t("betting.commissions.loading"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadCommissionData()
      toast({
        title: t("betting.commissions.successTitle"),
        description: t("betting.commissions.refreshed"),
      })
    } catch (error) {
      console.error('Failed to refresh commission data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCommissionData()
  }, [startDate, endDate])

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return parseFloat(amount.toString()).toLocaleString()
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Success"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">{t("betting.commissions.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-full ${resolvedTheme === "dark"
                  ? "text-gray-300 hover:bg-gray-700/50"
                  : "text-gray-600 hover:bg-gray-100/50"
                }`}
              onClick={onNavigateBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("betting.commissions.title")}
              </h1>
              <p className={`text-xs sm:text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("betting.commissions.subtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 w-10 p-0 rounded-full ${resolvedTheme === "dark"
                ? "text-gray-300 hover:bg-gray-700/50"
                : "text-gray-600 hover:bg-gray-100/50"
              }`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Date Filters */}
        <div className="flex gap-3 mb-6">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`flex-1 ${resolvedTheme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`flex-1 ${resolvedTheme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}
          />
        </div>

        {/* Summary Cards */}
        {commissionStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className={`border-0 shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
              }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("betting.commissions.summary.totalCommission")}
                    </p>
                    <p className={`text-xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(commissionStats.total_commission)} FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
              }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("betting.commissions.summary.unpaidCommission")}
                    </p>
                    <p className={`text-xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(commissionStats.unpaid_commission)} FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className={`${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-100"
            } overflow-x-auto flex gap-2 rounded-lg p-1`}>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="overview">{t("betting.commissions.tabs.overview")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="unpaid">{t("betting.commissions.tabs.unpaid")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="rates">{t("betting.commissions.tabs.rates")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="history">{t("betting.commissions.tabs.history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-4">
              {/* Commission Summary */}
              {commissionStats && (
                <Card className={`border-0 shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                  }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-lg flex items-center gap-2 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      {t("betting.commissions.summary.heading")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {commissionStats.total_transactions}
                        </p>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.summary.totalTransactions")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold text-green-500`}>
                          {formatCurrency(commissionStats.paid_commission)} FCFA
                        </p>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.summary.paidCommission")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold text-yellow-500`}>
                          {formatCurrency(commissionStats.unpaid_commission)} FCFA
                        </p>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.summary.unpaidCommission")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commission by Platform */}
              {commissionStats && commissionStats.by_platform.length > 0 && (
                <Card className={`border-0 shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                  }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-lg flex items-center gap-2 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                      <Activity className="w-5 h-5 text-purple-500" />
                      {t("betting.commissions.summary.byPlatform")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {commissionStats.by_platform.map((platform, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-100/50 dark:bg-gray-700/50">
                        <div>
                          <p className={`font-medium ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {platform.platform__name}
                          </p>
                          <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.summary.platformTransactions", { count: platform.count })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(platform.total_commission)} FCFA
                          </p>
                          <p className={`text-sm text-yellow-500`}>
                            {t("betting.commissions.summary.unpaidLabel", { amount: formatCurrency(platform.unpaid_commission) })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unpaid" className="mt-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {unpaidCommissions && Array.isArray(unpaidCommissions.transactions) && unpaidCommissions.transactions.length > 0 ? (
                unpaidCommissions.transactions.map((transaction) => (
                  <Card
                    key={transaction.uid}
                    className={`border-0 shadow-lg h-full ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                      }`}
                  >
                    <CardContent className="p-4 sm:p-6 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div>
                            <h3 className={`font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {transaction.platform_name}
                            </h3>
                            <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {transaction.transaction_type === "deposit" ? t("betting.commissions.unpaid.deposit") : t("betting.commissions.unpaid.withdrawal")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold text-yellow-500`}>
                            {formatCurrency(transaction.commission_amount)} FCFA
                          </p>
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500">
                            {t("betting.commissions.unpaid.unpaidBadge")}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.unpaid.fields.reference")}
                          </span>
                          <span className={`font-mono text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {transaction.reference}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.unpaid.fields.amount")}
                          </span>
                          <span className={`font-medium ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(transaction.amount)} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.unpaid.fields.date")}
                          </span>
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 col-span-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2`}>
                    {t("betting.commissions.unpaid.emptyTitle")}
                  </h3>
                  <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("betting.commissions.unpaid.emptyDesc")}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rates" className="mt-6">
            <div className="space-y-4">
              {commissionRates && (
                <Card className={`border-0 shadow-lg ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                  }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-lg flex items-center gap-2 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                      <Settings className="w-5 h-5 text-blue-500" />
                      {t("betting.commissions.rates.heading")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-green-500/10">
                        <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className={`text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {commissionRates.deposit_rate}%
                        </p>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.rates.depositRate")}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-500/10">
                        <TrendingDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className={`text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {commissionRates.withdrawal_rate}%
                        </p>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.rates.withdrawalRate")}
                        </p>
                      </div>
                    </div>

                    {commissionRates.message && (
                      <div className={`p-4 rounded-lg ${resolvedTheme === "dark" ? "bg-blue-500/10" : "bg-blue-50"
                        }`}>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                          {commissionRates.message}
                        </p>
                      </div>
                    )}

                    {commissionRates.last_updated && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.rates.lastUpdated")}
                        </span>
                        <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {formatDate(commissionRates.last_updated)}
                        </span>
                      </div>
                    )}

                    {commissionRates.updated_by && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.commissions.rates.updatedBy")}
                        </span>
                        <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {commissionRates.updated_by}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {paymentHistory && Array.isArray(paymentHistory.payments) && paymentHistory.payments.length > 0 ? (
                paymentHistory.payments.map((payment) => (
                  <Card
                    key={payment.uid}
                    className={`border-0 shadow-lg h-full ${resolvedTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                      }`}
                  >
                    <CardContent className="p-4 sm:p-6 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className={`font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {t("betting.commissions.history.paymentHeading")}
                            </h3>
                            <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {t("betting.commissions.history.transactionsCount", { count: payment.transaction_count })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold text-green-500`}>
                            {formatCurrency(payment.total_amount)} FCFA
                          </p>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                            {t("betting.commissions.history.paidBadge")}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.history.fields.paidBy")}
                          </span>
                          <span className={`font-medium ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {payment.paid_by_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.history.fields.period")}
                          </span>
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.commissions.history.fields.paymentDate")}
                          </span>
                          <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {formatDate(payment.created_at)}
                          </span>
                        </div>
                        {payment.notes && (
                          <div className="mt-3 p-3 rounded-lg bg-gray-100/50 dark:bg-gray-700/50">
                            <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 col-span-2">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2`}>
                    {t("betting.commissions.history.emptyTitle")}
                  </h3>
                  <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {t("betting.commissions.history.emptyDesc")}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
