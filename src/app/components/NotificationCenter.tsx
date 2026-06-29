"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Bell, CheckCircle2, X, Flag, AlertTriangle, FileText, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationCenterProps {
    recipientId: string | "admin";
}

export default function NotificationCenter({ recipientId }: NotificationCenterProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // If recipient is literally "admin", pass it as such, otherwise coerce to Id<"dealerships">
    const parsedRecipient = recipientId === "admin" ? "admin" : (recipientId as Id<"dealerships">);

    const notifications = useQuery(api.notifications.getNotifications, { recipientId: parsedRecipient, limit: 15 });
    const unreadCount = useQuery(api.notifications.getUnreadCount, { recipientId: parsedRecipient }) || 0;
    
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const handleMarkAsRead = async (id: Id<"notifications">) => {
        await markAsRead({ notificationId: id });
    };

    const handleMarkAll = async () => {
        await markAllAsRead({ recipientId: parsedRecipient });
    };

    return (
        <div className="relative">
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
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="font-black text-slate-800 text-sm tracking-tight">Notification Centre</h3>
                            <p className="text-[10px] text-slate-400 font-bold">{unreadCount} unread items</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAll}
                                    className="text-xs text-primary-600 hover:text-primary-700 font-black flex items-center gap-0.5 cursor-pointer"
                                >
                                    <Check size={12} /> Clear all
                                </button>
                            )}
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                        {notifications === undefined ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold">Loading updates...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-3">
                                    <span className="text-xl">🎉</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-xs">All caught up!</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">You have no active alerts.</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                let badgeColor = "bg-primary-50 text-primary-600 border-primary-100";
                                let icon = <FileText size={12} />;

                                if (notif.type === "billing") {
                                    badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                                    icon = <FileText size={12} />;
                                } else if (notif.type === "account") {
                                    badgeColor = "bg-rose-50 text-rose-600 border-rose-100";
                                    icon = <AlertTriangle size={12} />;
                                } else {
                                    badgeColor = "bg-slate-50 text-slate-600 border-slate-100";
                                    icon = <Flag size={12} />;
                                }

                                return (
                                    <div 
                                        key={notif._id} 
                                        className={`p-4 hover:bg-slate-50/50 transition duration-150 flex flex-col gap-2 relative ${
                                            !notif.isRead ? "bg-primary-50/10" : ""
                                        }`}
                                    >
                                        <div className="flex gap-2">
                                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${badgeColor}`}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400">
                                                        {new Date(notif.createdAt).toLocaleDateString("en-BW")}
                                                    </span>
                                                </div>
                                                <h4 className={`text-xs font-black text-slate-850 mt-1 leading-tight ${!notif.isRead ? "text-slate-900" : "text-slate-650"}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions / CTA & Clear buttons */}
                                        <div className="flex items-center justify-end gap-1.5 mt-1 border-t border-slate-50 pt-2 pl-8">
                                            {notif.actionUrl && !notif.isRead && (
                                                <button
                                                    onClick={async () => {
                                                        await handleMarkAsRead(notif._id);
                                                        router.push(notif.actionUrl!);
                                                        setIsOpen(false);
                                                    }}
                                                    className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-black transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                                                >
                                                    {notif.type === "billing" ? "View Invoices" : 
                                                     notif.type === "account" ? "Settle Dues" : "Review"}
                                                </button>
                                            )}
                                            {!notif.isRead ? (
                                                <button 
                                                    onClick={() => handleMarkAsRead(notif._id)}
                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                                >
                                                    Dismiss
                                                </button>
                                            ) : (
                                                <span className="text-[9px] font-bold text-slate-400 italic">Read</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
