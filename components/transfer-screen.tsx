"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"

export function TransferScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
	const { theme } = useTheme()
	const { t } = useTranslation()
	const [recipient, setRecipient] = useState("")
	const [amount, setAmount] = useState("")
	const [note, setNote] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setSuccess("")
		setSubmitting(true)
		try {
			// Placeholder – implement actual transfer service in lib/transfers.ts
			await new Promise((r) => setTimeout(r, 600))
			setSuccess("Transfer submitted")
		} catch (err: any) {
			setError(err?.message || "Failed to submit transfer")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className={`min-h-screen p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
			<div className="max-w-md mx-auto">
				<Button variant="ghost" onClick={onNavigateBack} className="mb-4">{t("common.back")}</Button>
				<Card>
					<CardHeader>
						<CardTitle>{t("transfer.title")}</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={submit} className="space-y-4">
							{error && <div className="text-sm text-red-500">{t("transfer.failed")}</div>}
							{success && <div className="text-sm text-green-600">{t("transfer.submitted")}</div>}
							<Input placeholder={t("transfer.recipientPlaceholder") as string} value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
							<Input placeholder={t("transfer.amountPlaceholder") as string} value={amount} onChange={(e) => setAmount(e.target.value)} required />
							<Input placeholder={t("transfer.notePlaceholder") as string} value={note} onChange={(e) => setNote(e.target.value)} />
							<Button type="submit" disabled={submitting} className="w-full">{submitting ? t("transfer.sending") : t("transfer.send")}</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}


