"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Smartphone,
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { formatAmount } from "@/lib/utils"
import { autoRechargeService, AutoRechargeNetwork } from "@/lib/auto-recharge"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { PaymentLinkModal } from "@/components/payment-link-modal"
import { UssdModal } from "@/components/ussd-modal"
import { authService } from "@/lib/auth"

interface AutoRechargeScreenProps {
  onNavigateBack: () => void
}

export function AutoRechargeScreen({ onNavigateBack }: AutoRechargeScreenProps) {
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState<AutoRechargeNetwork | null>(null)
  const [networks, setNetworks] = useState<AutoRechargeNetwork[]>([])
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false)
  const [showUssdModal, setShowUssdModal] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string>("")
  const [ussdCode, setUssdCode] = useState<string>("")
  
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
  const { accountData, refreshAccountData, refreshTransactions } = useAuth()

  // Pull-to-refresh constants
  const refreshThreshold = 80
  const maxPullDistance = 120
  const pullingThreshold = 10

  // Load available networks
  const loadNetworks = async () => {
    const accessToken = authService.getAccessToken()
    if (!accessToken) return
    
    setIsLoadingNetworks(true)
    try {
      const data = await autoRechargeService.getAvailableNetworks(accessToken)
      setNetworks(data.networks || [])
    } catch (error: any) {
      console.error('Failed to load networks:', error)
      setError(error?.message || t("autoRecharge.errors.failedToLoad"))
    } finally {
      setIsLoadingNetworks(false)
    }
  }

  // Pull-to-refresh handler
  const handlePullToRefresh = async () => {
    setPullToRefreshState(prev => ({ ...prev, isRefreshing: true }))
    try {
      await loadNetworks()
    } catch (error) {
      console.error('Pull-to-refresh error:', error)
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0 }))
    }
  }

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

  useEffect(() => {
    loadNetworks()
  }, [])

  const handleInitiate = () => {
    setError("")
    
    if (!selectedNetwork) {
      setError(t("autoRecharge.errors.selectNetwork"))
      return
    }
    
    if (!amount) {
      setError(t("autoRecharge.errors.enterAmount"))
      return
    }
    
    const amountNum = parseFloat(amount)
    const minAmount = parseFloat(selectedNetwork.min_amount)
    const maxAmount = parseFloat(selectedNetwork.max_amount)
    
    if (isNaN(amountNum) || amountNum < minAmount) {
      setError(t("autoRecharge.errors.minAmount", { amount: formatAmount(minAmount.toString()) }))
      return
    }
    
    if (amountNum > maxAmount) {
      setError(t("autoRecharge.errors.maxAmount", { amount: formatAmount(maxAmount.toString()) }))
      return
    }
    
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setError(t("autoRecharge.errors.enterPhone"))
      return
    }
    
    setShowConfirmation(true)
  }

  const handleConfirmInitiate = async () => {
    const accessToken = authService.getAccessToken()
    if (!accessToken || !selectedNetwork) return

    setIsProcessing(true)

    try {
      const response = await autoRechargeService.initiateAutoRecharge(accessToken, {
        network: selectedNetwork.network.uid,
        amount: parseFloat(amount),
        phone_number: phoneNumber.trim(),
      })

      // Refresh dashboard data after successful transaction
      await Promise.all([
        refreshAccountData(),
        refreshTransactions(),
      ])

      // Check if payment link exists (only check transaction level)
      const transactionPaymentLink = response.transaction.payment_link

      if (transactionPaymentLink && transactionPaymentLink.trim() !== "") {
        setPaymentLink(transactionPaymentLink)
        setShowPaymentLinkModal(true)
      } else {
        // Check if USSD code exists (only check transaction level)
        const transactionUssdCode = response.transaction.payment_ussd

        if (transactionUssdCode && transactionUssdCode.trim() !== "") {
          setUssdCode(transactionUssdCode)
          setShowUssdModal(true)
        } else {
          setSuccess(true)
          setTimeout(() => {
            onNavigateBack()
          }, 2000)
        }
      }

      setShowConfirmation(false)
    } catch (error: any) {
      console.error('Auto-recharge error:', error)
      
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message)
          if (typeof errorData === 'object' && errorData !== null) {
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
        setError(t("autoRecharge.errors.failedToInitiate"))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate fee
  const calculateFee = () => {
    if (!selectedNetwork || !amount) return "0"
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) return "0"
    const fixedFee = parseFloat(selectedNetwork.fixed_fee)
    const percentageFee = parseFloat(selectedNetwork.percentage_fee)
    const fee = fixedFee + (amountNum * percentageFee / 100)
    return fee.toFixed(2)
  }

  // Handle payment link modal continue
  const handlePaymentLinkContinue = () => {
    setShowPaymentLinkModal(false)
    setSuccess(true)
    setTimeout(() => {
      onNavigateBack()
    }, 2000)
  }

  // Handle USSD modal continue
  const handleUssdContinue = () => {
    setShowUssdModal(false)
    setSuccess(true)
    setTimeout(() => {
      onNavigateBack()
    }, 2000)
  }

  // Calculate total
  const calculateTotal = () => {
    if (!amount) return "0"
    const amountNum = parseFloat(amount)
    const fee = parseFloat(calculateFee())
    if (isNaN(amountNum)) return "0"
    return (amountNum + fee).toFixed(2)
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
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {t("autoRecharge.title")}
            </h1>
            <p className={`text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {t("autoRecharge.subtitle")}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Balance Info */}
          <div className={`p-4 rounded-xl ${
            theme === "dark" ? "bg-gray-700/30" : "bg-gray-100/50"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("autoRecharge.availableBalance")}
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {accountData?.formatted_balance || t("common.loading")}
              </span>
            </div>
          </div>

          {/* Network Selection */}
          <div className="space-y-2">
            <Label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("autoRecharge.selectNetwork")}
            </Label>
            {isLoadingNetworks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : networks.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.network.uid}
                    onClick={() => setSelectedNetwork(network)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedNetwork?.network.uid === network.network.uid
                        ? theme === "dark"
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-blue-500 bg-blue-50"
                        : theme === "dark"
                          ? "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                          : "border-gray-200 hover:border-gray-300 bg-white/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {network.network.image ? (
                        <img 
                          src={network.network.image} 
                          alt={network.network.nom}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                        }`}>
                          <Smartphone className="w-6 h-6" />
                        </div>
                      )}
                      <span className={`text-sm font-medium text-center ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {network.network.nom}
                      </span>
                      <span className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {network.network.country_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-xl text-center ${
                theme === "dark" ? "bg-gray-700/30" : "bg-gray-100/50"
              }`}>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("autoRecharge.noNetworksAvailable")}
                </p>
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("autoRecharge.phoneNumber")}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0708958408"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`h-12 text-lg font-semibold ${
                theme === "dark" 
                  ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" 
                  : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-500"
              }`}
            />
          </div>

          {/* Quick Amount Buttons */}
          {selectedNetwork && (
            <div className="space-y-2">
              <Label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("autoRecharge.quickAmount")}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {["1000", "5000", "10000"].map((quickAmount) => {
                  const quickAmountNum = parseFloat(quickAmount)
                  const minAmount = parseFloat(selectedNetwork.min_amount)
                  const maxAmount = parseFloat(selectedNetwork.max_amount)
                  const isDisabled = quickAmountNum < minAmount || quickAmountNum > maxAmount
                  
                  return (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount)}
                      disabled={isDisabled}
                      className={`h-10 ${
                        theme === "dark" 
                          ? "border-gray-600 hover:bg-gray-700/50 text-gray-300 disabled:opacity-50" 
                          : "border-gray-200 hover:bg-gray-100/50 text-gray-600 disabled:opacity-50"
                      }`}
                    >
                      {formatAmount(quickAmount)} FCFA
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("autoRecharge.amount")}
            </Label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-bold ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                FCFA
              </span>
              <Input
                id="amount"
                type="number"
                placeholder={t("autoRecharge.amountPlaceholder")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-12 h-12 text-lg font-semibold ${
                  theme === "dark" 
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" 
                    : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                }`}
              />
            </div>
            {selectedNetwork && (
              <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("autoRecharge.minMax", { min: formatAmount(selectedNetwork.min_amount), max: formatAmount(selectedNetwork.max_amount) })}
              </p>
            )}
          </div>

          {/* Fee and Total */}
          {selectedNetwork && amount && (
            <div className={`p-4 rounded-xl space-y-2 ${
              theme === "dark" ? "bg-gray-700/30" : "bg-gray-100/50"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Amount
                </span>
                <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {formatAmount(amount)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  {t("autoRecharge.fee", { percentage: selectedNetwork.percentage_fee, fixed: formatAmount(selectedNetwork.fixed_fee) })}
                </span>
                <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {formatAmount(calculateFee())} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  {t("autoRecharge.total")}
                </span>
                <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {formatAmount(calculateTotal())} FCFA
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              theme === "dark" ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
            }`}>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              theme === "dark" ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"
            }`}>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 dark:text-green-400">{t("autoRecharge.successMessage")}</span>
            </div>
          )}

          {/* Initiate Button */}
          <Button
            onClick={handleInitiate}
            disabled={!selectedNetwork || !amount || !phoneNumber || isProcessing}
            className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
              !selectedNetwork || !amount || !phoneNumber || isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t("autoRecharge.processing")}
              </div>
            ) : (
              t("autoRecharge.initiateButton")
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmInitiate}
        data={{
          type: "auto-recharge",
          amount: amount,
          phoneNumber: phoneNumber,
          network: selectedNetwork?.network.nom || "",
          fee: calculateFee(),
          total: calculateTotal(),
        }}
        isProcessing={isProcessing}
      />

      {/* Payment Link Modal */}
      <PaymentLinkModal
        open={showPaymentLinkModal}
        onOpenChange={setShowPaymentLinkModal}
        paymentLink={paymentLink}
        onContinue={handlePaymentLinkContinue}
      />

      {/* USSD Modal */}
      <UssdModal
        open={showUssdModal}
        onOpenChange={setShowUssdModal}
        ussdCode={ussdCode}
        onContinue={handleUssdContinue}
      />
    </div>
  )
}

