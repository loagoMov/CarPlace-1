"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface DealerNotificationBannerProps {
    dealerId: string;
}

export default function DealerNotificationBanner({ dealerId }: DealerNotificationBannerProps) {
    const invoices = useQuery(api.billing.getDealerInvoices, { dealerId: dealerId as Id<"dealerships"> });
    const dealers = useQuery(api.billing.getAllDealers) || [];
    
    if (invoices === undefined) {
        return null; // Loading state
    }

    const dealer = dealers.find(d => d._id === dealerId);
    const isFrozen = dealer?.accountStatus === "frozen";

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const pendingInvoices = invoices.filter(inv => inv.status === "pending" || inv.status === "overdue");
    
    const overdueInvoices = pendingInvoices.filter(inv => new Date(inv.dueDate) < now);
    const dueSoonInvoices = pendingInvoices.filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return dueDate >= now && dueDate <= threeDaysFromNow;
    });

    if (isFrozen) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Account Temporarily Suspended</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>
                                Your lead-generation features (like revealing phone numbers) have been temporarily disabled due to overdue invoices. Please settle your account to restore functionality.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (overdueInvoices.length > 0) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Overdue Invoice Warning</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>
                                You have {overdueInvoices.length} invoice(s) overdue. If left unpaid past the 3-day grace period, your account's public listing features will be temporarily paused.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (dueSoonInvoices.length > 0) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Upcoming Invoice Due</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>
                                You have {dueSoonInvoices.length} invoice(s) due within the next 3 days. Please review and process payment to maintain uninterrupted service.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
