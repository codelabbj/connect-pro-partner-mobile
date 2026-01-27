"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Smartphone,
  Lock,
  Eye,
  Palette,
  Languages,
} from "lucide-react"
import { useTranslation } from "@/lib/contexts"
import { useTheme } from "@/lib/contexts"

interface SettingsScreenProps {
  onNavigateBack: () => void
  onNavigateToProfile: () => void
  onNavigateToChangePassword: () => void
  onLogout: () => void
}

export function SettingsScreen({ onNavigateBack, onNavigateToProfile, onNavigateToChangePassword, onLogout }: SettingsScreenProps) {
  const { t, language, setLanguage } = useTranslation()
  const { theme, setTheme } = useTheme()

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "fr" : "en")
  }

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light")
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
      <div className="px-4 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center gap-4">
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
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t("settings.title")}</h1>
        </div>
      </div>

      <div className="px-4 py-8 space-y-8">
        {/* Account Section */}
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardContent className="p-0">
            <div className={`p-8 border-b ${theme === "dark" ? "border-gray-700/50" : "border-border/50"}`}>
              <h2 className={`font-bold text-xl mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t("settings.account.title")}</h2>
              <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{t("settings.account.subtitle")}</p>
            </div>

            <div className="space-y-0">
              <SettingsItem
                icon={<User className="w-6 h-6" />}
                title={t("settings.account.profile")}
                subtitle={t("settings.account.profileSubtitle")}
                showChevron
                onClick={onNavigateToProfile}
              />
              <SettingsItem
                icon={<Lock className="w-6 h-6" />}
                title={t("settings.account.changePassword")}
                subtitle={t("settings.account.changePasswordSubtitle")}
                showChevron
                onClick={onNavigateToChangePassword}
              />
              {/* <SettingsItem
                icon={<CreditCard className="w-5 h-5" />}
                title={t("settings.account.payment")}
                subtitle={t("settings.account.paymentSubtitle")}
                showChevron
              /> */}
              
              <SettingsItem
                icon={<Languages className="w-6 h-6" />}
                title={t("settings.account.language")}
                subtitle={language === "en" ? "English" : "Français"}
                showButton
                buttonText={language === "en" ? "FR" : "EN"}
                onButtonClick={handleLanguageToggle}
              />
              <SettingsItem
                icon={<Palette className="w-6 h-6" />}
                title={t("settings.account.theme")}
                subtitle={theme === "light" ? t("settings.account.lightTheme") : t("settings.account.darkTheme")}
                showButton
                buttonText={theme === "light" ? "🌙" : "☀️"}
                onButtonClick={handleThemeToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        {/* <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardContent className="p-0">
            <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700/50" : "border-border/50"}`}>
              <h2 className={`font-bold text-lg mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t("settings.security.title")}</h2>
              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{t("settings.security.subtitle")}</p>
            </div>

            <div className="space-y-0">
              <SettingsItem
                icon={<Lock className="w-5 h-5" />}
                title={t("settings.security.password")}
                subtitle={t("settings.security.passwordSubtitle")}
                showChevron
              />
              <SettingsItem
                icon={<Smartphone className="w-5 h-5" />}
                title={t("settings.security.twoFactor")}
                subtitle={t("settings.security.enabled")}
                showToggle
                toggleValue={true}
                showBadge
              />
              <SettingsItem
                icon={<Eye className="w-5 h-5" />}
                title={t("settings.security.biometric")}
                subtitle={t("settings.security.biometricSubtitle")}
                showToggle
                toggleValue={true}
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Notifications Section */}
        {/* <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardContent className="p-0">
            <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700/50" : "border-border/50"}`}>
              <h2 className={`font-bold text-lg mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t("settings.notifications.title")}</h2>
              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{t("settings.notifications.subtitle")}</p>
            </div>

            <div className="space-y-0">
              <SettingsItem
                icon={<Bell className="w-5 h-5" />}
                title={t("settings.notifications.push")}
                subtitle={t("settings.notifications.pushSubtitle")}
                showToggle
                toggleValue={true}
              />
              <SettingsItem
                icon={<Shield className="w-5 h-5" />}
                title={t("settings.notifications.security")}
                subtitle={t("settings.notifications.securitySubtitle")}
                showToggle
                toggleValue={true}
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Support Section */}
        {/* <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardContent className="p-0">
            <div className="space-y-0">
              <SettingsItem
                icon={<HelpCircle className="w-5 h-5" />}
                title={t("settings.support.help")}
                subtitle={t("settings.support.helpSubtitle")}
                showChevron
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          {t("settings.logout")}
        </Button>
      </div>
    </div>
  )
}

interface SettingsItemProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  showChevron?: boolean
  showToggle?: boolean
  toggleValue?: boolean
  showBadge?: boolean
  showButton?: boolean
  buttonText?: string
  onButtonClick?: () => void
  onClick?: () => void
}

function SettingsItem({
  icon,
  title,
  subtitle,
  showChevron,
  showToggle,
  toggleValue,
  showBadge,
  showButton,
  buttonText,
  onButtonClick,
  onClick,
}: SettingsItemProps) {
  const { theme } = useTheme()
  
  return (
    /* Enhanced settings item with better hover effects and spacing */
    <div
      className={`flex items-center justify-between p-8 transition-all duration-200 min-h-[100px] border-b last:border-b-0 ${
        theme === "dark"
          ? "hover:bg-gray-700/30 border-gray-700/50"
          : "hover:bg-gray-100/30 border-border/30"
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-5 flex-1">
        <div className={`p-3 rounded-xl ${
          theme === "dark"
            ? "text-gray-300 bg-gray-700/50"
            : "text-muted-foreground bg-muted/50"
        }`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className={`font-semibold text-lg ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>{title}</p>
            {showBadge && <div className="w-2 h-2 bg-accent rounded-full"></div>}
          </div>
          <p className={`text-base mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showToggle && <Switch checked={toggleValue} className="data-[state=checked]:bg-accent" />}
        {showButton && (
          <Button
            variant="outline"
            size="sm"
            className={`h-10 px-4 text-sm font-medium ${
              theme === "dark" 
                ? "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700" 
                : "bg-transparent"
            }`}
            onClick={onButtonClick}
          >
            {buttonText}
          </Button>
        )}
        {showChevron && <ChevronRight className={`w-5 h-5 ${
          theme === "dark" ? "text-gray-400" : "text-muted-foreground"
        }`} />}
      </div>
    </div>
  )
}
