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
} from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts"
// Updated icons to match button functionality

interface DashboardScreenProps {
  onNavigateToDeposit: () => void
  onNavigateToWithdraw: () => void
}

export function DashboardScreen({ onNavigateToDeposit, onNavigateToWithdraw }: DashboardScreenProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { user, accountData, transactions, refreshTransactions } = useAuth()
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

  // Refresh transactions
  const handleRefreshTransactions = async () => {
    setIsRefreshing(true)
    try {
      await refreshTransactions()
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


  // Helper function to format transaction date
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "À l'instant"
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
    }
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
        return "text-green-500"
      case "pending":
        return "text-yellow-500"
      case "failed":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
    >
      {/* Header */}
      <div className="px-4 pt-16 pb-8 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className={`text-xl font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{t("dashboard.greeting")}</h1>
            <p className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {user ? `${user.first_name} ${user.last_name}` : t("dashboard.userName")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Settings button moved to sidebar */}
          </div>
        </div>

        {/* Balance Section */}
        <div className="relative">
          {/* Background Gradient */}
          <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
            theme === "dark" 
              ? "bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-gray-800/80" 
              : "bg-gradient-to-br from-blue-50/80 via-white/60 to-purple-50/80"
          } backdrop-blur-xl`}></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className={`w-full h-full rounded-full blur-3xl ${
              theme === "dark" ? "bg-blue-500/30" : "bg-blue-400/20"
            }`}></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-15">
            <div className={`w-full h-full rounded-full blur-2xl ${
              theme === "dark" ? "bg-purple-500/30" : "bg-purple-400/20"
            }`}></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-semibold tracking-wide uppercase ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                {t("dashboard.totalBalance")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className={`h-10 w-10 p-0 rounded-2xl transition-all duration-300 ${
                  theme === "dark" 
                    ? "hover:bg-gray-700/50 text-gray-300 hover:text-white" 
                    : "hover:bg-gray-100/50 text-gray-600 hover:text-gray-900"
                } hover:scale-110`}
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            </div>
            
            <div className="mb-6">
              <p className={`text-4xl font-black tracking-tight mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {showBalance ? (accountData?.formatted_balance || "••••••") : "••••••"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-500 font-bold">
                    {accountData ? `${accountData.utilization_rate.toFixed(1)}% utilization` : t("dashboard.growth")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Deposit Button */}
          <Button
            onClick={onNavigateToDeposit}
            className={`group relative h-32 flex-col gap-4 border-0 overflow-hidden transition-all duration-500 ease-out ${
              theme === "dark" 
                ? "bg-transparent hover:bg-blue-500/10 text-white" 
                : "bg-transparent hover:bg-blue-500/10 text-gray-900"
            } hover:scale-[1.03] active:scale-[0.97]`}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>
            
            {/* Floating Particles Effect */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100"></div>
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-blue-300/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200"></div>
            
            {/* Icon */}
            
             <TrendingUp className="relative z-10 text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ width: '32px', height: '32px' }} />
            
            {/* Text */}
            <span className="relative z-10 text-base font-bold tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-500">
              {t("dashboard.actions.deposit")}
            </span>
            
            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-2xl border border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Button>

          {/* Withdraw Button */}
          <Button
            onClick={onNavigateToWithdraw}
            className={`group relative h-32 flex-col gap-4 border-0 overflow-hidden transition-all duration-500 ease-out ${
              theme === "dark" 
                ? "bg-transparent hover:bg-green-500/10 text-white" 
                : "bg-transparent hover:bg-green-500/10 text-gray-900"
            } hover:scale-[1.03] active:scale-[0.97]`}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>
            
            {/* Floating Particles Effect */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-400/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100"></div>
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-green-300/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200"></div>
            
            {/* Icon */}
            <TrendingDown className="relative z-10 text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3" style={{ width: '32px', height: '32px' }} />
            
            {/* Text */}
            <span className="relative z-10 text-base font-bold tracking-wide group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors duration-500">
              {t("dashboard.actions.withdraw")}
            </span>
            
            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-2xl border border-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 pb-8">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("dashboard.recentTransactions")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors duration-300 ${
                    theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600"
                  }`}
                  onClick={handleRefreshTransactions}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction, index) => (
              <div
                  key={transaction.uid}
                className={`flex items-center justify-between py-4 px-2 rounded-xl transition-colors duration-300 ${
                  theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-100/30"
                } ${
                  index !== transactions.length - 1
                    ? theme === "dark"
                      ? "border-b border-gray-700/50"
                      : "border-b border-gray-200/50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                        transaction.type === "deposit"
                        ? "bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-500"
                        : theme === "dark"
                          ? "bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300"
                          : "bg-gradient-to-br from-gray-200 to-gray-100 text-gray-600"
                    }`}
                  >
                      {transaction.type === "deposit" ? (
                        <TrendingUp className="w-5 h-5" />
                    ) : (
                        <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {transaction.display_recipient_name || transaction.recipient_phone }
                    </p>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {formatTransactionDate(transaction.created_at)}
                      </p>
                      <div className="flex items-center">
                        <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                          {transaction.status_display} • {transaction.reference}
                        </p>
                        <button
                          onClick={() => copyReference(transaction.reference)}
                          className={`p-1 rounded transition-colors duration-200 ${
                            theme === "dark" 
                              ? "hover:bg-gray-600/50 text-gray-400 hover:text-gray-300" 
                              : "hover:bg-gray-200/50 text-gray-500 hover:text-gray-700"
                          }`}
                          title={t("common.copy")}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                        transaction.type === "deposit"
                        ? "text-green-500"
                        : theme === "dark"
                          ? "text-white"
                          : "text-gray-900"
                    }`}
                  >
                      {formatTransactionAmount(transaction.amount, transaction.type)}
                    </p>
                    <div className={`w-2 h-2 rounded-full ml-auto mt-2 ${
                      transaction.status === "success" || transaction.status === "sent_to_user"
                        ? "bg-green-500"
                        : transaction.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("dashboard.noTransactions")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
