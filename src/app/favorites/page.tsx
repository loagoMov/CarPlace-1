"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWishlist } from "@/hooks/useWishlist";
import CarCard from "@/components/ui/CarCard";
import MobileNav from "@/components/navigation/MobileNav";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Heart, ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FavoritesPage() {
    const router = useRouter();
    const { wishlist } = useWishlist();

    const vehicles = useQuery(
        api.vehicles.getByIds,
        wishlist.length > 0 ? { ids: wishlist } : "skip"
    );

    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-4 py-6 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-600"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            My Favorites <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        </h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Your saved vehicles listings</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Your wishlist is empty</h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6 font-medium">
                            Save listings you are interested in by tapping the heart icon on any listing page.
                        </p>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-primary-200 transition-all"
                        >
                            <Search size={16} /> Explore Vehicles
                        </Link>
                    </div>
                ) : vehicles === undefined ? (
                    <SkeletonGrid />
                ) : vehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">No Listings Found</h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6 font-medium">
                            The listings you favorited may have been removed or sold out.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {vehicles.map((car) => (
                            <CarCard key={car._id} car={car} />
                        ))}
                    </div>
                )}
            </div>

            <MobileNav />
        </main>
    );
}
