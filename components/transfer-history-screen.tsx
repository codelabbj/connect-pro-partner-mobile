"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"

export function TransferHistoryScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { theme, resolvedTheme } = useTheme()
	const { t } = useTranslation()
	return (
		<div className={`min-h-screen p-4 ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
			<div className="max-w-2xl mx-auto">
				<Button variant="ghost" onClick={onNavigateBack} className="mb-4">{t("common.back")}</Button>
				<Card>
					<CardHeader>
						<CardTitle>{t("transferHistory.title")}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm opacity-80">{t("transferHistory.empty")}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}


