"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import MobileNav from "@/components/navigation/MobileNav";
import { Store, MapPin, ChevronRight } from "lucide-react";

export default function DealersPage() {
    const dealers = useQuery(api.dealerships.list);

    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-8 mt-12">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Dealerships
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Find trusted car dealers across Botswana
                </p>
            </div>

            {dealers === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card-premium h-48 animate-pulse p-6 space-y-4 flex flex-col justify-center">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : dealers.length === 0 ? (
                <div className="card-premium p-12 text-center">
                    <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No Dealerships Found</h3>
                    <p className="text-slate-500 mt-2">There are currently no registered dealerships on CarPlace.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dealers.map((dealer) => (
                        <Link
                            key={dealer._id}
                            href={`/dealers/${dealer.slug}`}
                            className="card-premium p-6 group hover:border-primary-300 transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center shrink-0 border border-primary-200">
                                    {dealer.logoUrl ? (
                                        <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <Store className="w-8 h-8 text-primary-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                                        {dealer.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 font-medium">
                                        <MapPin size={14} className="text-primary-500" />
                                        <span className="truncate">{dealer.location}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center text-primary-600 text-sm font-bold mt-2 pt-4 border-t border-slate-100">
                                <span>View Inventory</span>
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <MobileNav />
        </main>
    );
}
