"use client"

import { useState, useEffect, useMemo } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { LoginScreen } from "@/components/login-screen"
import { DashboardScreen } from "@/components/dashboard-screen"
import { DepositScreen } from "@/components/deposit-screen"
import { WithdrawScreen } from "@/components/withdraw-screen"
import { RechargeScreen } from "@/components/recharge-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { TransactionHistoryScreen } from "@/components/transaction-history-screen"
import { BettingPlatformsScreen } from "@/components/betting-platforms-screen"
import { PlatformDetailScreen } from "@/components/platform-detail-screen"
import { BettingTransactionsScreen } from "@/components/betting-transactions-screen"
import { BettingCommissionsScreen } from "@/components/betting-commissions-screen"
import { BettingDepositScreen } from "@/components/betting-deposit-screen"
import { BettingWithdrawalScreen } from "@/components/betting-withdrawal-screen"
import { RechargeHistoryScreen } from "@/components/recharge-history-screen"
import { ErrorBoundary } from "@/components/error-boundary"
import { Sidebar, SidebarToggle } from "@/components/sidebar"
import { useTheme } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { registerHardwareBackHandler, unregisterHardwareBackHandler } from "@/lib/mobile-back-button"
import { PermissionDeniedScreen } from "@/components/permission-denied-screen"
import { TransferScreen } from "@/components/transfer-screen"
import { TransferHistoryScreen } from "@/components/transfer-history-screen"
import { NotificationScreen } from "@/components/notification-screen"
import { TransactionTypeSelectionScreen } from "@/components/transaction-type-selection-screen"
import { AutoRechargeScreen } from "@/components/auto-recharge-screen"
import { AutoRechargeTransactionsScreen } from "@/components/auto-recharge-transactions-screen"
import { AutoRechargeTransactionDetailScreen } from "@/components/auto-recharge-transaction-detail-screen"
import { AccountHistoryScreen } from "@/components/account-history-screen"
import { ChangePasswordScreen } from "@/components/change-password-screen"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<
    | "splash"
    | "login"
    | "dashboard"
    | "deposit"
    | "withdraw"
    | "recharge"
    | "settings"
    | "profile"
    | "change-password"
    | "transaction-history"
    | "account-history"
    | "recharge-history"
    | "transfer"
    | "transfer-history"
    | "notifications"
    | "permission-denied"
    | "transaction-type-select"
    | "betting-platforms"
    | "platform-detail"
    | "betting-transactions"
    | "betting-commissions"
    | "betting-deposit"
    | "betting-withdrawal"
    | "auto-recharge"
    | "auto-recharge-transactions"
    | "auto-recharge-transaction-detail"
  >("splash")
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])
  const [selectedPlatformUid, setSelectedPlatformUid] = useState<string>("")
  const [selectedAutoRechargeTransactionUid, setSelectedAutoRechargeTransactionUid] = useState<string>("")
  const [bettingTransactionType, setBettingTransactionType] = useState<"deposit" | "withdraw">("deposit")
  const [splashCompleted, setSplashCompleted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useTheme()
  const { isAuthenticated, isLoading, logout, user } = useAuth()

  const canProcessUssd = useMemo(() => {
    return Boolean((user as any)?.can_process_ussd_transaction)
  }, [user])
  const canUseMomo = useMemo(() => {
    return ((user as any)?.can_use_momo_pay !== false) && canProcessUssd
  }, [user, canProcessUssd])
  const canUseBetting = useMemo(() => {
    return (user as any)?.can_use_mobcash_betting !== false
  }, [user])

  const navigateTo = (screen: typeof currentScreen) => {
    setNavigationHistory((prev) => [...prev, String(currentScreen)])
    setCurrentScreen(screen)
  }

  const navigateBack = () => {
    setNavigationHistory((prev) => {
      if (prev.length === 0) {
        setCurrentScreen(isAuthenticated ? "dashboard" : "login")
        return prev
      }
      const next = [...prev]
      const last = next.pop() as string | undefined
      if (last) setCurrentScreen(last as any)
      return next
    })
  }

  const handleSplashComplete = () => {
    setSplashCompleted(true)
  }

  const handleLogin = () => {
    setCurrentScreen("dashboard")
    setNavigationHistory([])
  }

  const handleLogout = () => {
    logout()
    setCurrentScreen("login")
    setNavigationHistory([])
  }

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading && splashCompleted) {
      if (isAuthenticated) {
        setCurrentScreen("dashboard")
        setNavigationHistory([])
      } else {
        setCurrentScreen("login")
        setNavigationHistory([])
      }
    }
  }, [isAuthenticated, isLoading, splashCompleted])

  // Register hardware back handling
  useEffect(() => {
    registerHardwareBackHandler(() => {
      navigateBack()
    })
    return () => {
      unregisterHardwareBackHandler()
    }
  }, [isAuthenticated, currentScreen])

  // Show splash screen until it's completed
  if (currentScreen === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  // Show loading state while checking authentication after splash
  if (!splashCompleted || isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated && currentScreen === "login") {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}>
        {/* Sidebar */}
        {isAuthenticated && !["splash", "login"].includes(currentScreen) && (
          <Sidebar
            currentScreen={currentScreen}
            onNavigate={(screen) => navigateTo(screen as any)}
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main Content */}
        <div className={`transition-all duration-300 ${isAuthenticated && !["splash", "login"].includes(currentScreen)
            ? "lg:ml-72" // Add left margin on desktop when sidebar is present (updated to match sidebar width)
            : ""
          }`}>
          {currentScreen === "dashboard" && (
            <DashboardScreen
              onNavigateToDeposit={() => {
                setBettingTransactionType("deposit")
                // If neither option available, show permission denied
                if (!canUseMomo && !canUseBetting) {
                  navigateTo("permission-denied")
                  return
                }
                navigateTo("transaction-type-select")
              }}
              onNavigateToWithdraw={() => {
                setBettingTransactionType("withdraw")
                if (!canUseMomo && !canUseBetting) {
                  navigateTo("permission-denied")
                  return
                }
                navigateTo("transaction-type-select")
              }}
              onNavigateToSettings={() => navigateTo("settings")}
              onNavigateToNotifications={() => navigateTo("notifications")}
              onNavigateToTransactionHistory={() => navigateTo("transaction-history")}
              onNavigateToAccountHistory={() => navigateTo("account-history")}
              onNavigateToRechargeHistory={() => navigateTo("recharge-history")}
              onNavigateToTransferHistory={() => navigateTo("transfer-history")}
              onNavigateToBettingTransactions={() => navigateTo("betting-transactions")}
              onNavigateToAutoRecharge={() => navigateTo("auto-recharge")}
              onNavigateToAutoRechargeTransactions={() => navigateTo("auto-recharge-transactions")}
              onNavigateToRecharge={() => navigateTo("recharge")}
              onNavigateToTransfer={() => navigateTo("transfer")}
            />
          )}
          {currentScreen === "deposit" && (
            <DepositScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "withdraw" && (
            <WithdrawScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "recharge" && (
            <RechargeScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "transfer" && (
            <TransferScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "transfer-history" && (
            <TransferHistoryScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "notifications" && (
            <NotificationScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "permission-denied" && (
            <PermissionDeniedScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
          )}
          {currentScreen === "transaction-type-select" && (
            <TransactionTypeSelectionScreen
              transactionType={bettingTransactionType}
              onNavigateBack={navigateBack}
              onSelectMobileMoney={() => navigateTo(bettingTransactionType === "deposit" ? "deposit" : "withdraw")}
              onSelectBetting={() => navigateTo("betting-platforms")}
            />
          )}
          {currentScreen === "settings" && (
            <SettingsScreen
              onNavigateBack={navigateBack}
              onNavigateToProfile={() => setCurrentScreen("profile")}
              onNavigateToChangePassword={() => setCurrentScreen("change-password")}
              onLogout={handleLogout}
            />
          )}
          {currentScreen === "profile" && (
            <ProfileScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "change-password" && (
            <ChangePasswordScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "transaction-history" && (
            <TransactionHistoryScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "account-history" && (
            <AccountHistoryScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "recharge-history" && (
            <RechargeHistoryScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "betting-platforms" && (
            <BettingPlatformsScreen
              onNavigateBack={navigateBack}
              onNavigateToPlatformDetail={(platformUid) => {
                setSelectedPlatformUid(platformUid)
                navigateTo("platform-detail")
              }}
              onNavigateToBettingTransactions={() => navigateTo("betting-transactions")}
              onNavigateToBettingCommissions={() => navigateTo("betting-commissions")}
              intendedTransactionType={bettingTransactionType}
              onNavigateToDeposit={(platformUid) => {
                setSelectedPlatformUid(platformUid)
                navigateTo("betting-deposit")
              }}
              onNavigateToWithdraw={(platformUid) => {
                setSelectedPlatformUid(platformUid)
                navigateTo("betting-withdrawal")
              }}
            />
          )}
          {currentScreen === "platform-detail" && (
            <PlatformDetailScreen
              platformUid={selectedPlatformUid}
              onNavigateBack={navigateBack}
              onNavigateToDeposit={(platformUid) => {
                setSelectedPlatformUid(platformUid)
                navigateTo("betting-deposit")
              }}
              onNavigateToWithdraw={(platformUid) => {
                setSelectedPlatformUid(platformUid)
                navigateTo("betting-withdrawal")
              }}
            />
          )}
          {currentScreen === "betting-transactions" && (
            <BettingTransactionsScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "betting-commissions" && (
            <BettingCommissionsScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "betting-deposit" && (
            <BettingDepositScreen
              platformUid={selectedPlatformUid}
              onNavigateBack={navigateBack}
            />
          )}
          {currentScreen === "betting-withdrawal" && (
            <BettingWithdrawalScreen
              platformUid={selectedPlatformUid}
              onNavigateBack={navigateBack}
            />
          )}
          {currentScreen === "auto-recharge" && (
            <AutoRechargeScreen onNavigateBack={navigateBack} />
          )}
          {currentScreen === "auto-recharge-transactions" && (
            <AutoRechargeTransactionsScreen
              onNavigateBack={navigateBack}
              onNavigateToDetail={(transactionUid) => {
                setSelectedAutoRechargeTransactionUid(transactionUid)
                navigateTo("auto-recharge-transaction-detail")
              }}
            />
          )}
          {currentScreen === "auto-recharge-transaction-detail" && (
            <AutoRechargeTransactionDetailScreen
              transactionUid={selectedAutoRechargeTransactionUid}
              onNavigateBack={navigateBack}
            />
          )}
        </div>

        {/* Sidebar Toggle Button - Fixed Position */}
        {isAuthenticated && !["splash", "login"].includes(currentScreen) && (
          <div className="fixed top-4 left-4 z-30 lg:hidden">
            <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
