"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldCheck,
  DollarSign,
  Calendar,
  User,
  RefreshCw,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { bettingService } from "@/lib/betting-api"
import { BettingPlatform } from "@/lib/betting"

interface PlatformDetailScreenProps {
  platformUid: string
  onNavigateBack: () => void
  onNavigateToDeposit: (platformUid: string) => void
  onNavigateToWithdraw: (platformUid: string) => void
}

export function PlatformDetailScreen({ 
  platformUid, 
  onNavigateBack, 
  onNavigateToDeposit,
  onNavigateToWithdraw 
}: PlatformDetailScreenProps) {
  const [platform, setPlatform] = useState<BettingPlatform | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()

  // Load platform detail
  const loadPlatformDetail = async () => {
    try {
      const data = await bettingService.getPlatformDetail(platformUid)
      setPlatform(data)
    } catch (error: any) {
      console.error('Failed to load platform detail:', error)
      toast({
        title: "Error",
        description: String(error?.message || 'Failed to load platform details'),
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
      await loadPlatformDetail()
      toast({
        title: "Success",
        description: "Platform details refreshed",
      })
    } catch (error) {
      console.error('Failed to refresh platform details:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPlatformDetail()
  }, [platformUid])

  // Format currency
  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString()
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Get status icon
  const getStatusIcon = (isActive: boolean, permissionActive?: boolean) => {
    if (!isActive) return <XCircle className="w-4 h-4 text-red-500" />
    if (permissionActive === false) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading platform details...</p>
        </div>
      </div>
    )
  }

  if (!platform) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Platform Not Found</h2>
          <p className="text-sm opacity-70 mb-4">The requested platform could not be found.</p>
          <Button onClick={onNavigateBack}>Go Back</Button>
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
              <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {platform.name}
              </h1>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Platform Details
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

        {/* Platform Header Card */}
        <Card className={`border-0 shadow-xl mb-6 ${
          theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                {platform.logo ? (
                  <img src={platform.logo} alt={platform.name} className="w-12 h-12 rounded-xl" />
                ) : (
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {platform.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(platform.is_active, platform.permission_is_active)}
                  <Badge 
                    variant="secondary" 
                    className={`text-sm ${
                      getStatusColor(platform.is_active, platform.permission_is_active) === "bg-green-500"
                        ? "bg-green-500/20 text-green-500"
                        : getStatusColor(platform.is_active, platform.permission_is_active) === "bg-yellow-500"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {getStatusText(platform.is_active, platform.permission_is_active)}
                  </Badge>
                </div>
              </div>
            </div>
            
            {platform.description && (
              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-4`}>
                {platform.description}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-4">
        <Tabs defaultValue="limits" className="w-full">
          <TabsList className={`grid w-full grid-cols-3 ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}>
            <TabsTrigger value="limits">Limits</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="limits" className="mt-6">
            <div className="space-y-4">
              {/* Deposit Limits */}
              <Card className={`border-0 shadow-lg ${
                theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-lg flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Deposit Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Minimum Amount
                    </span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(platform.min_deposit_amount)} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Maximum Amount
                    </span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(platform.max_deposit_amount)} FCFA
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Limits */}
              <Card className={`border-0 shadow-lg ${
                theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-lg flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    Withdrawal Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Minimum Amount
                    </span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(platform.min_withdrawal_amount)} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Maximum Amount
                    </span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(platform.max_withdrawal_amount)} FCFA
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <div className="space-y-4">
              {/* Permission Status */}
              <Card className={`border-0 shadow-lg ${
                theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-lg flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    <Shield className="w-5 h-5 text-blue-500" />
                    Permission Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Can Deposit
                    </span>
                    <div className="flex items-center gap-2">
                      {platform.can_deposit ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          platform.can_deposit 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {platform.can_deposit ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Can Withdraw
                    </span>
                    <div className="flex items-center gap-2">
                      {platform.can_withdraw ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          platform.can_withdraw 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {platform.can_withdraw ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Permission Active
                    </span>
                    <div className="flex items-center gap-2">
                      {platform.permission_is_active ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          platform.permission_is_active 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {platform.permission_is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Permission Details */}
              {platform.granted_by_name && (
                <Card className={`border-0 shadow-lg ${
                  theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-lg flex items-center gap-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      <User className="w-5 h-5 text-purple-500" />
                      Permission Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        Granted By
                      </span>
                      <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {platform.granted_by_name}
                      </span>
                    </div>
                    {platform.permission_granted_at && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Granted At
                        </span>
                        <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {formatDate(platform.permission_granted_at)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <div className="space-y-4">
              {/* Platform Information */}
              <Card className={`border-0 shadow-lg ${
                theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-lg flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    <Activity className="w-5 h-5 text-blue-500" />
                    Platform Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Platform UID
                    </span>
                    <span className={`font-mono text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {platform.uid}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      External ID
                    </span>
                    <span className={`font-mono text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {platform.external_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Platform Status
                    </span>
                    <div className="flex items-center gap-2">
                      {platform.is_active ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          platform.is_active 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {platform.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-8 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => onNavigateToDeposit(platform.uid)}
            disabled={!platform.can_deposit || !platform.is_active}
            className={`h-12 border-0 ${
              platform.can_deposit && platform.is_active
                ? theme === "dark" 
                  ? "bg-green-500/20 hover:bg-green-500/30 text-green-400" 
                  : "bg-green-500/20 hover:bg-green-500/30 text-green-600"
                : theme === "dark"
                  ? "bg-gray-700/20 text-gray-500"
                  : "bg-gray-200/20 text-gray-400"
            }`}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Deposit
          </Button>
          <Button
            onClick={() => onNavigateToWithdraw(platform.uid)}
            disabled={!platform.can_withdraw || !platform.is_active}
            className={`h-12 border-0 ${
              platform.can_withdraw && platform.is_active
                ? theme === "dark" 
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400" 
                  : "bg-red-500/20 hover:bg-red-500/30 text-red-600"
                : theme === "dark"
                  ? "bg-gray-700/20 text-gray-500"
                  : "bg-gray-200/20 text-gray-400"
            }`}
          >
            <TrendingDown className="w-5 h-5 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  )
}





