"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"

export function PermissionDeniedScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { theme, resolvedTheme } = useTheme()
    const { t } = useTranslation()
	return (
		<div className={`min-h-screen flex items-center justify-center p-6 ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
			<div className="max-w-sm w-full text-center space-y-4">
				<div className="flex justify-center">
					<ShieldAlert className="w-12 h-12 text-red-500" />
				</div>
				<h1 className="text-xl font-semibold">{t("permissionDenied.title")}</h1>
				<p className="text-sm opacity-80">{t("permissionDenied.message")}</p>
				<Button onClick={onNavigateBack} className="w-full">{t("permissionDenied.back")}</Button>
			</div>
		</div>
	)
}


