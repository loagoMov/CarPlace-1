"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import NotificationCenter from "../../components/NotificationCenter";
import {
    FileText, Users, Activity, CheckCircle2, AlertTriangle,
    FileSpreadsheet, PlusCircle, ChevronLeft, CreditCard,
    Clock, TrendingUp, Building2, ChevronDown, ChevronUp,
    ExternalLink, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

type EvaluatedRow = {
    confidence: "PERFECT" | "FUZZY" | "NONE";
    amount: number;
    referenceString: string;
    matchedDealerId?: string | null;
    matchedInvoiceId?: string | null;
};

function formatPula(cents: number) {
    return `P ${(cents / 100).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function HealthBadge({ health }: { health: "good" | "warning" | "critical" }) {
    const map = {
        good:     { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Good standing" },
        warning:  { cls: "bg-amber-50  text-amber-700  border-amber-200",     label: "Due soon" },
        critical: { cls: "bg-red-50    text-red-700    border-red-200",       label: "Overdue" },
    };
    const { cls, label } = map[health];
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${health === "good" ? "bg-emerald-500" : health === "warning" ? "bg-amber-500" : "bg-red-500"}`} />
            {label}
        </span>
    );
}

export default function AdminBillingPage() {
    const router = useRouter();
    const [csvInput, setCsvInput] = useState("");
    const [evaluatedRows, setEvaluatedRows] = useState<EvaluatedRow[]>([]);
    const [selectedDealerIds, setSelectedDealerIds] = useState<{ [k: number]: string }>({});
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<{ [k: number]: string }>({});
    const [expandedDealerId, setExpandedDealerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"roster" | "parser">("roster");

    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [formDealerId, setFormDealerId] = useState("");
    const [formAmount, setFormAmount] = useState("");
    const [formDueDate, setFormDueDate] = useState("");
    const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

    const pendingInvoices = useQuery(api.billing.getPendingInvoices) || [];
    const dealers = useQuery(api.billing.getAllDealers) || [];
    const rosterData = useQuery(api.billing.getAllDealersBillingSummary) || [];

    const processBankStatement = useMutation(api.billing.processBankStatement);
    const linkManualAliasToDealer = useMutation(api.billing.linkManualAliasToDealer);
    const markInvoiceAsPaid = useMutation(api.billing.markInvoiceAsPaid);
    const pushNotification = useMutation(api.notifications.pushNotification);
    const createOfficialInvoice = useMutation(api.billing.createOfficialInvoice);
    const manualUpdateAccountStatus = useMutation(api.billing.manualUpdateAccountStatus);

    const handleCreateInvoice = async () => {
        if (!formDealerId || !formAmount || !formDueDate) return;
        setIsSubmittingInvoice(true);
        try {
            const amountCents = Math.round(parseFloat(formAmount) * 100);
            await createOfficialInvoice({
                dealerId: formDealerId as Id<"dealerships">,
                amount: amountCents,
                dueDate: new Date(formDueDate).toISOString(),
            });
            alert("Invoice created successfully and notification sent to the dealership.");
            setFormDealerId("");
            setFormAmount("");
            setFormDueDate("");
            setShowInvoiceForm(false);
        } catch (err: any) {
            alert(err.message || "Failed to create invoice.");
        } finally {
            setIsSubmittingInvoice(false);
        }
    };

    const isSyncConnected = rosterData !== undefined;
    const totalOverdue = rosterData.filter(r => r.health === "critical").length;
    const totalWarning = rosterData.filter(r => r.health === "warning").length;
    const totalBalanceDue = rosterData.reduce((s, r) => s + r.totalOwed, 0);

    // ─── CSV Parser handlers ─────────────────────────────────────────────────

    const handleProcessCsv = async () => {
        try {
            const lines = csvInput.split("\n").filter(l => l.trim() !== "");
            const rows = lines.map(line => {
                const [amountStr, ...refParts] = line.split(",");
                return { amount: Math.round(parseFloat(amountStr.trim()) * 100), referenceString: refParts.join(",").trim() };
            });
            const result = await processBankStatement({ rows });
            setEvaluatedRows(result);
            setCsvInput("");
        } catch {
            alert("Failed to process bank statement. Ensure format is 'Amount,Reference' per line.");
        }
    };

    const handleConfirmMatch = async (index: number) => {
        const row = evaluatedRows[index];
        if (!row.matchedInvoiceId) return;
        await markInvoiceAsPaid({ invoiceId: row.matchedInvoiceId as Id<"invoices"> });
        if (row.matchedDealerId) {
            await pushNotification({
                recipientId: row.matchedDealerId as Id<"dealerships">,
                type: "billing",
                title: "Payment Received",
                message: `Your payment of ${formatPula(row.amount)} has been received and your invoice is now marked as paid.`,
            });
        }
        setEvaluatedRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleManualLink = async (index: number) => {
        const dealerId = selectedDealerIds[index];
        if (!dealerId) { alert("Please select a dealer first."); return; }
        const row = evaluatedRows[index];
        const result = await linkManualAliasToDealer({
            dealerId: dealerId as Id<"dealerships">,
            unmatchedReference: row.referenceString,
            amount: row.amount,
        });
        if (result.success) {
            await pushNotification({
                recipientId: dealerId as Id<"dealerships">,
                type: "billing",
                title: "Payment Manually Reconciled",
                message: `Your payment of ${formatPula(row.amount)} was successfully located and reconciled.`,
            });
            setEvaluatedRows(prev => prev.filter((_, i) => i !== index));
        } else {
            alert(result.message);
        }
    };

    const handleManualMarkPaid = async (index: number) => {
        const invoiceId = selectedInvoiceIds[index];
        if (!invoiceId) { alert("Please select an invoice to mark as paid."); return; }
        await markInvoiceAsPaid({ invoiceId: invoiceId as Id<"invoices"> });
        await pushNotification({
            recipientId: "admin",
            type: "billing",
            title: "Invoice Manually Marked Paid",
            message: "An invoice was manually marked as paid by an admin.",
        });
        setEvaluatedRows(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-5 lg:px-8 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <CreditCard size={20} className="text-primary-600" /> Billing Administration
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Manage dealer payments & reconciliation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full">
                            <span className={`w-2 h-2 rounded-full ${isSyncConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            {isSyncConnected ? "Live" : "Disconnected"}
                        </div>
                        <NotificationCenter recipientId="admin" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <Building2 className="text-primary-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Dealers</p>
                            <p className="text-2xl font-black text-slate-900 pt-0.5">{rosterData.length}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-red-500" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalOverdue > 0 ? "text-red-600" : "text-slate-900"}`}>{totalOverdue}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Clock className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Soon</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalWarning > 0 ? "text-amber-600" : "text-slate-900"}`}>{totalWarning}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Owed</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalBalanceDue > 0 ? "text-red-600" : "text-slate-900"}`}>{formatPula(totalBalanceDue)}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white border border-slate-100 shadow-sm rounded-2xl p-1 w-fit gap-1">
                    {(["roster", "parser"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all capitalize ${
                                activeTab === tab
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {tab === "roster" ? "Dealer Roster" : "Statement Parser"}
                        </button>
                    ))}
                </div>

                {/* ── ROSTER TAB ──────────────────────────────────────────────────────── */}
                {activeTab === "roster" && (
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="font-black text-slate-900">Dealer Payment Roster</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                                    className="flex items-center gap-1.5 text-xs font-black bg-primary-600 text-white px-3 py-1.5 rounded-xl hover:bg-primary-700 transition active:scale-95 cursor-pointer shadow-sm"
                                >
                                    <PlusCircle size={14} /> Issue Invoice
                                </button>
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                    {rosterData.length} dealers
                                </span>
                            </div>
                        </div>

                        {showInvoiceForm && (
                            <div className="p-6 bg-slate-50 border-b border-slate-150 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Select Dealership</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={formDealerId}
                                        onChange={e => setFormDealerId(e.target.value)}
                                    >
                                        <option value="">Choose dealership...</option>
                                        {dealers.map(d => (
                                            <option key={d._id} value={d._id}>{d.name} ({d.clientCustomId ?? "No custom ID"})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Amount (Pula)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. 1500"
                                        value={formAmount}
                                        onChange={e => setFormAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={formDueDate}
                                        onChange={e => setFormDueDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreateInvoice}
                                        disabled={isSubmittingInvoice || !formDealerId || !formAmount || !formDueDate}
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer text-center"
                                    >
                                        {isSubmittingInvoice ? "Processing..." : "Create Invoice"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowInvoiceForm(false);
                                            setFormDealerId("");
                                            setFormAmount("");
                                            setFormDueDate("");
                                        }}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {rosterData.length === 0 ? (
                            <div className="p-16 flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                                    <Users className="text-slate-300" size={28} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">No dealers yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Dealer billing records will appear here once created.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {rosterData.map(row => {
                                    const isExpanded = expandedDealerId === row.dealer._id;
                                    const nextDue = row.nextInvoice
                                        ? new Date(row.nextInvoice.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })
                                        : "—";

                                    return (
                                        <div key={row.dealer._id}>
                                            {/* Roster Row */}
                                            <div
                                                className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                onClick={() => setExpandedDealerId(isExpanded ? null : row.dealer._id)}
                                            >
                                                {/* Dealer Info */}
                                                <div className="flex items-center gap-3 min-w-[220px]">
                                                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                                                        <Building2 size={16} className="text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm leading-tight">{row.dealer.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{row.dealer.clientCustomId ?? "No ID"}</p>
                                                    </div>
                                                </div>

                                                {/* Metrics */}
                                                <div className="flex flex-wrap items-center gap-6 flex-1 text-sm">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                                                        <p className={`font-black mt-0.5 ${row.totalOwed > 0 ? "text-red-600" : "text-slate-900"}`}>
                                                            {formatPula(row.totalOwed)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Due</p>
                                                        <p className="font-bold text-slate-700 mt-0.5">{nextDue}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Left</p>
                                                        <p className={`font-bold mt-0.5 ${
                                                            row.daysUntilDue === null ? "text-slate-400" :
                                                            row.daysUntilDue < 0 ? "text-red-600" :
                                                            row.daysUntilDue <= 7 ? "text-amber-600" : "text-slate-700"
                                                        }`}>
                                                            {row.daysUntilDue === null
                                                                ? "—"
                                                                : row.daysUntilDue < 0
                                                                    ? `${Math.abs(row.daysUntilDue)}d overdue`
                                                                    : row.daysUntilDue === 0
                                                                        ? "Today"
                                                                        : `${row.daysUntilDue}d left`}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending</p>
                                                        <p className="font-bold text-slate-700 mt-0.5">{row.pending.length} invoice{row.pending.length !== 1 ? "s" : ""}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Paid</p>
                                                        <p className="font-bold text-emerald-700 mt-0.5">{formatPula(row.totalPaid)}</p>
                                                    </div>
                                                </div>

                                                {/* Health + expand */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <HealthBadge health={row.health} />
                                                    {isExpanded
                                                        ? <ChevronUp size={16} className="text-slate-400" />
                                                        : <ChevronDown size={16} className="text-slate-400" />
                                                    }
                                                </div>
                                            </div>

                                            {/* Expanded Invoice Detail */}
                                            {isExpanded && (
                                                <div className="bg-slate-50 border-t border-slate-100 px-6 py-5 space-y-6">
                                                    {/* Manual Account Status Controls */}
                                                    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status Override</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${
                                                                    row.dealer.accountStatus === "frozen" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                                                                }`} />
                                                                <span className="font-bold text-slate-800 text-sm">
                                                                    {row.dealer.accountStatus === "frozen" ? "Suspended (Frozen)" : "Active"}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 mt-1">
                                                                Manually freeze or activate the lead generation features of this dealer.
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const nextStatus = row.dealer.accountStatus === "frozen" ? "active" : "frozen";
                                                                const verb = nextStatus === "frozen" ? "pause & freeze" : "reactivate";
                                                                if (confirm(`Are you sure you want to ${verb} ${row.dealer.name}'s account?`)) {
                                                                    try {
                                                                        await manualUpdateAccountStatus({
                                                                            dealerId: row.dealer._id,
                                                                            status: nextStatus,
                                                                        });
                                                                    } catch (err: any) {
                                                                        alert(err.message || "Failed to update account status.");
                                                                    }
                                                                }
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95 ${
                                                                row.dealer.accountStatus === "frozen"
                                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    : "bg-rose-600 hover:bg-rose-700 text-white"
                                                            }`}
                                                        >
                                                            {row.dealer.accountStatus === "frozen" ? "Reactivate Account" : "Pause Account completely"}
                                                        </button>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Invoice History</p>
                                                    {[...row.overdue, ...row.pending, ...row.paid].length === 0 ? (
                                                        <p className="text-sm text-slate-400">No invoices on record.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {[...row.overdue, ...row.pending, ...row.paid]
                                                                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                                                                .map(inv => (
                                                                <div key={inv._id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between gap-4 text-sm">
                                                                    <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                                                                    <span className="text-slate-400">{new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                                    <span className="font-black text-slate-900">{formatPula(inv.amount)}</span>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                                                        inv.status === "paid"    ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                        inv.status === "overdue" ? "bg-red-50 text-red-700 border-red-200" :
                                                                                                   "bg-amber-50 text-amber-700 border-amber-200"
                                                                    }`}>
                                                                        {inv.status}
                                                                    </span>
                                                                    {inv.status !== "paid" && (
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                await markInvoiceAsPaid({ invoiceId: inv._id });
                                                                                await pushNotification({
                                                                                    recipientId: row.dealer._id,
                                                                                    type: "billing",
                                                                                    title: "Payment Confirmed",
                                                                                    message: `Invoice ${inv.invoiceNumber} (${formatPula(inv.amount)}) has been manually marked as paid.`,
                                                                                });
                                                                            }}
                                                                            className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                                                                        >
                                                                            <CheckCircle2 size={12} /> Mark Paid
                                                                        </button>
                                                                    )}
                                                                    <a
                                                                        href={`https://carplacebw.vercel.app/invoice?dealer=${encodeURIComponent(row.dealer.name)}&tin=${encodeURIComponent(row.dealer.bursTin || "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={e => e.stopPropagation()}
                                                                        className="flex items-center gap-1 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
                                                                    >
                                                                        <ExternalLink size={10} /> Download Invoice
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* ── PARSER TAB ──────────────────────────────────────────────────────── */}
                {activeTab === "parser" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* CSV Input */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileSpreadsheet className="text-slate-400" size={18} />
                                    <h2 className="font-black text-slate-900">Statement Drop-Zone</h2>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Paste CSV lines. Format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Amount,Reference</code>
                                </p>
                                <textarea
                                    className="w-full h-48 border border-slate-200 rounded-xl p-4 font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder={"500.00,CP-123\n1000.00,EFT FNB John Motors"}
                                    value={csvInput}
                                    onChange={e => setCsvInput(e.target.value)}
                                />
                                <button
                                    onClick={handleProcessCsv}
                                    disabled={!csvInput.trim()}
                                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-black hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    <Activity size={16} /> Evaluate Statement
                                </button>
                            </div>
                        </div>

                        {/* Processing Queue */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h2 className="font-black text-slate-900">Processing Queue</h2>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                        {evaluatedRows.length} items
                                    </span>
                                </div>
                                <div className="p-6 space-y-4">
                                    {evaluatedRows.length === 0 ? (
                                        <div className="text-center py-16 flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                                                <CheckCircle2 className="text-slate-300" size={28} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900">Queue is empty</p>
                                                <p className="text-sm text-slate-400 mt-1">Paste a bank statement CSV to begin evaluation.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        evaluatedRows.map((row, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-5 rounded-xl border flex flex-col gap-4 transition-all ${
                                                    row.confidence === "NONE"
                                                        ? "bg-red-50/30 border-red-100"
                                                        : row.confidence === "FUZZY"
                                                            ? "bg-amber-50/30 border-amber-100"
                                                            : "bg-emerald-50/30 border-emerald-100"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black px-2 py-1 rounded-md ${
                                                        row.confidence === "NONE"    ? "bg-red-100 text-red-700" :
                                                        row.confidence === "FUZZY"   ? "bg-amber-100 text-amber-700" :
                                                                                       "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                        {row.confidence} MATCH
                                                    </span>
                                                    <span className="text-lg font-black text-slate-900">{formatPula(row.amount)}</span>
                                                    <code className="text-xs bg-white/70 border border-slate-200/50 px-2 py-1 rounded text-slate-600 flex-1 truncate">
                                                        {row.referenceString}
                                                    </code>
                                                </div>

                                                {row.confidence === "NONE" ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <select
                                                            className="border border-red-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none flex-1 min-w-[180px]"
                                                            value={selectedDealerIds[idx] || ""}
                                                            onChange={e => setSelectedDealerIds(p => ({ ...p, [idx]: e.target.value }))}
                                                        >
                                                            <option value="">Map to dealership…</option>
                                                            {dealers.map(d => (
                                                                <option key={d._id} value={d._id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none flex-1 min-w-[180px]"
                                                            value={selectedInvoiceIds[idx] || ""}
                                                            onChange={e => setSelectedInvoiceIds(p => ({ ...p, [idx]: e.target.value }))}
                                                        >
                                                            <option value="">Select invoice to mark paid…</option>
                                                            {pendingInvoices.map(inv => (
                                                                <option key={inv._id} value={inv._id}>
                                                                    {inv.invoiceNumber} — {formatPula(inv.amount)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleManualLink(idx)}
                                                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition flex items-center gap-1.5"
                                                        >
                                                            <PlusCircle size={14} /> Map & Pay
                                                        </button>
                                                        <button
                                                            onClick={() => handleManualMarkPaid(idx)}
                                                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-1.5"
                                                        >
                                                            <CheckCircle2 size={14} /> Mark Paid
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConfirmMatch(idx)}
                                                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition flex items-center gap-2 self-start ${
                                                            row.confidence === "PERFECT"
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                : "bg-amber-600 hover:bg-amber-700 text-white"
                                                        }`}
                                                    >
                                                        <CheckCircle2 size={15} /> Confirm & Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
