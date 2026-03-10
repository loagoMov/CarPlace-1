"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Share2, Heart, MessageCircle, MapPin, Calendar, Gauge, Fuel, Zap, SlidersHorizontal } from "lucide-react";
import MobileNav from "../../../components/navigation/MobileNav";

export default function VehicleDetails() {
    const params = useParams();
    const router = useRouter();
    const vehicle = useQuery(api.vehicles.getVehicle, { id: params.id as any });

    if (!vehicle) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const images = (vehicle.imageUrls && vehicle.imageUrls.length > 0) ? vehicle.imageUrls : ["/placeholder-car.jpg"];

    return (
        <main className="min-h-screen pb-32 bg-white lg:bg-slate-50">
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-40 bg-white/10 backdrop-blur-md">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white/90 rounded-full shadow-sm text-slate-900"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2">
                    <button className="p-2 bg-white/90 rounded-full shadow-sm text-slate-900">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2 bg-white/90 rounded-full shadow-sm text-rose-500">
                        <Heart size={20} />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto lg:mt-8 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Sticky Gallery */}
                    <div className="lg:w-3/5">
                        <div className="relative aspect-[4/3] lg:rounded-3xl lg:overflow-hidden lg:shadow-xl lg:sticky lg:top-8">
                            <Image
                                src={images[0]}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold ring-1 ring-white/20">
                                1 / {images.length} Photos
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 px-4 lg:px-0 space-y-8">
                        <section className="space-y-4 pt-6 lg:pt-0">
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-primary-100">
                                    {vehicle.year} Model
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-emerald-100">
                                    {vehicle.status}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                                    {vehicle.make} <span className="text-primary-600">{vehicle.model}</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-400 flex items-center gap-1">
                                    <MapPin size={14} /> Available at Broadway Motors, Gaborone
                                </p>
                            </div>

                            <div className="text-5xl font-black text-slate-900 tracking-tighter pt-4">
                                P {vehicle.price.toLocaleString()}
                                <span className="text-base font-medium text-slate-400 ml-2 tracking-normal">VAT Incl.</span>
                            </div>
                        </section>

                        {/* Quick Specs Grid */}
                        <section className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 transition-all hover:border-primary-200">
                                <Calendar className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Year</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.year}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 transition-all hover:border-primary-200">
                                <Gauge className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Mileage</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 transition-all hover:border-primary-200">
                                <Fuel className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Fuel</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.fuelType || "Petrol"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 transition-all hover:border-primary-200">
                                <Zap className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Engine</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.engineSize || "N/A"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 transition-all hover:border-primary-200">
                                <SlidersHorizontal className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Transmission</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.transmission || "Automatic"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 transition-all hover:border-primary-200">
                                <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: vehicle.color || "#FFFFFF" }}></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Color</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.color || "Not Set"}</p>
                                </div>
                            </div>
                        </section>

                        {/* Description */}
                        <section className="space-y-4 pt-4 border-t border-slate-100 lg:border-none">
                            <h2 className="text-xl font-black text-slate-900">Seller's Description</h2>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {vehicle.description || "No description provided for this vehicle. Contact the dealer for more information about this premium listing."}
                            </p>
                        </section>

                        {/* Action Buttons (Desktop) */}
                        <div className="hidden lg:grid grid-cols-2 gap-4 pt-8">
                            <button
                                onClick={() => window.open(`https://wa.me/26771234567?text=Hi, I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}`, '_blank')}
                                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-100"
                            >
                                <MessageCircle size={20} />
                                WhatsApp Dealer
                            </button>
                            <button
                                onClick={() => alert("Booking functionality coming soon! Please contact the dealer via WhatsApp to schedule a viewing.")}
                                className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-slate-200"
                            >
                                Book a Visit
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Action Bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 p-4 grid grid-cols-2 gap-3 z-40 pb-safe">
                <button
                    onClick={() => window.open(`https://wa.me/26771234567?text=Hi, I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}`, '_blank')}
                    className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm"
                >
                    <MessageCircle size={18} />
                    WhatsApp
                </button>
                <button
                    onClick={() => alert("Booking functionality coming soon!")}
                    className="bg-slate-900 text-white py-4 rounded-2xl font-black text-sm"
                >
                    Book Visit
                </button>
            </div>

            {/* FAB (Hidden on mobile detail because of bottom bar) */}
            <a
                href="https://wa.me/26771234567"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex fixed bottom-28 right-6 lg:bottom-12 lg:right-12 bg-emerald-500 hover:bg-emerald-600 text-white w-16 h-16 rounded-full shadow-2xl shadow-emerald-200 items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group z-50"
            >
                <MessageCircle size={32} />
                <span className="absolute right-full mr-4 bg-white text-slate-900 px-3 py-1 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-100">
                    Chat on WhatsApp
                </span>
            </a>

            <MobileNav />
        </main>
    );
}
