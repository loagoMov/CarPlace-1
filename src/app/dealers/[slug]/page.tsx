"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/navigation/MobileNav";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Store, MapPin, ChevronLeft, Car } from "lucide-react";

export default function DealerDetailsPage() {
    const params = useParams();
    const slug = params.slug as string;

    const dealer = useQuery(api.dealerships.getBySlug, { slug });
    const vehicles = useQuery(
        api.vehicles.getByDealerId,
        dealer ? { dealerId: dealer._id } : "skip"
    );

    if (dealer === undefined) {
        return (
            <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-8 mt-12">
                    <div className="h-8 bg-slate-200 rounded w-24 mb-8" />
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-200 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-10 bg-slate-200 rounded w-64" />
                            <div className="h-6 bg-slate-200 rounded w-48" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (dealer === null) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <Store className="w-20 h-20 text-slate-300 mx-auto" />
                    <h1 className="text-3xl font-black text-slate-900">Dealer Not Found</h1>
                    <p className="text-slate-500 font-medium pb-4">We couldn't find the dealership you're looking for.</p>
                    <Link href="/dealers" className="btn-primary">
                        Browse Dealerships
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Link href="/dealers" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors mb-8 mt-4 group">
                <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Dealerships
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-12">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center shrink-0 border-2 border-primary-200 shadow-xl shadow-primary-900/5 overflow-hidden">
                    {dealer.logoUrl ? (
                        <Image src={dealer.logoUrl} alt={dealer.name} fill sizes="(max-width: 640px) 96px, 128px" className="object-cover" />
                    ) : (
                        <Store className="w-12 h-12 sm:w-16 sm:h-16 text-primary-500" />
                    )}
                </div>
                <div className="pb-2">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                        {dealer.name}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 mt-3 font-medium text-lg">
                        <MapPin size={20} className="text-primary-500" />
                        <span>{dealer.location}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">Inventory</h2>

                {vehicles === undefined ? (
                    <SkeletonGrid />
                ) : vehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[2.5rem] border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white space-y-5">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl border border-amber-400/20">
                                <Car size={36} className="text-white" />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <h3 className="text-xl font-black text-slate-900">No Vehicles Listed</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {dealer.name} hasn't added any cars yet. Check back soon or browse other dealers.
                            </p>
                        </div>

                        <div className="flex gap-3 flex-wrap justify-center">
                            <Link
                                href="/dealers"
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-primary-200 transition-all"
                            >
                                <ChevronLeft size={16} /> All Dealers
                            </Link>
                            <Link
                                href="/search"
                                className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-600 font-black text-sm px-6 py-3 rounded-2xl bg-white transition-all"
                            >
                                Browse All Cars
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
