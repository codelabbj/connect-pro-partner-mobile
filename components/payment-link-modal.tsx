"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"

interface PaymentLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentLink: string
  onContinue: () => void
}

export function PaymentLinkModal({
  open,
  onOpenChange,
  paymentLink,
  onContinue
}: PaymentLinkModalProps) {
  const { theme, resolvedTheme } = useTheme()
  const { t } = useTranslation()

  const handleContinueTransaction = () => {
    // Open the payment link in a new tab
    window.open(paymentLink, '_blank', 'noopener,noreferrer')
    onContinue()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-md mx-auto ${
        resolvedTheme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold text-center ${
            resolvedTheme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {t("paymentLink.title")}
          </DialogTitle>
          <DialogDescription className={`text-base text-center ${
            resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {t("paymentLink.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-6">
          <Button
            onClick={handleContinueTransaction}
            className={`w-full h-16 text-lg font-semibold transition-all duration-300 ${
              resolvedTheme === "dark"
                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20"
            } hover:scale-[1.02] active:scale-[0.98]`}
          >
            <ExternalLink className="w-5 h-5 mr-3" />
            {t("paymentLink.continueButton")}
          </Button>

          <p className={`text-base text-center ${
            resolvedTheme === "dark" ? "text-gray-500" : "text-gray-500"
          }`}>
            {t("paymentLink.newTabNote")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
