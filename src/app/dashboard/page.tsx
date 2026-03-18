"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton, useOrganization, useOrganizationList, OrganizationSwitcher, CreateOrganization, OrganizationList } from "@clerk/nextjs";
import MobileNav from "@/components/navigation/MobileNav";
import { Plus, LayoutGrid, List, Settings, TrendingUp, Car, Building2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import AddVehicleForm from "@/components/dashboard/AddVehicleForm";
import EditVehicleForm from "@/components/dashboard/EditVehicleForm";

export default function DealerDashboard() {
    const { organization, isLoaded } = useOrganization();
    const { userMemberships, isLoaded: isMembershipsLoaded, setActive } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const dealership = useQuery(api.dealerships.getByClerkOrgId, organization ? { clerkOrgId: organization.id } : "skip");
    const vehicles = useQuery(api.vehicles.list, dealership && dealership !== null ? { limit: 10 } : "skip");
    const createDealership = useMutation(api.dealerships.create);

    // Auto-select the organization if the user has exactly 1 and none is selected currently.
    useEffect(() => {
        if (isMembershipsLoaded && !organization && userMemberships.data?.length === 1) {
            setActive({ organization: userMemberships.data[0].organization.id });
        }
    }, [isMembershipsLoaded, organization, userMemberships, setActive]);

    useEffect(() => {
        if (organization && dealership === null) {
            const syncDealership = async () => {
                try {
                    await createDealership({
                        name: organization.name,
                        location: "Gaborone, Botswana",
                        slug: organization.slug || organization.id,
                        clerkOrgId: organization.id,
                        logoUrl: organization.imageUrl,
                    });
                } catch (error: any) {
                    console.error("Dealership sync failed", error);
                    setSyncError(error?.message || "An error occurred while creating your dealership.");
                }
            };
            syncDealership();
        }
    }, [organization, dealership, createDealership]);

    if (!isLoaded) return null;

    if (!organization) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6">
                    <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto">
                        <Building2 className="text-primary-600" size={40} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dealer Setup Required</h2>
                        <p className="text-slate-500 font-medium">
                            To list cars on CarPlace, you must be invited to a Dealership organization by an administrator.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col gap-6">
                        {/* Clerk's OrganizationList handles showing and accepting invitations, plus creating new orgs */}
                        <OrganizationList
                            hidePersonal={true}
                            afterSelectOrganizationUrl="/dashboard"
                            afterCreateOrganizationUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: "w-full flex justify-center",
                                }
                            }}
                        />

                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-2">
                            To view your new dealership, please accept any pending invites or create a new one above.
                        </p>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    if (dealership === undefined || dealership === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">Setting up your dealership...</h2>
                {syncError ? (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl max-w-md">
                        <p className="text-rose-700 font-bold text-sm">Sync Error</p>
                        <p className="text-rose-600 mt-1 text-xs">{syncError}</p>
                        <button onClick={() => window.location.reload()} className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">Refresh Page</button>
                    </div>
                ) : (
                    <p className="text-slate-500 mt-2">Syncing your organization profile.</p>
                )}
            </div>
        );
    }

    return (
        <main className="min-h-screen pb-32 bg-slate-50">
            {/* Dashboard Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dealer Portal</h1>
                        <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Manage {organization.name}
                        </p>
                    </div>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <TrendingUp className="text-primary-600" size={24} />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Total Value</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">P 2.4M</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <Car className="text-emerald-500" size={24} />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Active Listings</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">12</p>
                        </div>
                    </div>
                </div>

                {/* Inventory Section */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Vehicle Inventory</h2>
                        <button
                            onClick={() => setShowAddVehicle(true)}
                            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                        >
                            <Plus size={18} /> Add Vehicle
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicles?.map((car: any) => (
                                    <tr key={car._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                    {car.imageUrls[0] && (
                                                        <Image src={car.imageUrls[0]} alt={car.make} fill className="object-cover" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm leading-none">{car.make} {car.model}</p>
                                                    <p className="text-xs text-slate-400 font-medium pt-1">{car.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">P {car.price.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${car.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                                car.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {car.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setEditingVehicle(car)}
                                                className="text-primary-600 font-bold text-sm hover:underline"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {vehicles && vehicles.length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-slate-500 font-medium">No vehicles listed yet. Add your first car!</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {showAddVehicle && (
                <AddVehicleForm
                    dealerId={dealership._id}
                    onClose={() => setShowAddVehicle(false)}
                />
            )}

            {editingVehicle && (
                <EditVehicleForm
                    vehicle={editingVehicle}
                    onClose={() => setEditingVehicle(null)}
                />
            )}

            <MobileNav />
        </main>
    );
}
