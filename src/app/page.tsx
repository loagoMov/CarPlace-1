"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MobileNav from "@/components/navigation/MobileNav";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
    const router = useRouter();
    const [queryText, setQueryText] = useState("");
    const vehicles = useQuery(api.vehicles.list, {});

    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header section */}
            <header className="mb-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            CarPlace<span className="text-primary-600">.</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
                            <MapPin size={14} className="text-primary-500" /> Gaborone, Botswana
                        </p>
                    </div>
                    <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:text-primary-600 transition-colors">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by make, model, or year..."
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 placeholder:text-slate-400 cursor-pointer"
                        onFocus={() => router.push("/search")}
                        readOnly
                    />
                </div>

                {/* Categories / Quick filters */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { id: "all", label: "All Cars" },
                        { id: "suv", label: "SUVs" },
                        { id: "sedan", label: "Sedans" },
                        { id: "hatchback", label: "Hatchbacks" },
                        { id: "luxury", label: "Luxury" },
                        { id: "truck", label: "Budget" }
                    ].map((tab, i) => (
                        <Link
                            key={tab.id}
                            href={tab.id === "all" ? "/search" : `/search?category=${tab.id}`}
                            className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${i === 0 ? "bg-primary-600 text-white shadow-md shadow-primary-200" : "bg-white text-slate-600 border border-slate-200 hover:border-primary-200 hover:bg-primary-50"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </header>

            {/* Car Grid */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Listings</h2>
                    <button className="text-primary-600 text-sm font-bold hover:underline underline-offset-4">See All</button>
                </div>

                {!vehicles ? (
                    <SkeletonGrid />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((car: any) => (
                            <CarCard key={car._id} car={car} />
                        ))}
                    </div>
                )}
            </section>

            <MobileNav />
        </main>
    );
}
