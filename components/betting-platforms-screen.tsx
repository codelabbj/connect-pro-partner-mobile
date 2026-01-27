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
  Users,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  Gamepad2,
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { bettingService } from "@/lib/betting-api"
import { BettingPlatformWithStats, BettingPlatformsWithStatsResponse } from "@/lib/betting"

interface BettingPlatformsScreenProps {
  onNavigateBack: () => void
  onNavigateToPlatformDetail: (platformUid: string) => void
  onNavigateToBettingTransactions: () => void
  onNavigateToBettingCommissions: () => void
  intendedTransactionType?: "deposit" | "withdraw"
  onNavigateToDeposit?: (platformUid: string) => void
  onNavigateToWithdraw?: (platformUid: string) => void
}

export function BettingPlatformsScreen({ 
  onNavigateBack, 
  onNavigateToPlatformDetail, 
  onNavigateToBettingTransactions,
  onNavigateToBettingCommissions,
  intendedTransactionType,
  onNavigateToDeposit,
  onNavigateToWithdraw,
}: BettingPlatformsScreenProps) {
  const [platformsData, setPlatformsData] = useState<BettingPlatformsWithStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "authorized" | "unauthorized">("all")
  const [activeTab, setActiveTab] = useState<"overview" | "authorized" | "unauthorized">("overview")
  
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  // Merge external data with platforms
  const mergeExternalData = async (data: BettingPlatformsWithStatsResponse) => {
    try {
      const externalData = await bettingService.getExternalPlatformData()
      const externalMap = new Map(externalData.map(item => [item.id, item]))

      const mergePlatform = (platform: BettingPlatformWithStats) => {
        const external = externalMap.get(platform.external_id)
        if (external) {
          return {
            ...platform,
            external_image: external.image,
            city: external.city,
            street: external.street,
          }
        }
        return platform
      }

      return {
        ...data,
        authorized_platforms: data.authorized_platforms.map(mergePlatform),
        unauthorized_platforms: data.unauthorized_platforms.map(mergePlatform),
      }
    } catch (error) {
      console.warn('Failed to merge external data:', error)
      return data
    }
  }

  // Get platform image URL with priority resolution
  const getPlatformImageUrl = (platform: BettingPlatformWithStats) => {
    if (platform.external_image) {
      return platform.external_image
    }
    if (platform.logo) {
      // Check if logo is already a full URL
      if (platform.logo.startsWith('http://') || platform.logo.startsWith('https://')) {
        return platform.logo
      }
      return `${baseUrl}${platform.logo.startsWith('/') ? '' : '/'}${platform.logo}`
    }
    return null
  }

  // Load platforms data
  const loadPlatforms = async () => {
    try {
      const data = await bettingService.getPlatformsWithStats()
      const mergedData = await mergeExternalData(data)
      setPlatformsData(mergedData)
    } catch (error: any) {
      console.error('Failed to load platforms:', error)
      toast({
        title: t("betting.platforms.errorTitle"),
        description: String(error?.message || 'Failed to load betting platforms'),
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
      await loadPlatforms()
      toast({
        title: t("betting.platforms.successTitle"),
        description: t("betting.platforms.refreshed"),
      })
    } catch (error) {
      console.error('Failed to refresh platforms:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPlatforms()
  }, [])

  // Filter platforms based on search and filter
  const getFilteredPlatforms = () => {
    if (!platformsData) return []
    
    let platforms = []
    if (filterType === "authorized") {
      platforms = platformsData.authorized_platforms
    } else if (filterType === "unauthorized") {
      platforms = platformsData.unauthorized_platforms
    } else {
      platforms = [...platformsData.authorized_platforms, ...platformsData.unauthorized_platforms]
    }

    if (searchTerm) {
      platforms = platforms.filter(platform =>
        platform.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return platforms
  }

  // Format currency
  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString()
  }

  // Get status color
  const getStatusColor = (isActive: boolean, permissionActive?: boolean) => {
    if (!isActive) return "bg-red-500"
    if (permissionActive === false) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Get status text
  const getStatusText = (isActive: boolean, permissionActive?: boolean) => {
    if (!isActive) return t("betting.platforms.status.inactive")
    if (permissionActive === false) return t("betting.platforms.status.noPermission")
    return t("betting.platforms.status.active")
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">{t("betting.platforms.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <div className="px-4 pt-14 sm:pt-16 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 sm:h-12 sm:w-12 p-0 rounded-full ${
                theme === "dark" 
                  ? "text-gray-300 hover:bg-gray-700/50" 
                  : "text-gray-600 hover:bg-gray-100/50"
              }`}
              onClick={onNavigateBack}
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <div>
              <h1 className={`text-lg sm:text-2xl font-bold leading-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("betting.platforms.title")}
              </h1>
              <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("betting.platforms.subtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 w-10 sm:h-12 sm:w-12 p-0 rounded-full ${
              theme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Summary Cards */}
        {platformsData && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <Card className={`border-0 shadow-lg ${
              theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
            }`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("betting.platforms.summary.authorized")}
                    </p>
                    <p className={`text-base sm:text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {platformsData.summary.authorized_count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${
              theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
            }`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("betting.platforms.summary.withTransactions")}
                    </p>
                    <p className={`text-base sm:text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {platformsData.summary.platforms_with_transactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`} />
            <Input
              placeholder={t("betting.platforms.searchPlaceholder") as string}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 h-11 sm:h-10 ${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            />
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className={`w-full sm:w-44 h-11 sm:h-10 ${
              theme === "dark" 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200 text-gray-900"
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("betting.platforms.filters.all")}</SelectItem>
              <SelectItem value="authorized">{t("betting.platforms.filters.authorized")}</SelectItem>
              <SelectItem value="unauthorized">{t("betting.platforms.filters.unauthorized")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className={`${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          } overflow-x-auto flex gap-2 rounded-lg p-1`}>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0 px-3 py-2" value="overview">{t("betting.platforms.tabs.overview")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0 px-3 py-2" value="authorized">{t("betting.platforms.tabs.authorized")}</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0 px-3 py-2" value="unauthorized">{t("betting.platforms.tabs.unauthorized")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-3 sm:space-y-4 max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
              {getFilteredPlatforms().map((platform) => (
                <Card
                  key={platform.uid}
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    theme === "dark" ? "bg-gray-800/95 hover:bg-gray-700/95" : "bg-white/95 hover:bg-gray-50/95"
                  }`}
                  onClick={() => {
                    if (intendedTransactionType === "deposit" && onNavigateToDeposit) {
                      onNavigateToDeposit(platform.uid)
                      return
                    }
                    if (intendedTransactionType === "withdraw" && onNavigateToWithdraw) {
                      onNavigateToWithdraw(platform.uid)
                      return
                    }
                    onNavigateToPlatformDetail(platform.uid)
                  }}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {getPlatformImageUrl(platform) ? (
                            <img src={getPlatformImageUrl(platform)!} alt={platform.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-base sm:text-lg ${theme === "dark" ? "text-white" : "text-gray-900"} truncate`}>
                            {platform.name}
                          </h3>
                          <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} truncate`}>
                            {platform.description || t("betting.platforms.descriptionFallback")}
                          </p>
                          {(platform.city || platform.street) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {platform.city && (
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {t("betting.platforms.address.city", { city: platform.city })}
                                </span>
                              )}
                              {platform.street && (
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {t("betting.platforms.address.street", { street: platform.street })}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                getStatusColor(platform.is_active, platform.permission_is_active) === "bg-green-500"
                                  ? "bg-green-500/20 text-green-500"
                                  : getStatusColor(platform.is_active, platform.permission_is_active) === "bg-yellow-500"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {getStatusText(platform.is_active, platform.permission_is_active)}
                            </Badge>
                            {platform.my_stats && platform.my_stats.total_transactions > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {t("betting.platforms.transactionsCount", { count: platform.my_stats.total_transactions })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {platform.my_stats && (
                          <div className="space-y-1">
                            <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {formatCurrency(platform.my_stats.total_amount.toString())} FCFA
                            </p>
                            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {t("betting.platforms.commissionLabel")}: {formatCurrency(platform.my_stats.total_commission.toString())} FCFA
                            </p>
                          </div>
                        )}
                        <div className={`w-2 h-2 rounded-full mt-2 ml-auto ${
                          getStatusColor(platform.is_active, platform.permission_is_active)
                        }`}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="authorized" className="mt-6">
            <div className="space-y-3 sm:space-y-4 max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
              {platformsData?.authorized_platforms.map((platform) => (
                <Card
                  key={platform.uid}
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    theme === "dark" ? "bg-gray-800/95 hover:bg-gray-700/95" : "bg-white/95 hover:bg-gray-50/95"
                  }`}
                  onClick={() => onNavigateToPlatformDetail(platform.uid)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          {getPlatformImageUrl(platform) ? (
                            <img src={getPlatformImageUrl(platform)!} alt={platform.name} className="w-8 h-8 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Gamepad2 className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-bold text-base sm:text-lg ${theme === "dark" ? "text-white" : "text-gray-900"} truncate`}>
                            {platform.name}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.platforms.grantedBy", { name: platform.granted_by_name })}
                          </p>
                          {(platform.city || platform.street) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {platform.city && (
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {t("betting.platforms.address.city", { city: platform.city })}
                                </span>
                              )}
                              {platform.street && (
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {t("betting.platforms.address.street", { street: platform.street })}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                              {t("betting.platforms.canDeposit", { value: platform.can_deposit ? t("betting.platforms.yes") : t("betting.platforms.no") })}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                              {t("betting.platforms.canWithdraw", { value: platform.can_withdraw ? t("betting.platforms.yes") : t("betting.platforms.no") })}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {platform.my_stats && (
                          <div className="space-y-1">
                            <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {formatCurrency(platform.my_stats.total_amount.toString())} FCFA
                            </p>
                            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              Commission: {formatCurrency(platform.my_stats.total_commission.toString())} FCFA
                            </p>
                          </div>
                        )}
                        <div className="w-2 h-2 rounded-full mt-2 ml-auto bg-green-500"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unauthorized" className="mt-6">
            <div className="space-y-3 sm:space-y-4 max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
              {platformsData?.unauthorized_platforms.map((platform) => (
                <Card
                  key={platform.uid}
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    theme === "dark" ? "bg-gray-800/95 hover:bg-gray-700/95" : "bg-white/95 hover:bg-gray-50/95"
                  }`}
                  onClick={() => onNavigateToPlatformDetail(platform.uid)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                          {getPlatformImageUrl(platform) ? (
                            <img src={getPlatformImageUrl(platform)!} alt={platform.name} className="w-8 h-8 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Gamepad2 className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-bold text-base sm:text-lg ${theme === "dark" ? "text-white" : "text-gray-900"} truncate`}>
                            {platform.name}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {t("betting.platforms.noPermissionGranted")}
                          </p>
                          {(platform.city || platform.street) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {platform.city && (
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {t("betting.platforms.address.city", { city: platform.city })}
                                </span>
                              )}
                              {platform.street && (
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {t("betting.platforms.address.street", { street: platform.street })}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-500">
                              {t("betting.platforms.noAccess")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="w-2 h-2 rounded-full mt-2 ml-auto bg-red-500"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-8 pt-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Button
            onClick={onNavigateToBettingTransactions}
            className={`h-12 sm:h-14 border-0 text-sm sm:text-base w-full ${
              theme === "dark" 
                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400" 
                : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-600"
            }`}
          >
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            {t("betting.platforms.quickActions.transactions")}
          </Button>
          <Button
            onClick={onNavigateToBettingCommissions}
            className={`h-12 sm:h-14 border-0 text-sm sm:text-base w-full ${
              theme === "dark" 
                ? "bg-green-500/20 hover:bg-green-500/30 text-green-400" 
                : "bg-green-500/20 hover:bg-green-500/30 text-green-600"
            }`}
          >
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            {t("betting.platforms.quickActions.commissions")}
          </Button>
        </div>
      </div>
    </div>
  )
}
