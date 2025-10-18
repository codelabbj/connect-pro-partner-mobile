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
}

export function BettingPlatformsScreen({ 
  onNavigateBack, 
  onNavigateToPlatformDetail, 
  onNavigateToBettingTransactions,
  onNavigateToBettingCommissions 
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

  // Load platforms data
  const loadPlatforms = async () => {
    try {
      const data = await bettingService.getPlatformsWithStats()
      setPlatformsData(data)
    } catch (error) {
      console.error('Failed to load platforms:', error)
      toast({
        title: "Error",
        description: "Failed to load betting platforms",
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
        title: "Success",
        description: "Platforms data refreshed",
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
    if (!isActive) return "Inactive"
    if (permissionActive === false) return "No Permission"
    return "Active"
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading platforms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <div className="px-4 pt-16 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-12 w-12 p-0 rounded-full ${
                theme === "dark" 
                  ? "text-gray-300 hover:bg-gray-700/50" 
                  : "text-gray-600 hover:bg-gray-100/50"
              }`}
              onClick={onNavigateBack}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Betting Platforms
              </h1>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Manage your betting platform access
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-12 w-12 p-0 rounded-full ${
              theme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Summary Cards */}
        {platformsData && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className={`border-0 shadow-lg ${
              theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Authorized
                    </p>
                    <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {platformsData.summary.authorized_count}
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
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      With Transactions
                    </p>
                    <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {platformsData.summary.platforms_with_transactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`} />
            <Input
              placeholder="Search platforms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            />
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className={`w-32 ${
              theme === "dark" 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200 text-gray-900"
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="authorized">Authorized</SelectItem>
              <SelectItem value="unauthorized">Unauthorized</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className={`grid w-full grid-cols-3 ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authorized">Authorized</TabsTrigger>
            <TabsTrigger value="unauthorized">Unauthorized</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-4">
              {getFilteredPlatforms().map((platform) => (
                <Card
                  key={platform.uid}
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    theme === "dark" ? "bg-gray-800/95 hover:bg-gray-700/95" : "bg-white/95 hover:bg-gray-50/95"
                  }`}
                  onClick={() => onNavigateToPlatformDetail(platform.uid)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          {platform.logo ? (
                            <img src={platform.logo} alt={platform.name} className="w-10 h-10 rounded-lg" />
                          ) : (
                            <BarChart3 className="w-7 h-7 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {platform.name}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} truncate`}>
                            {platform.description || "No description available"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
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
                                {platform.my_stats.total_transactions} transactions
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
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
            <div className="space-y-4">
              {platformsData?.authorized_platforms.map((platform) => (
                <Card
                  key={platform.uid}
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    theme === "dark" ? "bg-gray-800/95 hover:bg-gray-700/95" : "bg-white/95 hover:bg-gray-50/95"
                  }`}
                  onClick={() => onNavigateToPlatformDetail(platform.uid)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                          {platform.logo ? (
                            <img src={platform.logo} alt={platform.name} className="w-8 h-8 rounded-lg" />
                          ) : (
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {platform.name}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Granted by: {platform.granted_by_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                              Can Deposit: {platform.can_deposit ? "Yes" : "No"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                              Can Withdraw: {platform.can_withdraw ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
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
            <div className="space-y-4">
              {platformsData?.unauthorized_platforms.map((platform) => (
                <Card
                  key={platform.uid}
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    theme === "dark" ? "bg-gray-800/95 hover:bg-gray-700/95" : "bg-white/95 hover:bg-gray-50/95"
                  }`}
                  onClick={() => onNavigateToPlatformDetail(platform.uid)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                          {platform.logo ? (
                            <img src={platform.logo} alt={platform.name} className="w-8 h-8 rounded-lg" />
                          ) : (
                            <Shield className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {platform.name}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            No permission granted
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-500">
                              No Access
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
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
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={onNavigateToBettingTransactions}
            className={`h-14 border-0 text-base ${
              theme === "dark" 
                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400" 
                : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-600"
            }`}
          >
            <TrendingUp className="w-6 h-6 mr-3" />
            Transactions
          </Button>
          <Button
            onClick={onNavigateToBettingCommissions}
            className={`h-14 border-0 text-base ${
              theme === "dark" 
                ? "bg-green-500/20 hover:bg-green-500/30 text-green-400" 
                : "bg-green-500/20 hover:bg-green-500/30 text-green-600"
            }`}
          >
            <DollarSign className="w-6 h-6 mr-3" />
            Commissions
          </Button>
        </div>
      </div>
    </div>
  )
}
