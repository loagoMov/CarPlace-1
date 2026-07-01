"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
    Bell, X, Flag, AlertTriangle, FileText,
    Trash2, CheckCheck, ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationCenterProps {
    recipientId: string | "admin";
}

export default function NotificationCenter({ recipientId }: NotificationCenterProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [clearingAll, setClearingAll] = useState(false);

    const parsedRecipient =
        recipientId === "admin" ? "admin" : (recipientId as Id<"dealerships">);

    const notifications  = useQuery(api.notifications.getNotifications, { recipientId: parsedRecipient, limit: 25 });
    const unreadCount    = useQuery(api.notifications.getUnreadCount,    { recipientId: parsedRecipient }) || 0;

    const markAsRead            = useMutation(api.notifications.markAsRead);
    const deleteNotification    = useMutation(api.notifications.deleteNotification);
    const deleteAllNotifications = useMutation(api.notifications.deleteAllNotifications);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleDelete = async (id: Id<"notifications">, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingId(id);
        try {
            await deleteNotification({ notificationId: id });
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        setClearingAll(true);
        try {
            await deleteAllNotifications({ recipientId: parsedRecipient });
        } finally {
            setClearingAll(false);
        }
    };

    const handleAction = async (notif: { _id: Id<"notifications">; actionUrl?: string; isRead: boolean }) => {
        if (!notif.isRead) await markAsRead({ notificationId: notif._id });
        if (notif.actionUrl) {
            router.push(notif.actionUrl);
            setIsOpen(false);
        }
    };

    // ── Icon / colour helpers ────────────────────────────────────────────────

    function notifStyle(type: string) {
        switch (type) {
            case "billing": return { badge: "bg-amber-50 text-amber-600 border-amber-200",  icon: <FileText     size={12} /> };
            case "account": return { badge: "bg-rose-50  text-rose-600  border-rose-200",   icon: <AlertTriangle size={12} /> };
            default:        return { badge: "bg-slate-50 text-slate-600 border-slate-200",  icon: <Flag          size={12} /> };
        }
    }

    function ctaLabel(type: string) {
        if (type === "billing") return "View Invoices";
        if (type === "account") return "View Account";
        return "Review";
    }

    const isEmpty = notifications !== undefined && notifications.length === 0;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition duration-200 active:scale-95 cursor-pointer"
                title="Notifications"
            >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full leading-none shadow-sm animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-3 w-[340px] bg-white border border-slate-150 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* Header */}
                        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                            <div>
                                <h3 className="font-black text-slate-800 text-sm tracking-tight">Notifications</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {isEmpty ? "Nothing here" : `${unreadCount} unread · ${notifications?.length ?? 0} total`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {!isEmpty && (
                                    <button
                                        onClick={handleClearAll}
                                        disabled={clearingAll}
                                        className="flex items-center gap-1 text-[11px] font-black text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                                        title="Delete all notifications"
                                    >
                                        <Trash2 size={11} />
                                        {clearingAll ? "Clearing…" : "Clear All"}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                            {notifications === undefined ? (
                                <div className="p-8 text-center">
                                    <div className="flex gap-1 justify-center">
                                        {[0,1,2].map(i => (
                                            <div key={i} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 font-semibold mt-3">Loading…</p>
                                </div>
                            ) : isEmpty ? (
                                /* ── Empty state ───────────────────────── */
                                <div className="py-14 px-6 flex flex-col items-center text-center gap-3">
                                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                                        <CheckCheck className="text-slate-300" size={24} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm">All caught up!</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">No notifications to show.</p>
                                    </div>
                                </div>
                            ) : (
                                /* ── Notification rows ─────────────────── */
                                notifications.map(notif => {
                                    const { badge, icon } = notifStyle(notif.type);
                                    const isDeleting = deletingId === notif._id;

                                    return (
                                        <div
                                            key={notif._id}
                                            className={`group relative flex flex-col gap-2 px-4 py-3.5 transition-colors duration-150 ${
                                                !notif.isRead ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-slate-50/60"
                                            } ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
                                        >
                                            {/* Unread dot */}
                                            {!notif.isRead && (
                                                <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            )}

                                            {/* Top row: icon + meta + delete btn */}
                                            <div className="flex items-start gap-2.5 pl-2">
                                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${badge}`}>
                                                    {icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${badge}`}>
                                                            {notif.type}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-semibold text-slate-400">
                                                                {new Date(notif.createdAt).toLocaleDateString("en-BW", { day: "numeric", month: "short" })}
                                                            </span>
                                                            {/* Individual delete — visible on hover */}
                                                            <button
                                                                onClick={(e) => handleDelete(notif._id, e)}
                                                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                                                                title="Delete notification"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h4 className={`text-xs font-black mt-1 leading-snug ${!notif.isRead ? "text-slate-900" : "text-slate-600"}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action row */}
                                            {notif.actionUrl && (
                                                <div className="flex items-center justify-end gap-2 pl-10">
                                                    <button
                                                        onClick={() => handleAction(notif)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                                                    >
                                                        {ctaLabel(notif.type)}
                                                        <ExternalLink size={9} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(notif._id, e)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                                    >
                                                        <Trash2 size={10} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
