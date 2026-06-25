"use client";

import { SkeletonGrid } from "@/components/ui/SkeletonLoader";

export default function SearchLoading() {
    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            {/* Mock Search Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="w-full bg-slate-100/80 border border-slate-200 rounded-2xl h-11 animate-pulse" />
                        </div>
                        <div className="w-11 h-11 bg-slate-100/80 border border-slate-200 rounded-2xl animate-pulse" />
                    </div>
                    {/* Mock quick filters */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-9 w-24 bg-slate-100/80 border border-slate-200 rounded-full shrink-0 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="h-6 w-48 bg-slate-200 rounded-md mb-6 animate-pulse" />
                <SkeletonGrid />
            </div>
        </main>
    );
}
