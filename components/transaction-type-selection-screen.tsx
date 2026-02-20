"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Gamepad2, ArrowLeft, Ban } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"

interface Props {
	transactionType: "deposit" | "withdraw"
	onNavigateBack: () => void
	onSelectMobileMoney: () => void
	onSelectBetting: () => void
}

export function TransactionTypeSelectionScreen({ transactionType, onNavigateBack, onSelectMobileMoney, onSelectBetting }: Props) {
	const { theme, resolvedTheme } = useTheme()
	const { user } = useAuth()
  const { t } = useTranslation()
	const canMobile = (user as any)?.can_use_momo_pay !== false && (user as any)?.can_process_ussd_transaction !== false
	const canBetting = (user as any)?.can_use_mobcash_betting !== false

	return (
		<div className={`min-h-screen ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
			<div className="px-4 pt-12 pb-6 safe-area-inset-top">
				<Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full mb-4" onClick={onNavigateBack}>
					<ArrowLeft className="w-5 h-5" />
				</Button>
        <h1 className="text-xl font-bold mb-1">{transactionType === 'deposit' ? t("transactionTypeSelect.titleDeposit") : t("transactionTypeSelect.titleWithdraw")}</h1>
        <p className="text-sm opacity-80 mb-6">{t("transactionTypeSelect.subtitle")}</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Card className={`${resolvedTheme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95'} ${!canMobile ? 'opacity-60' : ''}`}>
						<CardContent className="p-4 flex items-center gap-4">
							<div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
								<Wallet className="w-6 h-6 text-blue-500" />
							</div>
              <div className="flex-1">
                <p className="font-semibold">{t("transactionTypeSelect.mobileMoneyTitle")}</p>
                <p className="text-xs opacity-80">{transactionType === 'deposit' ? t("transactionTypeSelect.mobileMoneyDescDeposit") : t("transactionTypeSelect.mobileMoneyDescWithdraw")}</p>
              </div>
              <Button onClick={onSelectMobileMoney} disabled={!canMobile} className="ml-auto">{t("common.select")}</Button>
						</CardContent>
					</Card>

					<Card className={`${resolvedTheme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95'} ${!canBetting ? 'opacity-60' : ''}`}>
						<CardContent className="p-4 flex items-center gap-4">
							<div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
								<Gamepad2 className="w-6 h-6 text-green-500" />
							</div>
              <div className="flex-1">
                <p className="font-semibold">{t("transactionTypeSelect.bettingTitle")}</p>
                <p className="text-xs opacity-80">{t("transactionTypeSelect.bettingDesc")}</p>
              </div>
              <Button onClick={onSelectBetting} disabled={!canBetting} className="ml-auto">{t("common.select")}</Button>
						</CardContent>
					</Card>
				</div>

				{!canMobile && !canBetting && (
					<div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${resolvedTheme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100/80'}`}>
						<Ban className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t("transactionTypeSelect.noneAvailableTitle")}</p>
              <p className="text-xs opacity-80">{t("transactionTypeSelect.noneAvailableDesc", { context: transactionType })}</p>
            </div>
					</div>
				)}
			</div>
		</div>
	)
}


