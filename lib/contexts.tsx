"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "./translations"
import { authService, type User, type AuthResponse } from "./auth"
import { accountService, type AccountData } from "./account"
import { transactionsService, type Transaction } from "./transactions"
import { networksService, type Network } from "./networks"
import { createTransactionService, type CreateTransactionPayload } from "./create-transaction"
import { rechargeService, type RechargeData, type CreateRechargePayload } from "./recharge"

// Theme Context
type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("theme", theme)

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setResolvedTheme(systemTheme)
      document.documentElement.classList.toggle("dark", systemTheme === "dark")
    } else {
      setResolvedTheme(theme)
      document.documentElement.classList.toggle("dark", theme === "dark")
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Language Context
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr")

  useEffect(() => {
    const stored = localStorage.getItem("language") as Language
    if (stored && (stored === "en" || stored === "fr")) {
      setLanguage(stored)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (value === undefined) {
      value = translations.en
      for (const k of keys) {
        value = value?.[k]
      }
    }
    
    if (typeof value === 'string') {
      return params ? value.replace(/\{\{(\w+)\}\}/g, (_, param) => params[param] || '') : value
    }
    
    return key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export const useTranslation = useLanguage

// Authentication Context
interface AuthContextType {
  user: User | null
  accountData: AccountData | null
  transactions: Transaction[]
  networks: Network[]
  recharges: RechargeData[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  refreshAccountData: () => Promise<void>
  refreshTransactions: () => Promise<void>
  refreshNetworks: () => Promise<void>
  refreshRecharges: () => Promise<void>
  createTransaction: (payload: CreateTransactionPayload) => Promise<void>
  createRecharge: (payload: CreateRechargePayload) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [recharges, setRecharges] = useState<RechargeData[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication check timeout')), 10000)
        )
        
        const authPromise = (async () => {
          if (authService.isAuthenticated()) {
            const isValid = await authService.validateToken()
            if (isValid) {
              // Get user profile from API
              const userProfile = await authService.getUserProfile()
              setUser(userProfile)
              
              // Get account data and transactions
              const accessToken = authService.getAccessToken()
              if (accessToken) {
                try {
                  const accountData = await accountService.getAccountData(accessToken)
                  setAccountData(accountData)
                } catch (error) {
                  console.error('Failed to fetch account data:', error)
                }
                
                try {
                  const transactionsData = await transactionsService.getTransactions(accessToken, 1, 10)
                  setTransactions(transactionsData.results)
                } catch (error) {
                  console.error('Failed to fetch transactions:', error)
                }
              
                try {
                  const networksData = await networksService.getNetworks(accessToken)
                  setNetworks(networksData.results)
                } catch (error) {
                  console.error('Failed to fetch networks:', error)
                }
                
                try {
                  const rechargesData = await rechargeService.getRecharges(accessToken, 1, 10)
                  setRecharges(rechargesData.results)
                } catch (error) {
                  console.error('Failed to fetch recharges:', error)
                }
              }
              
              setIsAuthenticated(true)
            } else {
              authService.logout()
            }
          }
        })()
        
        await Promise.race([authPromise, timeoutPromise])
      } catch (error) {
        console.error('Auth check failed:', error)
        authService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (identifier: string, password: string): Promise<void> => {
    try {
      setIsLoading(true)
      await authService.login(identifier, password)
      
      // Get user profile after successful login
      const userProfile = await authService.getUserProfile()
      setUser(userProfile)
      
      // Get account data and transactions
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        try {
          const accountData = await accountService.getAccountData(accessToken)
          setAccountData(accountData)
        } catch (error) {
          console.error('Failed to fetch account data:', error)
        }
        
        try {
          const transactionsData = await transactionsService.getTransactions(accessToken, 1, 10)
          setTransactions(transactionsData.results)
        } catch (error) {
          console.error('Failed to fetch transactions:', error)
        }
        
        try {
          const networksData = await networksService.getNetworks(accessToken)
          setNetworks(networksData.results)
        } catch (error) {
          console.error('Failed to fetch networks:', error)
        }
        
        try {
          const rechargesData = await rechargeService.getRecharges(accessToken, 1, 10)
          setRecharges(rechargesData.results)
        } catch (error) {
          console.error('Failed to fetch recharges:', error)
        }
      }
      
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (): void => {
    authService.logout()
    setUser(null)
    setAccountData(null)
    setTransactions([])
    setNetworks([])
    setRecharges([])
    setIsAuthenticated(false)
  }

  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshAccessToken()
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    }
  }

  const refreshAccountData = async (): Promise<void> => {
    try {
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        const data = await accountService.getAccountData(accessToken)
        setAccountData(data)
      }
    } catch (error) {
      console.error('Failed to refresh account data:', error)
      throw error
    }
  }

  const refreshTransactions = async (): Promise<void> => {
    try {
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        const data = await transactionsService.getTransactions(accessToken, 1, 10)
        setTransactions(data.results)
      }
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
      throw error
    }
  }

  const refreshNetworks = async (): Promise<void> => {
    try {
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        const data = await networksService.getNetworks(accessToken)
        setNetworks(data.results)
      }
    } catch (error) {
      console.error('Failed to refresh networks:', error)
      throw error
    }
  }

  const refreshRecharges = async (): Promise<void> => {
    try {
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        const data = await rechargeService.getRecharges(accessToken, 1, 10)
        setRecharges(data.results)
      }
    } catch (error) {
      console.error('Failed to refresh recharges:', error)
      throw error
    }
  }

  const createTransaction = async (payload: CreateTransactionPayload): Promise<void> => {
    try {
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        await createTransactionService.createTransaction(accessToken, payload)
        // Refresh transactions after creating a new one
        await refreshTransactions()
        // Refresh account data to update balance
        await refreshAccountData()
      }
    } catch (error) {
      console.error('Failed to create transaction:', error)
      throw error
    }
  }

  const createRecharge = async (payload: CreateRechargePayload): Promise<void> => {
    try {
      const accessToken = authService.getAccessToken()
      if (accessToken) {
        await rechargeService.createRecharge(accessToken, payload)
        // Refresh recharges after creating a new one
        await refreshRecharges()
        // Refresh account data to update balance
        await refreshAccountData()
      }
    } catch (error) {
      console.error('Failed to create recharge:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      accountData,
      transactions,
      networks,
      recharges,
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      refreshToken,
      refreshAccountData,
      refreshTransactions,
      refreshNetworks,
      refreshRecharges,
      createTransaction,
      createRecharge
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
