"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Home,
  TrendingUp,
  TrendingDown,
  Zap,
  Settings,
  History,
  Battery,
  BarChart3,
  Activity,
  DollarSign,
  Menu,
  X,
  User,
  LogOut,
  Smartphone,
  Send,
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"

interface SidebarProps {
  currentScreen: string
  onNavigate: (screen: string) => void
  onLogout: () => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ currentScreen, onNavigate, onLogout, isOpen, onToggle }: SidebarProps) {
  const { resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const { user } = useAuth()

  const navigationItems = [
    {
      id: "dashboard",
      label: t("nav.dashboard"),
      icon: Home,
      color: "text-blue-500",
      hoverColor: "hover:bg-blue-500/10"
    },
    {
      id: "deposit",
      label: t("nav.deposit"),
      icon: TrendingUp,
      color: "text-green-500",
      hoverColor: "hover:bg-green-500/10"
    },
    {
      id: "withdraw",
      label: t("nav.withdraw"),
      icon: TrendingDown,
      color: "text-red-500",
      hoverColor: "hover:bg-red-500/10"
    },
    {
      id: "recharge",
      label: t("nav.recharge"),
      icon: Zap,
      color: "text-purple-500",
      hoverColor: "hover:bg-purple-500/10"
    },
    {
      id: "transfer",
      label: t("nav.transfer"),
      icon: Send,
      color: "text-purple-500",
      hoverColor: "hover:bg-purple-500/10"
    },
    {
      id: "transaction-history",
      label: t("nav.transactionHistory"),
      icon: History,
      color: "text-gray-500",
      hoverColor: "hover:bg-gray-500/10"
    },
    {
      id: "recharge-history",
      label: t("nav.rechargeHistory"),
      icon: Battery,
      color: "text-orange-500",
      hoverColor: "hover:bg-orange-500/10"
    },
    {
      id: "auto-recharge",
      label: t("nav.autoRecharge"),
      icon: Smartphone,
      color: "text-purple-500",
      hoverColor: "hover:bg-purple-500/10"
    },
    {
      id: "auto-recharge-transactions",
      label: t("nav.autoRechargeHistory"),
      icon: History,
      color: "text-indigo-500",
      hoverColor: "hover:bg-indigo-500/10"
    },
    {
      id: "betting-platforms",
      label: t("nav.bettingPlatforms"),
      icon: BarChart3,
      color: "text-blue-500",
      hoverColor: "hover:bg-blue-500/10"
    },
    {
      id: "betting-transactions",
      label: t("nav.bettingTransactions"),
      icon: Activity,
      color: "text-green-500",
      hoverColor: "hover:bg-green-500/10"
    },
    {
      id: "betting-commissions",
      label: t("nav.bettingCommissions"),
      icon: DollarSign,
      color: "text-yellow-500",
      hoverColor: "hover:bg-yellow-500/10"
    },
    {
      id: "settings",
      label: t("nav.settings"),
      icon: Settings,
      color: "text-gray-500",
      hoverColor: "hover:bg-gray-500/10"
    }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-72 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${resolvedTheme === "dark" ? "bg-gray-900" : "bg-white"
        } border-r ${resolvedTheme === "dark" ? "border-gray-700" : "border-gray-200"
        } shadow-xl lg:shadow-none overflow-y-auto flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Connect Pro Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className={`font-bold text-lg truncate ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("app.name")}
              </h2>
              <p className={`text-sm truncate ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-10 w-10 p-0 flex-shrink-0"
            onClick={onToggle}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                {user ? `${user.first_name} ${user.last_name}` : "User"}
              </p>
              <p className={`text-xs truncate ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentScreen === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-14 px-4 text-base ${isActive
                    ? resolvedTheme === "dark"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-900"
                    : `${item.hoverColor} ${resolvedTheme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    }`
                    }`}
                  onClick={() => {
                    onNavigate(item.id)
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      onToggle()
                    }
                  }}
                >
                  <Icon className={`w-6 h-6 mr-4 ${isActive ? item.color : ""}`} />
                  <span className="font-medium">{item.label}</span>
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className={`w-full justify-start h-14 px-4 text-base ${resolvedTheme === "dark"
              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "text-red-600 hover:bg-red-500/10 hover:text-red-700"
              }`}
            onClick={onLogout}
          >
            <LogOut className="w-6 h-6 mr-4" />
            <span className="font-medium">{t("nav.logout")}</span>
          </Button>
        </div>
      </div>
    </>
  )
}

interface SidebarToggleProps {
  onToggle: () => void
}

export function SidebarToggle({ onToggle }: SidebarToggleProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`lg:hidden h-10 w-10 p-0 rounded-full ${resolvedTheme === "dark"
        ? "text-gray-300 hover:bg-gray-700/50"
        : "text-gray-600 hover:bg-gray-100/50"
        }`}
      onClick={onToggle}
    >
      <Menu className="w-5 h-5" />
    </Button>
  )
}
