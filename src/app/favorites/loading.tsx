"use client";

import { SkeletonGrid } from "@/components/ui/SkeletonLoader";

export default function FavoritesLoading() {
    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-4 py-6 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-48 bg-slate-100/80 rounded" />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                <SkeletonGrid />
            </div>
        </main>
    );
}
