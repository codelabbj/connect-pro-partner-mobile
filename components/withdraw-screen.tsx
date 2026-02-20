"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2, CreditCard, Smartphone, AlertCircle, RefreshCw } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { formatAmount } from "@/lib/utils"
import { TransactionConfirmationModal } from "@/components/ui/transaction-confirmation-modal"

interface WithdrawScreenProps {
  onNavigateBack: () => void
}

export function WithdrawScreen({ onNavigateBack }: WithdrawScreenProps) {
  const [amount, setAmount] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Pull-to-refresh state (visual only)
  const [pullToRefreshState, setPullToRefreshState] = useState({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    startY: 0,
    currentY: 0,
    canPull: true,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { theme, resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const { networks, createTransaction, accountData } = useAuth()

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

  // Pull-to-refresh handler (visual only, placeholder)
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Pull-to-refresh error:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
    }
  }

  // Pull-to-refresh: Touch handlers
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

  const handleWithdraw = () => {
    if (!amount || !recipientPhone || !selectedNetwork) {
      setError("Please fill in all fields")
      return
    }
    
    setError("")
    setShowConfirmation(true)
  }

  const handleConfirmWithdraw = async () => {
    setIsProcessing(true)
    
    try {
      await createTransaction({
        type: "withdrawal",
        amount: parseFloat(amount),
        recipient_phone: recipientPhone,
        network: selectedNetwork
      })
      
      setSuccess(true)
      setShowConfirmation(false)
      setTimeout(() => {
        onNavigateBack()
      }, 2000)
    } catch (error) {
      console.error('Withdrawal error:', error)
      
      // Parse backend validation errors
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message)
          if (typeof errorData === 'object' && errorData !== null) {
            // Handle field-specific errors
            const errorMessages: string[] = []
            Object.keys(errorData).forEach(field => {
              if (Array.isArray(errorData[field])) {
                errorMessages.push(...(errorData[field] as string[]))
              } else {
                errorMessages.push(String(errorData[field]))
              }
            })
            setError(errorMessages.join(', '))
          } else {
            setError(error.message)
          }
        } catch (parseError) {
          setError(error.message)
        }
      } else {
        setError("Failed to create withdrawal")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter networks that support withdrawals
  // const availableNetworks = networks.filter(network => network.sent_withdrawal_to_module && network.is_active)
  const availableNetworks = networks.filter(network =>  network.is_active)

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-300 ${
        resolvedTheme === "dark"
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
          resolvedTheme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
        }`}>
          <RefreshCw className={`w-5 h-5 ${
            pullToRefreshState.isRefreshing ? 'animate-spin' : ''
          } ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
        </div>
      )}
      {/* Header */}
      <div className="px-4 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 rounded-full ${
              resolvedTheme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={onNavigateBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={`text-3xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
              {t("withdraw.title")}
            </h1>
            <p className={`text-base ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {t("withdraw.subtitle")}
            </p>
          </div>
        </div>

        {/* Withdraw Form */}
        <div className="space-y-6">
            {/* Balance Info */}
            <div className={`p-4 rounded-xl ${
              resolvedTheme === "dark" ? "bg-gray-700/30" : "bg-gray-100/50"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  {t("withdraw.availableBalance")}
                </span>
                <span className={`text-lg font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {accountData?.formatted_balance || "Loading..."}
                </span>
              </div>
            </div>

            {/* Recipient Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("withdraw.recipientPhone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t("withdraw.phonePlaceholder")}
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value.replace(/\s/g, ''))}
                className={`h-12 text-lg font-semibold ${
                  resolvedTheme === "dark" 
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" 
                    : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                }`}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("withdraw.quickAmount")}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {["1000", "5000", "10000"].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount)}
                    className={`h-10 ${
                      resolvedTheme === "dark" 
                        ? "border-gray-600 hover:bg-gray-700/50 text-gray-300" 
                        : "border-gray-200 hover:bg-gray-100/50 text-gray-600"
                    }`}
                  >
                    {formatAmount(quickAmount)} FCFA
                  </Button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("withdraw.amount")}
              </Label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-bold ${
                  resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                  FCFA
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder={t("withdraw.amountPlaceholder")}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`pl-12 h-12 text-lg font-semibold ${
                    resolvedTheme === "dark" 
                      ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" 
                      : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Network Selection */}
            <div className="space-y-3">
              <Label className={`text-sm font-medium ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("withdraw.selectNetwork")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {availableNetworks.map((network) => (
                  <button
                    key={network.uid}
                    onClick={() => setSelectedNetwork(network.uid)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedNetwork === network.uid
                        ? resolvedTheme === "dark"
                          ? "border-green-500 bg-green-500/10"
                          : "border-green-500 bg-green-50"
                        : resolvedTheme === "dark"
                          ? "border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50"
                          : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-100/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm overflow-hidden">
                        {network.image ? (
                          <img
                            src={network.image}
                            alt={network.nom}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <Smartphone
                            className={`w-6 h-6 ${
                              selectedNetwork === network.uid
                                ? "text-green-500"
                                : resolvedTheme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-600"
                            }`}
                          />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold text-sm ${
                          resolvedTheme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {network.nom}
                        </p>
                        <p className={`text-xs ${
                          resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {network.code}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                resolvedTheme === "dark" ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
              }`}>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                resolvedTheme === "dark" ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"
              }`}>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">{t("withdraw.successMessage")}</span>
              </div>
            )}

            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              disabled={!amount || !recipientPhone || !selectedNetwork || isProcessing}
              className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
                !amount || !recipientPhone || !selectedNetwork || isProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t("withdraw.processing")}
                </div>
              ) : (
                t("withdraw.confirmWithdraw")
              )}
            </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmWithdraw}
        transactionData={{
          type: "withdrawal",
          amount: amount,
          recipientPhone: recipientPhone,
          selectedNetwork: availableNetworks.find(network => network.uid === selectedNetwork)
        }}
        isProcessing={isProcessing}
      />
    </div>
  )
}
