"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"

export function NotificationScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { theme } = useTheme()
    const { t } = useTranslation()
	return (
		<div className={`min-h-screen p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
			<div className="max-w-xl mx-auto">
				<Button variant="ghost" onClick={onNavigateBack} className="mb-4">{t("common.back")}</Button>
				<Card>
					<CardHeader className="flex flex-row items-center gap-2">
						<Bell className="w-5 h-5" />
						<CardTitle>{t("notifications.title")}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm opacity-80">{t("notifications.empty")}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}


