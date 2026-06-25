"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Bell, CheckCircle2, X } from "lucide-react";

interface NotificationCenterProps {
    recipientId: string | "admin";
}

export default function NotificationCenter({ recipientId }: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false);

    // If recipient is literally "admin", pass it as such, otherwise coerce to Id<"dealerships">
    const parsedRecipient = recipientId === "admin" ? "admin" : (recipientId as Id<"dealerships">);

    const notifications = useQuery(api.notifications.getNotifications, { recipientId: parsedRecipient, limit: 10 });
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
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAll}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications === undefined ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-3xl">🎉</span>
                                </div>
                                <h4 className="font-semibold text-gray-800 mb-1">All caught up!</h4>
                                <p className="text-sm text-gray-500">You have no new notifications.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        className={`p-4 hover:bg-gray-50 transition cursor-default ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-gray-400 mt-2 block">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {!notif.isRead && (
                                                <button 
                                                    onClick={() => handleMarkAsRead(notif._id)}
                                                    className="text-blue-500 hover:text-blue-700 p-1"
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
