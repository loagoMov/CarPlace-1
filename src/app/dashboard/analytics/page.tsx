"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization, useUser } from "@clerk/nextjs";
import MobileNav from "@/components/navigation/MobileNav";
import { Loader2, TrendingUp, BarChart, Eye, Heart, Share2, MousePointerClick, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AnalyticsDashboard() {
    const { isLoaded } = useUser();
    const { organization } = useOrganization();

    const dealership = useQuery(api.dealerships.getByClerkOrgId, organization ? { clerkOrgId: organization.id } : "skip");
    const vehicles = useQuery(api.vehicles.getByDealerId, dealership && dealership !== null ? { dealerId: dealership._id } : "skip");
    const analytics = useQuery(api.telemetry.getListingAnalytics, dealership && dealership !== null ? { dealerId: dealership._id } : "skip");

    if (!isLoaded || dealership === undefined || vehicles === undefined || analytics === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!organization || dealership === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dealer Setup Required</h2>
                <p className="text-slate-500 mt-2">You must have an active dealership to view analytics.</p>
                <Link href="/dashboard" className="mt-6 px-6 py-2 bg-primary-600 text-white font-bold rounded-xl">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    // Merge vehicle info with analytics
    const vehicleStats = vehicles.map(vehicle => {
        const stats = analytics.find(a => a.vehicleId === vehicle._id) || {
            views: 0,
            favorites: 0,
            shares: 0,
            clicks: 0
        };
        return {
            ...vehicle,
            stats
        };
    }).sort((a, b) => b.stats.views - a.stats.views); // Sort by views descending

    const totalViews = vehicleStats.reduce((sum, v) => sum + v.stats.views, 0);
    const totalFavorites = vehicleStats.reduce((sum, v) => sum + v.stats.favorites, 0);
    const totalShares = vehicleStats.reduce((sum, v) => sum + v.stats.shares, 0);
    const totalClicks = vehicleStats.reduce((sum, v) => sum + v.stats.clicks, 0);

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <BarChart className="text-primary-500" /> Listing Analytics
                            </h1>
                            <p className="text-slate-500 font-medium">Performance metrics for {dealership.name}</p>
                        </div>
                    </div>
                </div>

                {/* Aggregate Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-slate-500 font-bold mb-2">
                            <Eye className="w-5 h-5 text-blue-500" /> Total Views
                        </div>
                        <p className="text-3xl font-black text-slate-900">{totalViews}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-slate-500 font-bold mb-2">
                            <Heart className="w-5 h-5 text-rose-500" /> Total Favorites
                        </div>
                        <p className="text-3xl font-black text-slate-900">{totalFavorites}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-slate-500 font-bold mb-2">
                            <Share2 className="w-5 h-5 text-green-500" /> Total Shares
                        </div>
                        <p className="text-3xl font-black text-slate-900">{totalShares}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-slate-500 font-bold mb-2">
                            <MousePointerClick className="w-5 h-5 text-amber-500" /> Total Clicks
                        </div>
                        <p className="text-3xl font-black text-slate-900">{totalClicks}</p>
                    </div>
                </div>

                {/* Vehicle Stats Table */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="text-primary-500 w-5 h-5" /> Top Performing Listings
                        </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Vehicle</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Views</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Favorites</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Shares</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Clicks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {vehicleStats.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                            No listings found.
                                        </td>
                                    </tr>
                                )}
                                {vehicleStats.map((v) => (
                                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="font-bold text-slate-900">{v.year} {v.make} {v.model}</p>
                                                    <p className="text-sm font-medium text-slate-500">P{v.price.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.views}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.favorites}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.shares}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.clicks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <MobileNav />
        </main>
    );
}
