"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import {
    FileSpreadsheet,
    Plus,
    Search,
    Trash2,
    Upload,
    MoreHorizontal,
    ArrowLeft,
    CircleCheck,
    CircleX,
    Clock,
    Loader2,
    AlertCircle,
    Activity,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Edit3,
    FileText,
} from "lucide-react"
import { useTranslation, useAuth, useTheme } from "@/lib/contexts"
import { bulkPaymentService, BulkBatch, BulkTransaction } from "../lib/bulk-payment"
import { networksService, Network } from "../lib/networks"
import { authService } from "../lib/auth"
import { formatAmount } from "../lib/utils"
import * as XLSX from 'xlsx'
import { toast } from "sonner"

type ViewState = 'list' | 'create' | 'summary' | 'transactions'

interface DraftTransaction {
    id: string;
    recipient_phone: string;
    amount: string;
    network_uid: string;
    objet: string;
    errors: Record<string, string>;
}

interface BulkPaymentPageProps {
    onBack: () => void
    initialView?: 'list' | 'create'
}

export function BulkPaymentPage({ onBack, initialView = 'list' }: BulkPaymentPageProps) {
    const { t, language } = useTranslation()
    const { user } = useAuth()
    const { resolvedTheme } = useTheme()
    const [viewState, setViewState] = useState<ViewState>(initialView)
    const [batches, setBatches] = useState<BulkBatch[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Create State
    const [networks, setNetworks] = useState<Network[]>([])
    const [rows, setRows] = useState<DraftTransaction[]>([])
    const [createPage, setCreatePage] = useState(1)
    const rowsPerPage = 10

    // Detail State
    const [selectedBatch, setSelectedBatch] = useState<BulkBatch | null>(null)
    const [batchTransactions, setBatchTransactions] = useState<BulkTransaction[]>([])
    const [batchDetailLoading, setBatchDetailLoading] = useState(false)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        date_from: '',
        date_to: '',
        network: 'all'
    })

    const accessToken = useMemo(() => authService?.getAccessToken?.() || null, [user])

    // Initialize with empty rows
    const initEmptyRows = useCallback(() => {
        const emptyRows: DraftTransaction[] = Array.from({ length: 5 }).map(() => ({
            id: Math.random().toString(36).substr(2, 9),
            recipient_phone: '',
            amount: '',
            network_uid: '',
            objet: '',
            errors: {}
        }))
        setRows(emptyRows)
    }, [])

    useEffect(() => {
        if (viewState === 'list') {
            loadBatches()
            loadNetworks()
        } else if (viewState === 'create') {
            loadNetworks()
            if (rows.length === 0) initEmptyRows()
        }
    }, [viewState, currentPage, filters])

    const loadBatches = async () => {
        if (!accessToken) return
        setIsLoading(true)
        try {
            const apiFilters: Record<string, string> = {}
            if (filters.status !== 'all') apiFilters.status = filters.status
            if (filters.search) apiFilters.search = filters.search
            if (filters.date_from) apiFilters.date_from = filters.date_from
            if (filters.date_to) apiFilters.date_to = filters.date_to
            if (filters.network !== 'all') apiFilters.network = filters.network

            const response = await bulkPaymentService.getBatches(accessToken, currentPage, apiFilters)
            setBatches(response.results)
            setTotalPages(Math.ceil(response.count / 10))
        } catch (error) {
            toast.error(t("common.error"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
        setCurrentPage(1) // Reset to page 1 on filter change
    }

    const loadNetworks = async () => {
        if (!accessToken) return
        try {
            const response = await bulkPaymentService.getAuthorizedNetworks(accessToken)
            // Use the 'networks' key as per the specialized bulk-deposit API response
            setNetworks(response.networks || [])
        } catch (error) {
            console.error('Failed to load networks', error)
        }
    }

    // --- Create Logic ---
    const addRow = () => {
        setRows([...rows, {
            id: Math.random().toString(36).substr(2, 9),
            recipient_phone: '',
            amount: '',
            network_uid: '',
            objet: '',
            errors: {}
        }])
    }

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id))
    }

    const updateRow = (id: string, field: keyof DraftTransaction, value: any) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value }
                updated.errors = validateRow(updated)
                return updated
            }
            return r
        }))
    }

    const validateRow = (row: DraftTransaction) => {
        const errors: Record<string, string> = {}
        if (row.recipient_phone && row.recipient_phone.length < 10) {
            errors.recipient_phone = t("bulkPayment.phoneError")
        }
        if (row.amount && isNaN(Number(row.amount))) {
            errors.amount = t("bulkPayment.amountError")
        }
        if (!row.network_uid && (row.recipient_phone || row.amount)) {
            errors.network_uid = t("bulkPayment.networkRequired")
        }
        return errors
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws) as any[]

            const importedRows: DraftTransaction[] = data.map(item => {
                // Smart keyword matching
                const amountKey = Object.keys(item).find(k => k.toLowerCase().includes('montant') || k.toLowerCase().includes('amount'))
                const phoneKey = Object.keys(item).find(k => k.toLowerCase().includes('numero') || k.toLowerCase().includes('numéro') || k.toLowerCase().includes('number') || k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel'))
                const networkKey = Object.keys(item).find(k => k.toLowerCase().includes('reseau') || k.toLowerCase().includes('réseau') || k.toLowerCase().includes('network'))
                const objetKey = Object.keys(item).find(k => k.toLowerCase().includes('objet') || k.toLowerCase().includes('description') || k.toLowerCase().includes('note'))

                const rawNetwork = networkKey ? String(item[networkKey]).toLowerCase() : ''
                // Fuzzy Matching
                const matchedNetwork = networks.find(n =>
                    n.code?.toLowerCase() === rawNetwork ||
                    n.nom?.toLowerCase() === rawNetwork ||
                    n.nom?.toLowerCase().includes(rawNetwork)
                )

                const row: DraftTransaction = {
                    id: Math.random().toString(36).substr(2, 9),
                    recipient_phone: phoneKey ? String(item[phoneKey]) : '',
                    amount: amountKey ? String(item[amountKey]) : '',
                    network_uid: matchedNetwork?.uid || '',
                    objet: objetKey ? String(item[objetKey]) : '',
                    errors: {}
                }
                row.errors = validateRow(row)
                return row
            })

            setRows([...rows.filter(r => r.recipient_phone || r.amount), ...importedRows])
            toast.success(t("bulkPayment.rowsImported", { count: importedRows.length }))
        }
        reader.readAsBinaryString(file)
    }

    const isFormValid = useMemo(() => {
        const activeRows = rows.filter(r => r.recipient_phone || r.amount || r.network_uid)
        if (activeRows.length === 0) return false
        return activeRows.every(r =>
            r.recipient_phone &&
            r.amount &&
            r.network_uid &&
            Object.keys(r.errors).length === 0
        )
    }, [rows])

    const totals = useMemo(() => {
        const activeRows = rows.filter(r => r.recipient_phone && r.amount && r.network_uid)
        return {
            count: activeRows.length,
            amount: activeRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
        }
    }, [rows])

    const handleSubmit = async () => {
        if (!accessToken) return
        setIsLoading(true)
        try {
            const activeRows = rows.filter(r => r.recipient_phone && r.amount && r.network_uid)
            await bulkPaymentService.submitBatch(accessToken, {
                transactions: activeRows.map(r => ({
                    amount: r.amount,
                    recipient_phone: r.recipient_phone,
                    network: r.network_uid,
                    objet: r.objet
                }))
            })
            toast.success(t("bulkPayment.success"))
            setViewState('list') // Redirect to history
            loadBatches() // Refresh history
            initEmptyRows()
        } catch (error) {
            toast.error(t("common.error"))
        } finally {
            setIsLoading(false)
            setConfirmDialogOpen(false)
        }
    }

    // --- List View ---
    const renderListView = () => (
        <div className="space-y-6 pb-12">
            <div className={`p-6 rounded-[2.5rem] bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-blue-900/40 to-purple-900/40 text-white' : 'from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/20'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={onBack}
                            size="icon"
                            className="rounded-2xl h-12 w-12 bg-white/20 hover:bg-white/30 backdrop-blur-md border-0 text-white transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black">{t("bulkPayment.title")}</h1>
                            <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'opacity-60' : 'text-blue-100'}`}>{t("bulkPayment.batchList")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setViewState('create')}
                        size="icon"
                        className="rounded-2xl h-14 w-14 bg-white hover:bg-white/90 shadow-xl text-blue-600 transition-all active:scale-90"
                    >
                        <Plus className="w-8 h-8" />
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="space-y-4 px-1">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 opacity-20 group-focus-within:opacity-100 group-focus-within:text-blue-500 transition-all" />
                    </div>
                    <Input
                        placeholder={t("common.search") || "Rechercher par UID..."}
                        className="pl-12 h-14 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none font-bold focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Select value={filters.status} onValueChange={(val) => handleFilterChange('status', val)}>
                        <SelectTrigger className="h-12 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md font-bold text-xs uppercase tracking-tight">
                            <SelectValue placeholder="STATUT" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl p-2">
                            <SelectItem value="all" className="rounded-xl my-1">{t("common.allStatus") || "TOUS LES STATUTS"}</SelectItem>
                            <SelectItem value="pending" className="rounded-xl my-1">{t("common.pending")?.toUpperCase() || "EN ATTENTE"}</SelectItem>
                            <SelectItem value="processing" className="rounded-xl my-1">{t("common.processing")?.toUpperCase() || "EN COURS"}</SelectItem>
                            <SelectItem value="completed" className="rounded-xl my-1">{t("common.completed")?.toUpperCase() || "TERMINÉ"}</SelectItem>
                            <SelectItem value="failed" className="rounded-xl my-1">{t("common.failed")?.toUpperCase() || "ÉCHOUÉ"}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.network} onValueChange={(val) => handleFilterChange('network', val)}>
                        <SelectTrigger className="h-12 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md font-bold text-xs uppercase tracking-tight">
                            <SelectValue placeholder="RÉSEAU" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl p-2">
                            <SelectItem value="all" className="rounded-xl my-1">{t("common.allNetworks") || "TOUS LES RÉSEAUX"}</SelectItem>
                            {networks.map(n => (
                                <SelectItem key={n.uid} value={n.uid} className="rounded-xl my-1">
                                    <div className="flex items-center gap-2">
                                        {n.image && <img src={n.image} className="w-4 h-4 rounded-full" />}
                                        <span>{n.nom}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <Input
                            type="date"
                            className="h-12 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md font-bold text-xs"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        />
                        <span className="absolute -top-2 left-4 px-1 bg-white dark:bg-gray-900 text-[8px] font-black opacity-40 rounded uppercase tracking-widest">{t("common.from") || "Du"}</span>
                    </div>
                    <div className="relative">
                        <Input
                            type="date"
                            className="h-12 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md font-bold text-xs"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        />
                        <span className="absolute -top-2 left-4 px-1 bg-white dark:bg-gray-900 text-[8px] font-black opacity-40 rounded uppercase tracking-widest">{t("common.to") || "Au"}</span>
                    </div>
                </div>

                {(filters.status !== 'all' || filters.search || filters.date_from || filters.date_to || filters.network !== 'all') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black uppercase opacity-60 hover:opacity-100 p-0 h-auto"
                        onClick={() => setFilters({ status: 'all', search: '', date_from: '', date_to: '', network: 'all' })}
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t("common.clearFilters") || "Réinitialiser les filtres"}
                    </Button>
                )}
            </div>

            <div className="space-y-4 px-1">
                {isLoading ? (
                    <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin opacity-20" />
                        <p className="font-bold opacity-40">{t("common.loading")}</p>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <FileSpreadsheet className="w-12 h-12 opacity-20" />
                        </div>
                        <p className="font-bold opacity-40">{t("bulkPayment.emptyHistory")}</p>
                    </div>
                ) : (
                    batches.map((batch) => (
                        <div
                            key={batch.uid}
                            onClick={() => handleViewSummary(batch)}
                            className={`p-5 rounded-[2rem] ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-lg'} hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden group border border-transparent hover:border-blue-500/20`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${batch.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                        batch.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        <FileSpreadsheet className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-lg truncate leading-tight">{t("bulkPayment.batchNumber")}{batch.uid.slice(-6)}</p>
                                        <p className="text-xs opacity-50 font-medium">
                                            {new Date(batch.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <Badge className={`font-black text-[10px] uppercase border tracking-tighter ${batch.status === 'completed' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                                    batch.status === 'failed' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                                        'text-blue-500 bg-blue-500/10 border-blue-500/20'
                                    }`}>
                                    {batch.status.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1">{t("bulkPayment.totalCount")}</p>
                                    <p className="font-black text-xl">{batch.total_count}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-right">
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1">{t("bulkPayment.totalAmount")}</p>
                                    <p className="font-black text-xl text-blue-600 dark:text-blue-400">{formatAmount(batch.total_amount)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                                    <span>{batch.succeeded_count} {t("common.success")}</span>
                                    <span>{Math.round(batch.progress_percent)}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${batch.status === 'failed' ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${batch.progress_percent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                        variant="outline" size="icon"
                        className="rounded-full h-12 w-12 border-0 shadow-lg bg-white dark:bg-gray-800"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="px-6 py-3 rounded-full bg-white dark:bg-gray-800 shadow-lg font-black text-sm">
                        {currentPage} / {totalPages}
                    </div>
                    <Button
                        variant="outline" size="icon"
                        className="rounded-full h-12 w-12 border-0 shadow-lg bg-white dark:bg-gray-800"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>
    )

    // --- Create View ---
    const renderCreateView = () => {
        const startIndex = (createPage - 1) * rowsPerPage
        const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage)
        const totalCreatePages = Math.ceil(rows.length / rowsPerPage)

        return (
            <div className="space-y-6 pb-32">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-white dark:bg-gray-800 shadow-md transition-all active:scale-90" onClick={() => setViewState('list')}>
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black">{t("bulkPayment.createNew")}</h1>
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">{t("bulkPayment.step1")}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 px-1">
                    {networks.length === 0 ? (
                        <div className={`p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-6 border-0 ${resolvedTheme === 'dark' ? 'bg-gray-800/40' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
                            <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tight">{t("common.notAuthorized")}</h3>
                                <p className="text-sm font-bold opacity-40 max-w-xs mx-auto leading-relaxed">
                                    {t("bulkPayment.noNetworksDesc")}
                                </p>
                            </div>
                            <Button
                                onClick={() => setViewState('list')}
                                className="rounded-2xl px-8 h-12 font-black bg-gray-900 dark:bg-white dark:text-gray-900"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t("common.back")}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Import Section */}
                            <div
                                className={`p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${resolvedTheme === 'dark' ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500/50' : 'border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-500/50 shadow-sm'
                                    }`}
                                onClick={() => document.getElementById('excel-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="excel-upload"
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                />
                                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-lg">{t("bulkPayment.importExcel")}</p>
                                    <p className="text-xs opacity-50 font-medium tracking-tight">Supporte .xlsx, .xls, .csv</p>
                                </div>
                            </div>
                        </>
                    )}

                    {networks.length > 0 && (
                        <div className="flex items-center gap-2 py-2">
                            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-[10px] font-black uppercase opacity-30 px-2">{t("bulkPayment.orManualEntry")}</span>
                            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-700" />
                        </div>
                    )}

                    {/* Transaction List */}
                    {networks.length > 0 && (
                        <>
                            <div className="space-y-4">
                                {paginatedRows.map((row, idx) => (
                                    <div
                                        key={row.id}
                                        className={`p-6 rounded-[2rem] relative border transition-all ${row.errors.recipient_phone || row.errors.amount ? 'border-red-500/30 bg-red-500/5' :
                                            resolvedTheme === 'dark' ? 'bg-gray-800 border-transparent shadow-none' : 'bg-white shadow-xl shadow-gray-200/50 border-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs">
                                                    {startIndex + idx + 1}
                                                </div>
                                                <span className="font-bold text-sm tracking-tight">Transaction</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-red-500 hover:bg-red-500/10"
                                                onClick={() => removeRow(row.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase opacity-40 ml-2">{t("bulkPayment.recipient")}</label>
                                                <div className="relative">
                                                    <Input
                                                        value={row.recipient_phone}
                                                        onChange={(e) => updateRow(row.id, 'recipient_phone', e.target.value)}
                                                        placeholder="07 08 09 10 11"
                                                        className={`rounded-2xl h-12 border-0 bg-gray-50 dark:bg-gray-700/50 font-bold ${row.errors.recipient_phone ? "ring-2 ring-red-500/50" : "focus:ring-2 focus:ring-blue-500"}`}
                                                    />
                                                </div>
                                                {row.errors.recipient_phone && (
                                                    <p className="text-[10px] text-red-500 font-bold ml-2">{row.errors.recipient_phone}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase opacity-40 ml-2">{t("bulkPayment.amount")}</label>
                                                <div className="relative">
                                                    <Input
                                                        value={row.amount}
                                                        onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                                        placeholder="1000"
                                                        className={`rounded-2xl h-12 border-0 bg-gray-50 dark:bg-gray-700/50 font-bold pr-12 ${row.errors.amount ? "ring-2 ring-red-500/50" : "focus:ring-2 focus:ring-blue-500"}`}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30">FCFA</span>
                                                </div>
                                                {row.errors.amount && (
                                                    <p className="text-[10px] text-red-500 font-bold ml-2">{row.errors.amount}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase opacity-40 ml-2">{t("bulkPayment.network")}</label>
                                                <Select
                                                    value={row.network_uid}
                                                    onValueChange={(val) => updateRow(row.id, 'network_uid', val)}
                                                >
                                                    <SelectTrigger className={`rounded-2xl h-12 border-0 bg-gray-50 dark:bg-gray-700/50 font-bold ${row.errors.network_uid ? "ring-2 ring-red-500/50" : ""}`}>
                                                        <SelectValue placeholder={t("bulkPayment.network")} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl p-2">
                                                        {networks.map(n => (
                                                            <SelectItem key={n.uid} value={n.uid} className="rounded-xl my-1">
                                                                <div className="flex items-center gap-3">
                                                                    {n.image && <img src={n.image} className="w-5 h-5 rounded-full shadow-sm" />}
                                                                    <span className="font-bold">{n.nom}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {row.errors.network_uid && (
                                                    <p className="text-[10px] text-red-500 font-bold ml-2">{row.errors.network_uid}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase opacity-40 ml-2">{t("bulkPayment.description")}</label>
                                                <Input
                                                    value={row.objet}
                                                    onChange={(e) => updateRow(row.id, 'objet', e.target.value)}
                                                    placeholder="Ex: Salaire Mars"
                                                    className="rounded-2xl h-12 border-0 bg-gray-50 dark:bg-gray-700/50 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Row & Pagination */}
                            <div className="flex flex-col gap-6 pt-4">
                                <Button
                                    variant="outline"
                                    className="rounded-2xl h-14 border-2 border-dashed border-blue-500/30 text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all font-black"
                                    onClick={addRow}
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    {t("bulkPayment.manualEntry")}
                                </Button>

                                {totalCreatePages > 1 && (
                                    <div className="flex items-center justify-center gap-3">
                                        <Button
                                            variant="ghost" size="icon"
                                            className="rounded-full h-10 w-10 bg-white dark:bg-gray-800 shadow-sm"
                                            disabled={createPage === 1}
                                            onClick={() => setCreatePage(p => p - 1)}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm font-black opacity-40 uppercase tracking-widest">{createPage} / {totalCreatePages}</span>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="rounded-full h-10 w-10 bg-white dark:bg-gray-800 shadow-sm"
                                            disabled={createPage === totalCreatePages}
                                            onClick={() => setCreatePage(p => p + 1)}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Sticky Bottom Bar */}
                {networks.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-50 animate-in slide-in-from-bottom duration-500">
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
                            <div className="hidden sm:block">
                                <p className="text-[10px] font-black uppercase opacity-40">{t("bulkPayment.totalAmount")}</p>
                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatAmount(totals.amount)} FCFA</p>
                            </div>
                            <div className="sm:hidden flex-1">
                                <p className="text-xs font-black opacity-40 truncate">{totals.count} transactions</p>
                                <p className="text-lg font-black text-blue-600">{formatAmount(totals.amount)}</p>
                            </div>
                            <Button
                                disabled={!isFormValid || isLoading}
                                onClick={() => setConfirmDialogOpen(true)}
                                className="h-14 px-10 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/40 transition-all active:scale-95 flex-1 sm:flex-none"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CircleCheck className="w-6 h-6 mr-2" />}
                                {t("common.continue")}
                            </Button>
                        </div>
                    </div>
                )}

                <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                    <DialogContent className="rounded-[3rem] border-0 p-0 max-w-[95vw] sm:max-w-xl overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-gray-950 shadow-2xl">
                        {/* Premium Header with Gradient Background */}
                        <div className="relative pt-10 pb-6 px-8 flex-shrink-0 bg-gradient-to-b from-blue-500/5 to-transparent text-center">
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none" />

                            <div className="relative z-10 space-y-4">
                                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-4 text-white shadow-xl shadow-blue-500/30">
                                    <Activity className="w-10 h-10" />
                                </div>
                                <DialogTitle className="text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">{t("bulkPayment.confirmTitle")}</DialogTitle>
                                <DialogDescription className="font-bold text-base leading-relaxed text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                    {t("bulkPayment.confirmDesc", { count: totals.count, amount: formatAmount(totals.amount) })}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col mx-8 my-2 border border-blue-500/10 dark:border-blue-400/10 rounded-[2.5rem] bg-blue-50/20 dark:bg-blue-400/5 backdrop-blur-sm">
                            {/* List Header */}
                            <div className="flex items-center justify-between px-8 py-5 border-b border-blue-500/10 dark:border-blue-400/10 bg-white/60 dark:bg-gray-900/60 flex-shrink-0">
                                <span className="text-xs font-black uppercase tracking-widest text-blue-600/60 dark:text-blue-400/60">{t("bulkPayment.batchTransactions")}</span>
                                <Badge variant="outline" className="font-black text-[10px] py-1 px-3 rounded-full bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800">
                                    {totals.count} {t("bulkPayment.items")}
                                </Badge>
                            </div>

                            {/* Scrollable List */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 custom-scrollbar">
                                {rows.filter(r => r.recipient_phone && r.amount && r.network_uid).map((row, i) => {
                                    const network = networks.find(n => n.uid === row.network_uid)
                                    return (
                                        <div key={row.id} className="p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-transparent hover:border-blue-500/30 transition-all duration-300">
                                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-[10px] font-black text-gray-400">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </div>
                                                    <p className="font-black text-sm sm:text-base text-gray-900 dark:text-white tracking-tight">{row.recipient_phone}</p>
                                                </div>
                                                <p className="font-black text-sm sm:text-lg text-blue-600 dark:text-blue-400">{formatAmount(row.amount)} <span className="text-[8px] opacity-40">FCFA</span></p>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                                <div className="flex items-center gap-2">
                                                    {network?.image ? (
                                                        <img src={network.image} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full" />
                                                    ) : (
                                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gray-200" />
                                                    )}
                                                    <span className="text-[10px] font-black uppercase opacity-60 truncate max-w-[80px] sm:max-w-none">{network?.nom || t("bulkPayment.network")}</span>
                                                </div>
                                                {row.objet && (
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                                        <FileText className="w-3 h-3 opacity-20 flex-shrink-0" />
                                                        <p className="text-[10px] font-bold opacity-60 truncate">{row.objet}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="px-6 py-4 sm:px-8 sm:py-6 border-t border-blue-500/10 dark:border-blue-400/10 bg-gradient-to-r from-blue-600 to-blue-500 flex-shrink-0">
                                <div className="flex justify-between items-center text-white">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("bulkPayment.totalAmount")}</span>
                                    <div className="text-right">
                                        <span className="text-xl sm:text-2xl font-black">{formatAmount(totals.amount)}</span>
                                        <span className="text-xs font-black opacity-70 ml-2">FCFA</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons with Satisfying Layout */}
                        <DialogFooter className="p-6 sm:p-8 pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-shrink-0 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900">
                            <Button
                                variant="ghost"
                                size="lg"
                                className="rounded-[1.25rem] sm:rounded-[1.5rem] h-14 sm:h-16 font-black flex-1 w-full sm:w-auto text-gray-400 hover:text-gray-900 transition-colors"
                                onClick={() => setConfirmDialogOpen(false)}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="rounded-[1.25rem] sm:rounded-[1.5rem] h-14 sm:h-16 font-black flex-1 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-2xl shadow-blue-600/40 transition-all active:scale-95"
                            >
                                {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                                {t("bulkPayment.submit")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // --- Summary View ---
    const handleViewSummary = async (batch: BulkBatch) => {
        setSelectedBatch(batch)
        setViewState('summary')
        if (!accessToken) return
        setBatchDetailLoading(true)
        try {
            // Refresh summary info
            const freshBatch = await bulkPaymentService.getBatchSummary(accessToken, batch.uid)
            setSelectedBatch(freshBatch)
        } catch (error) {
            console.error(error)
        } finally {
            setBatchDetailLoading(false)
        }
    }

    const renderSummaryView = () => {
        if (!selectedBatch) return null

        return (
            <div className="space-y-6 pb-12">
                <div className="flex items-center gap-4 px-1">
                    <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-white dark:bg-gray-800 shadow-md transition-all active:scale-90" onClick={() => setViewState('list')}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black">{t("bulkPayment.summary")}</h1>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">ID: {selectedBatch.uid.slice(-12)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 px-1">
                    <div className="p-6 rounded-[2rem] bg-blue-600 text-white shadow-xl shadow-blue-500/20 col-span-2">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-1">{t("bulkPayment.totalAmount")}</p>
                        <p className="text-3xl font-black">{formatAmount(selectedBatch.total_amount)} <span className="text-sm opacity-60">FCFA</span></p>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-white dark:bg-gray-800 shadow-lg border border-transparent">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t("bulkPayment.totalCount")}</p>
                        <p className="text-2xl font-black">{selectedBatch.total_count}</p>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-white dark:bg-gray-800 shadow-lg border border-transparent">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center mb-3">
                            <CircleCheck className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t("bulkPayment.successCount")}</p>
                        <p className="text-2xl font-black text-green-500">{selectedBatch.succeeded_count}</p>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-white dark:bg-gray-800 shadow-lg border border-transparent">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3">
                            <CircleX className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t("bulkPayment.failedCount")}</p>
                        <p className="text-2xl font-black text-red-500">{selectedBatch.failed_count}</p>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-white dark:bg-gray-800 shadow-lg border border-transparent">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t("bulkPayment.durationLabel")}</p>
                        <p className="text-2xl font-black">{selectedBatch.processing_duration || 0}s</p>
                    </div>
                </div>

                <div className={`p-8 rounded-[2.5rem] ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-lg uppercase tracking-tight">{t("bulkPayment.progress")}</h3>
                        <Badge className={`font-black text-[10px] py-1 px-3 rounded-full ${selectedBatch.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                            {selectedBatch.status.toUpperCase()}
                        </Badge>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between text-[10px] font-black uppercase opacity-40">
                            <span>{t("bulkPayment.completedPercent", { percent: Math.round(selectedBatch.progress_percent) }).toUpperCase()}</span>
                            <span>{selectedBatch.processed_count} / {selectedBatch.total_count}</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden p-[2px]">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                style={{ width: `${selectedBatch.progress_percent}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold opacity-40 uppercase text-[10px] tracking-widest">{t("bulkPayment.date")}</span>
                            <span className="font-black">{new Date(selectedBatch.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold opacity-40 uppercase text-[10px] tracking-widest">{t("bulkPayment.completedAtLabel").toUpperCase()}</span>
                            <span className="font-black">{selectedBatch.completed_at ? new Date(selectedBatch.completed_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="px-1 pt-4">
                    <Button
                        onClick={() => handleViewTransactions(selectedBatch.uid)}
                        className="w-full h-16 rounded-[1.5rem] bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 font-black text-lg shadow-xl transition-all active:scale-95"
                    >
                        <Activity className="w-6 h-6 mr-3" />
                        {t("bulkPayment.viewTransactions")}
                    </Button>
                </div>
            </div>
        )
    }

    // --- Transactions View ---
    const handleViewTransactions = async (uid: string) => {
        setViewState('transactions')
        if (!accessToken) return
        setBatchDetailLoading(true)
        try {
            const response = await bulkPaymentService.getBatchTransactions(accessToken, uid)
            setBatchTransactions(response.results)
        } catch (error) {
            toast.error(t("common.error"))
        } finally {
            setBatchDetailLoading(false)
        }
    }

    const renderTransactionsView = () => (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-4 px-1">
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-white dark:bg-gray-800 shadow-md transition-all active:scale-90" onClick={() => setViewState('summary')}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black">{t("bulkPayment.details")}</h1>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{t("bulkPayment.batchLabel")}: {selectedBatch?.uid.slice(-12)}</p>
                </div>
            </div>

            <div className="space-y-4 px-1">
                {batchDetailLoading ? (
                    <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin opacity-20" />
                        <p className="font-bold opacity-40">{t("bulkPayment.loadingTransactions")}</p>
                    </div>
                ) : batchTransactions.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Activity className="w-12 h-12 opacity-20" />
                        </div>
                        <p className="font-bold opacity-40">{t("bulkPayment.noTransactionsFound")}</p>
                    </div>
                ) : batchTransactions.map((tx) => (
                    <div
                        key={tx.uid}
                        className={`p-5 rounded-[2rem] ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-lg'} transition-all relative overflow-hidden group border border-transparent`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${tx.status === 'success' ? 'bg-green-500/10 text-green-500' :
                                    tx.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                        'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {tx.status === 'success' ? <CircleCheck className="w-6 h-6" /> :
                                        tx.status === 'failed' ? <CircleX className="w-6 h-6" /> :
                                            <Clock className="w-6 h-6" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-lg truncate leading-tight">{tx.recipient_phone}</p>
                                    <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">{tx.network.nom}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-xl">{formatAmount(tx.amount)}</p>
                                <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">FCFA</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 opacity-30" />
                                <p className="text-[10px] font-bold opacity-50 truncate">{tx.reference || t("bulkPayment.noReference")}</p>
                            </div>
                            <Badge className={`font-black text-[10px] uppercase border tracking-tighter ${tx.status === 'success' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                                tx.status === 'failed' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                                    'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                                }`}>
                                {tx.status.toUpperCase()}
                            </Badge>
                        </div>
                        {tx.error_message && (
                            <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                                <p className="text-[10px] text-red-500 font-bold leading-tight">{tx.error_message}</p>
                            </div>
                        )}
                        {tx.objet && (
                            <p className="mt-2 text-xs font-medium opacity-50 pl-1">{tx.objet}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className={`min-h-screen pt-12 safe-area-inset-top`}>
            <div className="px-4 py-8 max-w-7xl mx-auto">
                {viewState === 'list' && renderListView()}
                {viewState === 'create' && renderCreateView()}
                {viewState === 'summary' && renderSummaryView()}
                {viewState === 'transactions' && renderTransactionsView()}
            </div>
        </div>
    )
}
