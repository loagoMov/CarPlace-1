"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import MobileNav from "@/components/navigation/MobileNav";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Search as SearchIcon, X, SlidersHorizontal, Car } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
    { id: "all", label: "All Vehicles" },
    { id: "suv", label: "SUVs" },
    { id: "sedan", label: "Sedans" },
    { id: "hatchback", label: "Hatchbacks" },
    { id: "truck", label: "Trucks / Bakkies" },
    { id: "luxury", label: "Luxury" },
    { id: "coupe", label: "Coupes" },
    { id: "van", label: "Vans" },
];

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialQuery = searchParams.get("q") || "";
    const initialCategory = searchParams.get("category") || "all";

    const [queryText, setQueryText] = useState(initialQuery);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(queryText);
        }, 300);
        return () => clearTimeout(timer);
    }, [queryText]);

    // Update URL on search/filter changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const queryString = params.toString();
        router.replace(queryString ? `/search?${queryString}` : "/search", { scroll: false });
    }, [debouncedQuery, selectedCategory, router]);

    const vehicles = useQuery(api.vehicles.search, {
        queryText: debouncedQuery,
        category: selectedCategory === "all" ? undefined : selectedCategory
    });

    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            {/* Search Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by make, model..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold"
                                value={queryText}
                                onChange={(e) => setQueryText(e.target.value)}
                            />
                            {queryText && (
                                <button
                                    onClick={() => setQueryText("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-primary-600 transition-colors shadow-sm">
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat.id
                                        ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                                        : "bg-white text-slate-500 border-slate-100 hover:border-primary-200 hover:text-primary-600"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {vehicles ? `${vehicles.length} Results Found` : "Searching..."}
                    </h2>
                </div>

                {!vehicles ? (
                    <SkeletonGrid />
                ) : vehicles.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                            <Car size={40} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900">No vehicles found</h3>
                            <p className="text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
                        </div>
                        <button
                            onClick={() => {
                                setQueryText("");
                                setSelectedCategory("all");
                            }}
                            className="text-primary-600 font-bold hover:underline"
                        >
                            Reset all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((car: any) => (
                            <CarCard key={car._id} car={car} />
                        ))}
                    </div>
                )}
            </div>

            <MobileNav />
        </main>
    );
}
