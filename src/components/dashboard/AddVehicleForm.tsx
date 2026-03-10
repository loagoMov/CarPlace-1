"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Upload, CheckCircle2 } from "lucide-react";

interface AddVehicleFormProps {
    dealerId: Id<"dealerships">;
    onClose: () => void;
}

export default function AddVehicleForm({ dealerId, onClose }: AddVehicleFormProps) {
    const createVehicle = useMutation(api.vehicles.create);
    const generateUploadUrl = useMutation(api.vehicles.generateUploadUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        try {
            // Upload files to Convex Storage first
            const storageIds: Id<"_storage">[] = [];
            for (const file of selectedFiles) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await result.json();
                storageIds.push(storageId as Id<"_storage">);
            }

            const data = {
                dealerId,
                make: formData.get("make") as string,
                model: formData.get("model") as string,
                year: parseInt(formData.get("year") as string),
                price: parseInt(formData.get("price") as string),
                mileage: parseInt(formData.get("mileage") as string),
                category: formData.get("category") as any,
                fuelType: formData.get("fuelType") as string,
                transmission: formData.get("transmission") as string,
                engineSize: formData.get("engineSize") as string,
                color: formData.get("color") as string,
                status: "available" as const,
                images: storageIds,
                description: formData.get("description") as string,
            };

            await createVehicle(data);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                    <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
                    <h3 className="text-2xl font-black text-slate-900">Vehicle Listed!</h3>
                    <p className="text-slate-500 font-medium">The Toyota Hilux has been successfully added to your inventory.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-black text-slate-900">List New Vehicle</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Make</label>
                            <input name="make" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="e.g. Toyota" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Model</label>
                            <input name="model" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="e.g. Hilux" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Year</label>
                            <input name="year" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="2022" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Mileage (km)</label>
                            <input name="mileage" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="45000" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Price (BWP)</label>
                            <input name="price" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="450000" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Category</label>
                        <select name="category" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold appearance-none cursor-pointer">
                            <option value="">Select Category</option>
                            <option value="suv">SUV</option>
                            <option value="sedan">Sedan</option>
                            <option value="hatchback">Hatchback</option>
                            <option value="truck">Truck / Bakkie</option>
                            <option value="coupe">Coupe</option>
                            <option value="wagon">Wagon</option>
                            <option value="van">Van / Minivan</option>
                            <option value="luxury">Luxury</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Fuel Type</label>
                            <select name="fuelType" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold appearance-none cursor-pointer">
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="Electric">Electric</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Transmission</label>
                            <select name="transmission" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold appearance-none cursor-pointer">
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Engine Size</label>
                            <input name="engineSize" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="e.g. 2.8L" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Color</label>
                            <input name="color" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold" placeholder="e.g. White" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Description</label>
                        <textarea name="description" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold resize-none" placeholder="Enter vehicle highlights..." />
                    </div>

                    <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 hover:border-primary-400 transition-colors cursor-pointer group block">
                        <Upload className="mx-auto text-slate-300 group-hover:text-primary-500 transition-colors" size={32} />
                        <p className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                            {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Click to upload photos"}
                        </p>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    setSelectedFiles(Array.from(e.target.files));
                                }
                            }}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 sticky bottom-0 z-10"
                    >
                        {isSubmitting ? "Listing Vehicle..." : "Publish Listing"}
                    </button>
                </form>
            </div>
        </div>
    );
}
