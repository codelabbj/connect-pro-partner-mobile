"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  DollarSign,
  Activity,
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { bettingService } from "@/lib/betting-api"
import { BettingTransaction, BettingTransactionsResponse } from "@/lib/betting"
import { TransactionDetailsModal } from "@/components/transaction-details-modal"

interface BettingTransactionsScreenProps {
  onNavigateBack: () => void
}

export function BettingTransactionsScreen({ onNavigateBack }: BettingTransactionsScreenProps) {
  const [transactionsData, setTransactionsData] = useState<BettingTransactionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"all" | "deposits" | "withdrawals">("all")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<BettingTransaction | null>(null)
  
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()

  // Load transactions data
  const loadTransactions = async () => {
    try {
      const params: any = {
        ordering: "-created_at"
      }
      
      if (statusFilter && statusFilter !== "all") params.status = statusFilter
      if (typeFilter && typeFilter !== "all") params.transaction_type = typeFilter
      if (platformFilter && platformFilter !== "all") params.platform = platformFilter

      const data = await bettingService.getBettingTransactions(params)
      setTransactionsData(data)
    } catch (error: any) {
      console.error('Failed to load transactions:', error)
      toast({
        title: t("betting.transactions.errorTitle"),
        description: String(error?.message || 'Failed to load betting transactions'),
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
      await loadTransactions()
      toast({
        title: t("betting.transactions.successTitle"),
        description: t("betting.transactions.refreshed"),
      })
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [statusFilter, typeFilter, platformFilter])

  // Filter transactions based on search and tab
  const getFilteredTransactions = () => {
    if (!transactionsData) return []
    
    let transactions = transactionsData.results

    // Filter by tab
    if (activeTab === "deposits") {
      transactions = transactions.filter(t => t.transaction_type === "deposit")
    } else if (activeTab === "withdrawals") {
      transactions = transactions.filter(t => t.transaction_type === "withdrawal")
    }

    // Filter by search term
    if (searchTerm) {
      transactions = transactions.filter(transaction =>
        transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.betting_user_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return transactions
  }

  // Format currency
  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString()
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return t("dashboard.transactions.time.justNow")
    if (diffInHours < 24) return t("dashboard.transactions.time.hours", { count: diffInHours })
      const diffInDays = Math.floor(diffInHours / 24)
    return t("dashboard.transactions.time.days", { count: diffInDays })
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
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return t("betting.transactions.filters.success")
      case "pending":
        return t("betting.transactions.filters.pending")
      case "failed":
        return t("betting.transactions.filters.failed")
      case "cancelled":
        return t("betting.transactions.filters.cancelled")
      default:
        return status
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  // Copy reference to clipboard
  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference)
      toast({
        title: t("betting.transactions.copy.copiedTitle"),
        description: t("betting.transactions.copy.copiedDesc", { ref: reference }),
      })
    } catch (error) {
      console.error('Failed to copy reference:', error)
      toast({
        title: t("betting.transactions.copy.errorTitle"),
        description: t("betting.transactions.copy.errorDesc"),
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">{t("betting.transactions.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-full ${
                theme === "dark" 
                  ? "text-gray-300 hover:bg-gray-700/50" 
                  : "text-gray-600 hover:bg-gray-100/50"
              }`}
              onClick={onNavigateBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("betting.transactions.title")}
              </h1>
              <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("betting.transactions.subtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 w-10 p-0 rounded-full ${
              theme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Summary Cards */}
        {transactionsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <Card className={`border-0 shadow-lg ${
              theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("betting.transactions.summary.total")}
                    </p>
                    <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {transactionsData.count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${
              theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("betting.transactions.summary.successful")}
                    </p>
                    <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {transactionsData.results.filter(t => t.status === "success").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`} />
            <Input
              placeholder={t("betting.transactions.searchPlaceholder") as string}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              }`}>
                <SelectValue placeholder={t("betting.transactions.filters.statusPlaceholder") as string} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("betting.transactions.filters.allStatus")}</SelectItem>
                <SelectItem value="success">{t("betting.transactions.filters.success")}</SelectItem>
                <SelectItem value="pending">{t("betting.transactions.filters.pending")}</SelectItem>
                <SelectItem value="failed">{t("betting.transactions.filters.failed")}</SelectItem>
                <SelectItem value="cancelled">{t("betting.transactions.filters.cancelled")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={`${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              }`}>
                <SelectValue placeholder={t("betting.transactions.filters.typePlaceholder") as string} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("betting.transactions.filters.allTypes")}</SelectItem>
                <SelectItem value="deposit">{t("betting.transactions.filters.deposit")}</SelectItem>
                <SelectItem value="withdrawal">{t("betting.transactions.filters.withdrawal")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className={`${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              }`}>
                <SelectValue placeholder={t("betting.transactions.filters.platformPlaceholder") as string} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("betting.transactions.filters.allPlatforms")}</SelectItem>
                {transactionsData?.results && Array.from(new Set(transactionsData.results.map(t => t.platform_name))).map(platform => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className={`${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          } overflow-x-auto flex gap-2 rounded-lg p-1`}>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="all">{t("betting.transactions.tabs.all")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="deposits">{t("betting.transactions.tabs.deposits")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="withdrawals">{t("betting.transactions.tabs.withdrawals")}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {getFilteredTransactions().map((transaction) => (
                <Card
                  key={transaction.uid}
                  className={`border-0 shadow-lg h-full ${
                    theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                  }`}
                  onClick={() => {
                    setSelectedTransaction(transaction)
                    setDetailsOpen(true)
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <CardContent className="p-4 sm:p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          transaction.transaction_type === "deposit"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}>
                          {transaction.transaction_type === "deposit" ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {transaction.platform_name}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {transaction.transaction_type === "deposit" ? t("betting.transactions.filters.deposit") : t("betting.transactions.filters.withdrawal")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.transaction_type === "deposit"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}>
                          {transaction.transaction_type === "deposit" ? "+" : "-"}{formatCurrency(transaction.amount)} FCFA
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(transaction.status)}
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              transaction.status === "success"
                                ? "bg-green-500/20 text-green-500"
                                : transaction.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : transaction.status === "failed"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-gray-500/20 text-gray-500"
                            }`}
                          >
                            {getStatusText(transaction.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.transactions.fields.reference")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {transaction.reference}
                          </span>
                          <button
                            onClick={() => copyReference(transaction.reference)}
                            className={`p-1 rounded transition-colors duration-200 ${
                              theme === "dark" 
                                ? "hover:bg-gray-600/50 text-gray-400 hover:text-gray-300" 
                                : "hover:bg-gray-200/50 text-gray-500 hover:text-gray-700"
                            }`}
                            title={t("common.copy") as string}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.transactions.fields.bettingUserId")}
                        </span>
                        <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {transaction.betting_user_id}
                        </span>
                      </div>

                      {transaction.withdrawal_code && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.transactions.fields.withdrawalCode")}
                          </span>
                          <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {transaction.withdrawal_code}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.transactions.fields.commission")}
                        </span>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(transaction.commission_amount)} FCFA
                          </span>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.transactions.fields.rate")}: {transaction.commission_rate}%
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {t("betting.transactions.fields.date")}
                        </span>
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {formatDate(transaction.created_at)}
                        </span>
                      </div>

                      {transaction.commission_paid && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.transactions.fields.commissionStatus")}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                            {t("betting.transactions.fields.paid")}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {getFilteredTransactions().length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2`}>
                    {t("betting.transactions.empty.title")}
                  </h3>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {(searchTerm && searchTerm.length > 0) || statusFilter !== "all" || typeFilter !== "all" || platformFilter !== "all"
                      ? t("betting.transactions.empty.filterHint")
                      : t("betting.transactions.empty.noneYet")
                    }
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Details Modal */}
      <TransactionDetailsModal
        open={detailsOpen}
        onOpenChange={(open) => setDetailsOpen(open)}
        transaction={selectedTransaction ? {
          historyType: "betting",
          reference: selectedTransaction.reference,
          amount: selectedTransaction.amount,
          status: selectedTransaction.status,
          created_at: selectedTransaction.created_at,
          betting: {
            transaction_type: selectedTransaction.transaction_type,
            betting_user_id: selectedTransaction.betting_user_id,
            withdrawal_code: selectedTransaction.withdrawal_code,
            external_transaction_id: selectedTransaction.external_transaction_id,
            commission_rate: selectedTransaction.commission_rate,
            commission_amount: selectedTransaction.commission_amount,
            commission_paid: selectedTransaction.commission_paid,
            commission_paid_at: selectedTransaction.commission_paid_at,
            partner_balance_before: selectedTransaction.partner_balance_before,
            partner_balance_after: selectedTransaction.partner_balance_after,
            cancellation_requested_at: selectedTransaction.cancellation_requested_at,
            cancelled_at: selectedTransaction.cancelled_at,
          },
        } as any : undefined}
      />
    </div>
  )
}


//                 <SelectItem value="success">Success</SelectItem>

//                 <SelectItem value="pending">Pending</SelectItem>

//                 <SelectItem value="failed">Failed</SelectItem>

//                 <SelectItem value="cancelled">Cancelled</SelectItem>

//               </SelectContent>

//             </Select>



//             <Select value={typeFilter} onValueChange={setTypeFilter}>

//               <SelectTrigger className={`${

//                 theme === "dark" 

//                   ? "bg-gray-800 border-gray-700 text-white" 

//                   : "bg-white border-gray-200 text-gray-900"

//               }`}>

//                 <SelectValue placeholder="Type" />

//               </SelectTrigger>

//               <SelectContent>

//                 <SelectItem value="all">All Types</SelectItem>

//                 <SelectItem value="deposit">Deposit</SelectItem>

//                 <SelectItem value="withdrawal">Withdrawal</SelectItem>

//               </SelectContent>

//             </Select>



//             <Select value={platformFilter} onValueChange={setPlatformFilter}>

//               <SelectTrigger className={`${

//                 theme === "dark" 

//                   ? "bg-gray-800 border-gray-700 text-white" 

//                   : "bg-white border-gray-200 text-gray-900"

//               }`}>

//                 <SelectValue placeholder="Platform" />

//               </SelectTrigger>

//               <SelectContent>

//                 <SelectItem value="all">All Platforms</SelectItem>

//                 {transactionsData?.results && Array.from(new Set(transactionsData.results.map(t => t.platform_name))).map(platform => (

//                   <SelectItem key={platform} value={platform}>{platform}</SelectItem>

//                 ))}

//               </SelectContent>

//             </Select>

//           </div>

//         </div>

//       </div>



//       {/* Tabs */}

//       <div className="px-4">

//         <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>

//           <TabsList className={`grid w-full grid-cols-3 ${

//             theme === "dark" ? "bg-gray-800" : "bg-gray-100"

//           }`}>

//             <TabsTrigger value="all">All</TabsTrigger>

//             <TabsTrigger value="deposits">Deposits</TabsTrigger>

//             <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>

//           </TabsList>



//           <TabsContent value={activeTab} className="mt-6">

//             <div className="space-y-4">

//               {getFilteredTransactions().map((transaction) => (

//                 <Card

//                   key={transaction.uid}

//                   className={`border-0 shadow-lg ${

//                     theme === "dark" ? "bg-gray-800/95" : "bg-white/95"

//                   }`}

//                 >

//                   <CardContent className="p-6">

//                     <div className="flex items-center justify-between mb-4">

//                       <div className="flex items-center gap-3">

//                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${

//                           transaction.transaction_type === "deposit"

//                             ? "bg-green-500/20 text-green-500"

//                             : "bg-red-500/20 text-red-500"

//                         }`}>

//                           {transaction.transaction_type === "deposit" ? (

//                             <TrendingUp className="w-5 h-5" />

//                           ) : (

//                             <TrendingDown className="w-5 h-5" />

//                           )}

//                         </div>

//                         <div>

//                           <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>

//                             {transaction.platform_name}

//                           </h3>

//                           <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                             {transaction.transaction_type === "deposit" ? "Deposit" : "Withdrawal"}

//                           </p>

//                         </div>

//                       </div>

//                       <div className="text-right">

//                         <p className={`text-lg font-bold ${

//                           transaction.transaction_type === "deposit"

//                             ? "text-green-500"

//                             : "text-red-500"

//                         }`}>

//                           {transaction.transaction_type === "deposit" ? "+" : "-"}{formatCurrency(transaction.amount)} FCFA

//                         </p>

//                         <div className="flex items-center gap-2 mt-1">

//                           {getStatusIcon(transaction.status)}

//                           <Badge 

//                             variant="secondary" 

//                             className={`text-xs ${

//                               transaction.status === "success"

//                                 ? "bg-green-500/20 text-green-500"

//                                 : transaction.status === "pending"

//                                 ? "bg-yellow-500/20 text-yellow-500"

//                                 : transaction.status === "failed"

//                                 ? "bg-red-500/20 text-red-500"

//                                 : "bg-gray-500/20 text-gray-500"

//                             }`}

//                           >

//                             {getStatusText(transaction.status)}

//                           </Badge>

//                         </div>

//                       </div>

//                     </div>



//                     <div className="space-y-3">

//                       <div className="flex justify-between items-center">

//                         <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                           Reference

//                         </span>

//                         <div className="flex items-center gap-2">

//                           <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>

//                             {transaction.reference}

//                           </span>

//                           <button

//                             onClick={() => copyReference(transaction.reference)}

//                             className={`p-1 rounded transition-colors duration-200 ${

//                               theme === "dark" 

//                                 ? "hover:bg-gray-600/50 text-gray-400 hover:text-gray-300" 

//                                 : "hover:bg-gray-200/50 text-gray-500 hover:text-gray-700"

//                             }`}

//                             title="Copy reference"

//                           >

//                             <Copy className="w-3 h-3" />

//                           </button>

//                         </div>

//                       </div>



//                       <div className="flex justify-between items-center">

//                         <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                           Betting User ID

//                         </span>

//                         <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>

//                           {transaction.betting_user_id}

//                         </span>

//                       </div>



//                       {transaction.withdrawal_code && (

//                         <div className="flex justify-between items-center">

//                           <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                             Withdrawal Code

//                           </span>

//                           <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>

//                             {transaction.withdrawal_code}

//                           </span>

//                         </div>

//                       )}



//                       <div className="flex justify-between items-center">

//                         <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                           Commission

//                         </span>

//                         <div className="text-right">

//                           <span className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>

//                             {formatCurrency(transaction.commission_amount)} FCFA

//                           </span>

//                           <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                             Rate: {transaction.commission_rate}%

//                           </p>

//                         </div>

//                       </div>



//                       <div className="flex justify-between items-center">

//                         <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                           Date

//                         </span>

//                         <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>

//                           {formatDate(transaction.created_at)}

//                         </span>

//                       </div>



//                       {transaction.commission_paid && (

//                         <div className="flex justify-between items-center">

//                           <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                             Commission Status

//                           </span>

//                           <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">

//                             Paid

//                           </Badge>

//                         </div>

//                       )}

//                     </div>

//                   </CardContent>

//                 </Card>

//               ))}



//               {getFilteredTransactions().length === 0 && (

//                 <div className="text-center py-8">

//                   <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />

//                   <h3 className={`text-lg font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2`}>

//                     No Transactions Found

//                   </h3>

//                   <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>

//                     {searchTerm || statusFilter || typeFilter || platformFilter

//                       ? "Try adjusting your filters to see more results"

//                       : "You haven't made any betting transactions yet"

//                     }

//                   </p>

//                 </div>

//               )}

//             </div>

//           </TabsContent>

//         </Tabs>

//       </div>

//     </div>

//   )

// }


