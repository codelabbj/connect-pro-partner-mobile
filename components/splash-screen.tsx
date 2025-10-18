"use client"

import { useEffect, useState } from "react"
import { Wallet, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/contexts"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)
  const { t } = useLanguage()

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(timer)
  }, [onComplete])

  const getLoadingMessage = () => {
    if (progress < 30) return t("loading")
    if (progress >= 30 && progress < 60) return t("splash.loadingWallet")
    if (progress >= 60 && progress < 90) return t("splash.securingConnection")
    if (progress >= 90) return t("splash.almostReady")
    return t("loading")
  }

  useEffect(() => {
    document.body.style.background = "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)"
    document.body.style.minHeight = "100vh"

    return () => {
      document.body.style.background = ""
      document.body.style.minHeight = ""
    }
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Logo and App Name */}
      <div className="animate-fade-in-up text-center mb-8">
        <div className="bg-white rounded-full p-1 mb-4">
          <img src="/logo.png" alt="Connect Pro Logo" className="w-28 h-28 object-contain mx-auto" />
        </div>
        
        <h1 className="text-2lg font-bold tracking-tight mb-2" style={{ color: "#ffffff" }}>
          {t("appName")}
        </h1>
      </div>

      {/* Loading Progress */}
      <div className="w-full max-w-sm">
        <div className="bg-white/20 rounded-full h-2 mb-4">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading Message */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <p className="text-white text-sm font-medium">
              {getLoadingMessage()}
            </p>
          </div>
          <p className="text-white/70 text-xs">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  )
}
