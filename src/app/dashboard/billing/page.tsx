"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import NotificationCenter from "../../components/NotificationCenter";
import {
    ChevronLeft, CreditCard, AlertTriangle, CheckCircle2,
    Clock, FileText, TrendingUp, Wallet, CalendarDays, ExternalLink, Loader2
} from "lucide-react";

function StatusBadge({ status }: { status: "pending" | "paid" | "overdue" }) {
    const styles = {
        paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
        pending: "bg-amber-50  text-amber-700  border border-amber-200",
        overdue: "bg-red-50    text-red-700    border border-red-200",
    };
    const icons = {
        paid:    <CheckCircle2 size={11} />,
        pending: <Clock size={11} />,
        overdue: <AlertTriangle size={11} />,
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${styles[status]}`}>
            {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function formatPula(cents: number) {
    return `P ${(cents / 100).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysLabel(dueDate: string) {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
    if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, color: "text-red-600" };
    if (diff === 0) return { text: "Due today",                color: "text-red-500" };
    if (diff <= 7)  return { text: `Due in ${diff}d`,          color: "text-amber-600" };
    return { text: `Due in ${diff}d`,                          color: "text-slate-500" };
}

export default function DealerBillingPage() {
    const router = useRouter();
    const { organization } = useOrganization();

    const dealership = useQuery(
        api.dealerships.getByClerkOrgId,
        organization ? { clerkOrgId: organization.id } : "skip"
    );

    const billing = useQuery(
        api.billing.getDealerBillingSummary,
        dealership ? { dealerId: dealership._id } : "skip"
    );

    const isLoading = dealership === undefined || dealership === null || billing === undefined;

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">No dealership organisation found.</p>
            </div>
        );
    }

    if (isLoading || !dealership) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const { pending, overdue, paid, totalOwed, totalPaid, upcoming, invoices } = billing;
    const accountStatus = dealership.accountStatus ?? "active";
    const isFrozen = accountStatus === "frozen";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-5 lg:px-8 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Billing & Payments</h1>
                            <p className="text-xs text-slate-400 font-medium">{organization.name}</p>
                        </div>
                    </div>
                    <NotificationCenter recipientId={dealership._id} />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-8">

                {/* Frozen Account Banner */}
                {isFrozen && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-black text-red-800 text-sm">Account Suspended</p>
                            <p className="text-red-600 text-sm mt-0.5">
                                Your account has been frozen due to outstanding payments. Please settle your balance to restore full access.
                            </p>
                        </div>
                    </div>
                )}

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Wallet className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalOwed > 0 ? "text-red-600" : "text-slate-900"}`}>
                                {formatPula(totalOwed)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Paid</p>
                            <p className="text-2xl font-black text-slate-900 pt-0.5">{formatPula(totalPaid)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-red-500" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue</p>
                            <p className={`text-2xl font-black pt-0.5 ${overdue.length > 0 ? "text-red-600" : "text-slate-900"}`}>
                                {overdue.length}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <FileText className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending</p>
                            <p className="text-2xl font-black text-slate-900 pt-0.5">{pending.length}</p>
                        </div>
                    </div>
                </div>

                {/* Subscription / Account Status Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isFrozen ? "bg-red-50" : "bg-primary-50"}`}>
                            <CreditCard className={isFrozen ? "text-red-500" : "text-primary-600"} size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${isFrozen ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                                <p className={`text-lg font-black ${isFrozen ? "text-red-700" : "text-slate-900"}`}>
                                    {isFrozen ? "Frozen" : "Active"}
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Client ID: <span className="font-bold text-slate-600">{dealership.clientCustomId ?? "—"}</span>
                            </p>
                        </div>
                    </div>

                    {upcoming && (
                        <div className="bg-slate-50 rounded-xl px-5 py-3 border border-slate-100 text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 justify-end">
                                <CalendarDays size={10} /> Next Payment
                            </p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">{formatPula(upcoming.amount)}</p>
                            <p className={`text-xs font-bold mt-0.5 ${daysLabel(upcoming.dueDate).color}`}>
                                {daysLabel(upcoming.dueDate).text}
                            </p>
                            <p className="text-[10px] text-slate-400">{upcoming.invoiceNumber}</p>
                        </div>
                    )}
                </div>

                {/* Pending / Overdue Invoices */}
                {[...overdue, ...pending].length > 0 && (
                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Outstanding Invoices</h2>
                        <div className="space-y-3">
                            {[...overdue, ...pending].map(inv => {
                                const dl = daysLabel(inv.dueDate);
                                return (
                                    <div
                                        key={inv._id}
                                        className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            inv.status === "overdue" ? "border-red-200" : "border-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                inv.status === "overdue" ? "bg-red-50" : "bg-amber-50"
                                            }`}>
                                                <FileText size={16} className={inv.status === "overdue" ? "text-red-500" : "text-amber-600"} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">{inv.invoiceNumber}</p>
                                                <p className={`text-xs font-bold mt-0.5 ${dl.color}`}>{dl.text}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <StatusBadge status={inv.status} />
                                            <span className="text-lg font-black text-slate-900">{formatPula(inv.amount)}</span>
                                            <a
                                                href={inv.externalPdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                                            >
                                                View <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Payment History */}
                <section>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Payment History</h2>
                    {invoices.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                <FileText className="text-slate-300" size={28} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900">No invoices yet</p>
                                <p className="text-sm text-slate-400 mt-1">Your billing history will appear here once invoices are generated.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</th>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[...invoices].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(inv => (
                                        <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                                            <td className="px-5 py-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}</td>
                                            <td className="px-5 py-4 font-black text-slate-900">{formatPula(inv.amount)}</td>
                                            <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                                            <td className="px-5 py-4 text-right">
                                                <a
                                                    href={inv.externalPdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                                                >
                                                    PDF <ExternalLink size={10} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
