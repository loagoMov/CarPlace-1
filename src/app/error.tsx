"use client";

import { useEffect, useState } from "react";
import { 
    AlertCircle, 
    WifiOff, 
    Lock, 
    Database, 
    RotateCcw, 
    Home, 
    HelpCircle, 
    LogIn, 
    Compass
} from "lucide-react";
import Link from "next/link";

interface ErrorCategory {
    title: string;
    description: string;
    icon: any;
    colorClass: string;
    bgClass: string;
    tips: string[];
    primaryAction: {
        label: string;
        onClick: (reset: () => void) => void;
        icon: any;
    };
    secondaryAction?: {
        label: string;
        href: string;
        icon: any;
    };
}

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [category, setCategory] = useState<ErrorCategory | null>(null);

    useEffect(() => {
        console.error("Global boundary caught error:", error);

        const msg = (error.message || "").toLowerCase();
        const name = (error.name || "").toLowerCase();

        // 1. Connection / Network errors
        if (
            msg.includes("fetch") || 
            msg.includes("network") || 
            msg.includes("offline") || 
            msg.includes("dns") ||
            msg.includes("cors")
        ) {
            setCategory({
                title: "Network Connection Issue",
                description: "We couldn't connect to our servers. Please check your internet connection or mobile data and try again.",
                icon: WifiOff,
                colorClass: "text-amber-600",
                bgClass: "bg-amber-50 border-amber-100",
                tips: [
                    "Check your phone or computer's connection status.",
                    "Verify if other websites are loading correctly.",
                    "If using mobile data, check if your subscription package is active."
                ],
                primaryAction: {
                    label: "Check Connection & Retry",
                    icon: RotateCcw,
                    onClick: (r) => {
                        if (navigator.onLine) {
                            r();
                        } else {
                            alert("Device is still offline. Please connect and try again.");
                        }
                    }
                },
                secondaryAction: {
                    label: "Browse Offline Pages",
                    href: "/",
                    icon: Compass
                }
            });
        }
        // 2. Auth / Clerk / Authentication Errors
        else if (
            msg.includes("clerk") || 
            msg.includes("auth") || 
            msg.includes("unauthorized") || 
            msg.includes("unauthenticated") || 
            msg.includes("session") ||
            msg.includes("token")
        ) {
            setCategory({
                title: "Authentication / Session Expired",
                description: "Your secure session could not be authenticated. You may need to sign in again to access this page.",
                icon: Lock,
                colorClass: "text-indigo-600",
                bgClass: "bg-indigo-50 border-indigo-100",
                tips: [
                    "Your login session may have timed out.",
                    "If you recently changed your password, you must sign back in.",
                    "Verify you have permissions to view this dealer portal area."
                ],
                primaryAction: {
                    label: "Refresh Session",
                    icon: RotateCcw,
                    onClick: (r) => r()
                },
                secondaryAction: {
                    label: "Go to Sign In",
                    href: "/profile",
                    icon: LogIn
                }
            });
        }
        // 3. Database / Storage (Convex) errors
        else if (
            msg.includes("convex") || 
            msg.includes("database") || 
            msg.includes("query") || 
            msg.includes("mutation") ||
            msg.includes("storage")
        ) {
            setCategory({
                title: "Database Sync Error",
                description: "We encountered an issue synchronizing data with the database cluster. Rest assured, our team has been notified.",
                icon: Database,
                colorClass: "text-violet-600",
                bgClass: "bg-violet-50 border-violet-100",
                tips: [
                    "This is usually a temporary database handshake lag.",
                    "No data was lost. Try refreshing the view in a few moments.",
                    "Confirm if other parts of the dashboard are functioning."
                ],
                primaryAction: {
                    label: "Re-sync Data",
                    icon: RotateCcw,
                    onClick: (r) => r()
                },
                secondaryAction: {
                    label: "Explore Listings",
                    href: "/search",
                    icon: Compass
                }
            });
        }
        // 4. Default / Generic fallback
        else {
            setCategory({
                title: "Unexpected Application Error",
                description: "An unexpected system anomaly has interrupted your flow. We've logged the error and are investigating.",
                icon: AlertCircle,
                colorClass: "text-rose-600",
                bgClass: "bg-rose-50 border-rose-100",
                tips: [
                    "Try refreshing the page to reload assets.",
                    "Clear your browser cookies and browser cache if the issue persists.",
                    "If you are a dealer, ensure your account organization is active."
                ],
                primaryAction: {
                    label: "Restart Session",
                    icon: RotateCcw,
                    onClick: (r) => r()
                },
                secondaryAction: {
                    label: "Go Back Home",
                    href: "/",
                    icon: Home
                }
            });
        }
    }, [error]);

    if (!category) return null;

    const IconComponent = category.icon;
    const PrimaryIcon = category.primaryAction.icon;
    const SecondaryIcon = category.secondaryAction?.icon;

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 text-center bg-slate-50/50">
            <div className="max-w-xl w-full bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-xl space-y-6">
                
                {/* Specific Icon Bubble */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-60 ${category.bgClass}`} />
                    <div className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center shadow-md ${category.bgClass}`}>
                        <IconComponent size={28} className={category.colorClass} />
                    </div>
                </div>

                {/* Header */}
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {category.title}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
                        {category.description}
                    </p>
                </div>

                {/* Helpful Checklist Tips */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <HelpCircle size={13} className="text-slate-400" /> Troubleshooting Tips
                    </h4>
                    <ul className="space-y-2">
                        {category.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                                <span className="text-primary-500 select-none font-bold">•</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Unique ID Debug Code */}
                {error.digest && (
                    <div className="flex items-center justify-between bg-slate-100/50 border border-slate-100 rounded-xl px-4 py-2 text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digest Signature</span>
                        <code className="text-[10px] font-mono text-slate-500 select-all font-bold">
                            {error.digest}
                        </code>
                    </div>
                )}

                {/* Contextual Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                        onClick={() => category.primaryAction.onClick(reset)}
                        className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 shadow-md shadow-primary-200"
                    >
                        <PrimaryIcon size={16} />
                        {category.primaryAction.label}
                    </button>
                    {category.secondaryAction && (
                        <Link
                            href={category.secondaryAction.href}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-800 transition-all bg-white shadow-sm"
                        >
                            {SecondaryIcon && <SecondaryIcon size={16} />}
                            {category.secondaryAction.label}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
