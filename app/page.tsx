"use client"

import { useState, useEffect } from "react"
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

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<"splash" | "login" | "dashboard" | "deposit" | "withdraw" | "recharge" | "settings" | "profile" | "transaction-history" | "recharge-history" | "betting-platforms" | "platform-detail" | "betting-transactions" | "betting-commissions" | "betting-deposit" | "betting-withdrawal">("splash")
  const [selectedPlatformUid, setSelectedPlatformUid] = useState<string>("")
  const [splashCompleted, setSplashCompleted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useTheme()
  const { isAuthenticated, isLoading, logout } = useAuth()

  const handleSplashComplete = () => {
    setSplashCompleted(true)
  }

  const handleLogin = () => {
    setCurrentScreen("dashboard")
  }

  const handleLogout = () => {
    logout()
    setCurrentScreen("login")
  }

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading && splashCompleted) {
      if (isAuthenticated) {
        setCurrentScreen("dashboard")
      } else {
        setCurrentScreen("login")
      }
    }
  }, [isAuthenticated, isLoading, splashCompleted])

  // Show splash screen until it's completed
  if (currentScreen === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  // Show loading state while checking authentication after splash
  if (!splashCompleted || isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
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
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        {/* Sidebar */}
        {isAuthenticated && !["splash", "login"].includes(currentScreen) && (
          <Sidebar
            currentScreen={currentScreen}
            onNavigate={(screen) => setCurrentScreen(screen as any)}
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {/* Main Content */}
        <div className={`transition-all duration-300 ${
          isAuthenticated && !["splash", "login"].includes(currentScreen)
            ? "lg:ml-72" // Add left margin on desktop when sidebar is present (updated to match sidebar width)
            : ""
        }`}>
        {currentScreen === "dashboard" && (
          <DashboardScreen 
            onNavigateToDeposit={() => setCurrentScreen("deposit")}
            onNavigateToWithdraw={() => setCurrentScreen("withdraw")}
          />
        )}
        {currentScreen === "deposit" && (
          <DepositScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "withdraw" && (
          <WithdrawScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "recharge" && (
          <RechargeScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "settings" && (
          <SettingsScreen 
            onNavigateBack={() => setCurrentScreen("dashboard")} 
            onNavigateToProfile={() => setCurrentScreen("profile")}
            onLogout={handleLogout} 
          />
        )}
        {currentScreen === "profile" && (
          <ProfileScreen onNavigateBack={() => setCurrentScreen("settings")} />
        )}
        {currentScreen === "transaction-history" && (
          <TransactionHistoryScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "recharge-history" && (
          <RechargeHistoryScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "betting-platforms" && (
          <BettingPlatformsScreen 
            onNavigateBack={() => setCurrentScreen("dashboard")}
            onNavigateToPlatformDetail={(platformUid) => {
              setSelectedPlatformUid(platformUid)
              setCurrentScreen("platform-detail")
            }}
            onNavigateToBettingTransactions={() => setCurrentScreen("betting-transactions")}
            onNavigateToBettingCommissions={() => setCurrentScreen("betting-commissions")}
          />
        )}
        {currentScreen === "platform-detail" && (
          <PlatformDetailScreen 
            platformUid={selectedPlatformUid}
            onNavigateBack={() => setCurrentScreen("betting-platforms")}
            onNavigateToDeposit={(platformUid) => {
              setSelectedPlatformUid(platformUid)
              setCurrentScreen("betting-deposit")
            }}
            onNavigateToWithdraw={(platformUid) => {
              setSelectedPlatformUid(platformUid)
              setCurrentScreen("betting-withdrawal")
            }}
          />
        )}
        {currentScreen === "betting-transactions" && (
          <BettingTransactionsScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "betting-commissions" && (
          <BettingCommissionsScreen onNavigateBack={() => setCurrentScreen("dashboard")} />
        )}
        {currentScreen === "betting-deposit" && (
          <BettingDepositScreen 
            platformUid={selectedPlatformUid}
            onNavigateBack={() => setCurrentScreen("platform-detail")}
          />
        )}
        {currentScreen === "betting-withdrawal" && (
          <BettingWithdrawalScreen 
            platformUid={selectedPlatformUid}
            onNavigateBack={() => setCurrentScreen("platform-detail")}
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
