"use client";

import { ChevronLeft } from "lucide-react";

export default function ListingDetailsLoading() {
    return (
        <main className="min-h-screen bg-white lg:bg-slate-50 pt-16 lg:pt-0">
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 animate-pulse">
                <div className="p-2 w-10 h-10 bg-slate-100 rounded-full" />
                <div className="flex gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-full" />
                    <div className="w-10 h-10 bg-slate-100 rounded-full" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto lg:py-8 lg:px-8">
                {/* Desktop Back button */}
                <div className="hidden lg:flex items-center gap-2 mb-6 animate-pulse">
                    <div className="w-24 h-8 bg-slate-200 rounded-xl" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Image and Details */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Image Carousel Mockup */}
                        <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:rounded-3xl bg-slate-200 animate-pulse overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: "1.5s" }} />
                        </div>

                        {/* Summary Info */}
                        <div className="px-4 lg:px-0 space-y-4 animate-pulse">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
                                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                                </div>
                                <div className="h-8 bg-slate-200 rounded-lg w-24" />
                            </div>

                            {/* Key specs */}
                            <div className="grid grid-cols-4 gap-2 py-4 border-y border-slate-100">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 bg-slate-200 rounded-full" />
                                        <div className="h-3 bg-slate-100 rounded w-12" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Dealer Card Mockup */}
                    <div className="lg:col-span-4 px-4 lg:px-0">
                        <div className="card-premium p-6 space-y-4 animate-pulse">
                            <div className="h-5 bg-slate-200 rounded w-1/2" />
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="h-12 bg-slate-200 rounded-xl w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
