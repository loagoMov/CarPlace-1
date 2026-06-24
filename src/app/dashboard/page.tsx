"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton, useOrganization, useOrganizationList, OrganizationSwitcher, CreateOrganization, OrganizationList, useUser } from "@clerk/nextjs";
import MobileNav from "@/components/navigation/MobileNav";
import { Plus, TrendingUp, Car, Building2, Loader2, Flame, Shield, Users, Trash2, Phone } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import AddVehicleForm from "@/components/dashboard/AddVehicleForm";
import EditVehicleForm from "@/components/dashboard/EditVehicleForm";
import PromotionModal from "@/components/dashboard/PromotionModal";
import { compressImage } from "@/utils/imageCompressor";
import Link from "next/link";
export default function DealerDashboard() {
    const { user } = useUser();
    const { organization, isLoaded } = useOrganization();
    const { userMemberships, isLoaded: isMembershipsLoaded, setActive } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [promotingVehicle, setPromotingVehicle] = useState<any>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    
    // Admin emails state
    const [newEmail, setNewEmail] = useState("");
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
    const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    const dealership = useQuery(api.dealerships.getByClerkOrgId, organization ? { clerkOrgId: organization.id } : "skip");
    const vehicles = useQuery(api.vehicles.getByDealerId, dealership && dealership !== null ? { dealerId: dealership._id } : "skip");
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);
    const createDealership = useMutation(api.dealerships.create);
    const updateAuthorizedEmails = useMutation(api.dealerships.updateAuthorizedEmails);
    const updatePhone = useMutation(api.dealerships.updatePhone);
    const updateVehicle = useMutation(api.vehicles.update);
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (dealership && dealership.phone !== undefined) {
            setPhoneInput(dealership.phone || "");
        }
    }, [dealership]);

    // Countdown timer for active promotions
    const getCountdown = (featuredUntil: number) => {
        const diffMs = featuredUntil - Date.now();
        if (diffMs <= 0) return "Expired";
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

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

    if (!isLoaded || isGlobalAdmin === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

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

    const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
    const isAuthorizedDealer = !dealership.authorizedEmails || dealership.authorizedEmails.includes(userEmail);

    const handleAddEmail = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            alert("Please enter a valid email address.");
            return;
        }
        setIsSubmittingEmail(true);
        try {
            const currentList = (dealership.authorizedEmails || [userEmail]).filter((e): e is string => typeof e === "string");
            if (!currentList.includes(newEmail)) {
                await updateAuthorizedEmails({
                    id: dealership._id,
                    authorizedEmails: [...currentList, newEmail],
                });
            }
            setNewEmail("");
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to add email.");
        } finally {
            setIsSubmittingEmail(false);
        }
    };

    const handleRemoveEmail = async (emailToRemove: string) => {
        const currentList = (dealership.authorizedEmails || []).filter((e): e is string => typeof e === "string");
        if (currentList.length <= 1) {
            alert("Dealership must have at least 1 registered admin email.");
            return;
        }
        if (confirm(`Are you sure you want to remove ${emailToRemove}?`)) {
            setIsSubmittingEmail(true);
            try {
                await updateAuthorizedEmails({
                    id: dealership._id,
                    authorizedEmails: currentList.filter((email: string) => email !== emailToRemove),
                });
            } catch (err: any) {
                console.error(err);
                alert(err?.message || "Failed to remove email.");
            } finally {
                setIsSubmittingEmail(false);
            }
        }
    };
    const handleUpdatePhone = async () => {
        if (!dealership) return;
        setIsSubmittingPhone(true);
        try {
            await updatePhone({
                id: dealership._id,
                phone: phoneInput,
            });
            alert("WhatsApp contact number updated successfully!");
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to update contact phone number.");
        } finally {
            setIsSubmittingPhone(false);
        }
    };

    if (!isGlobalAdmin && !isAuthorizedDealer) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Your account belongs to this organization, but your email address is not registered in the dealership&apos;s authorized admin list.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Authorized Administrators:</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {dealership.authorizedEmails?.map((email: string) => (
                                <span key={email} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                                    {email}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Signed in as: <span className="lowercase text-slate-600">{userEmail || "Guest"}</span>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    // HIGH-05 fix: compute real stats from live vehicle data instead of
    // displaying hardcoded placeholder values that misrepresent actual inventory.
    const vehicleList = vehicles ?? [];
    const activeListings = vehicleList.filter((v: any) => v.status === "available").length;
    const soldListings   = vehicleList.filter((v: any) => v.status === "sold").length;
    const totalValue     = vehicleList.reduce((sum: number, v: any) => sum + (v.price ?? 0), 0);
    const formatValue    = (val: number) =>
        val >= 1_000_000
            ? `P ${(val / 1_000_000).toFixed(1)}M`
            : val >= 1_000
            ? `P ${(val / 1_000).toFixed(0)}K`
            : `P ${val.toLocaleString()}`;

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
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/analytics" className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                            View Analytics
                        </Link>
                        <UserButton />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
                {/* Stats Cards — HIGH-05 fix: real computed values from live data */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <TrendingUp className="text-primary-600" size={24} />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Total Stock Value</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">
                                {vehicles === undefined ? "…" : formatValue(totalValue)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <Car className="text-emerald-500" size={24} />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Available Listings</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">
                                {vehicles === undefined ? "…" : activeListings}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <Car className="text-rose-400" size={24} />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Sold</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">
                                {vehicles === undefined ? "…" : soldListings}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <TrendingUp className="text-slate-400" size={24} />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Total Listings</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">
                                {vehicles === undefined ? "…" : vehicleList.length}
                            </p>
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
                                                        <Image src={car.imageUrls[0]} alt={car.make} fill sizes="64px" className="object-cover" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm leading-none">{car.make} {car.model}</p>
                                                    <p className="text-xs text-slate-400 font-medium pt-1">{car.year}</p>
                                                    {car.featuredUntil && car.featuredUntil > Date.now() && (
                                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                                                            <Flame size={12} className="text-amber-500 fill-amber-500 animate-pulse" />
                                                            <span>Promo ({getCountdown(car.featuredUntil)})</span>
                                                        </div>
                                                    )}
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
                                            <div className="flex flex-col gap-2">
                                                {/* Quick status buttons */}
                                                <div className="flex items-center gap-1.5">
                                                    {([
                                                        { value: "available", label: "Available", active: "bg-emerald-500 text-white", idle: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200" },
                                                        { value: "reserved",  label: "Reserved",  active: "bg-amber-400 text-white",   idle: "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200" },
                                                        { value: "sold",      label: "Sold",      active: "bg-rose-500 text-white",    idle: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200" },
                                                    ] as const).map(({ value, label, active, idle }) => (
                                                        <button
                                                            key={value}
                                                            disabled={statusUpdating === car._id}
                                                            onClick={async () => {
                                                                if (car.status === value) return;
                                                                setStatusUpdating(car._id);
                                                                try {
                                                                    await updateVehicle({ id: car._id, status: value });
                                                                } finally {
                                                                    setStatusUpdating(null);
                                                                }
                                                            }}
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                                                                car.status === value ? active : idle
                                                            }`}
                                                        >
                                                            {statusUpdating === car._id && car.status !== value ? "…" : label}
                                                        </button>
                                                    ))}
                                                </div>
                                                {/* Row actions */}
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setEditingVehicle(car)}
                                                        className="text-primary-600 font-bold text-xs hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setPromotingVehicle(car)}
                                                        className="text-indigo-600 font-bold text-xs hover:underline"
                                                    >
                                                        Promote
                                                    </button>
                                                </div>
                                            </div>
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

                {/* Contact & Access Section */}
                <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Shield className="text-primary-600" size={20} /> Contact &amp; Access
                        </h2>
                        <p className="text-xs text-slate-400">Manage which email addresses are authorized to view and list stock for this dealership. Must contain at least 1 email.</p>
                    </div>

                    {/* ── Registered Admin Emails ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={15} className="text-primary-500" />
                                <p className="text-sm font-black text-slate-800 tracking-tight">Registered Admin Emails</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full ring-1 ring-primary-100">
                                {(dealership.authorizedEmails || []).length} registered
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(dealership.authorizedEmails || []).map((email: string, idx: number) => (
                                <div
                                    key={email}
                                    className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-primary-700 uppercase">{email[0]}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{email}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {email === userEmail ? "You" : `Admin ${idx + 1}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">
                                            Active
                                        </span>
                                        {email !== userEmail && (
                                            <button
                                                onClick={() => handleRemoveEmail(email)}
                                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add new email */}
                        <div className="flex gap-2 pt-1">
                            <input
                                type="email"
                                placeholder="Add administrator email…"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                            <button
                                onClick={handleAddEmail}
                                disabled={isSubmittingEmail || !newEmail}
                                className="btn-primary px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + Add Email
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* ── WhatsApp Contact ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-emerald-500" />
                                <p className="text-sm font-black text-slate-800 tracking-tight">WhatsApp Contact Number</p>
                            </div>
                            {dealership.phone ? (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full ring-1 ring-emerald-100">
                                    ✓ Active
                                </span>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full ring-1 ring-amber-100">
                                    ⚠ Not set
                                </span>
                            )}
                        </div>

                        {/* Current number display */}
                        {dealership.phone ? (
                            <div className="flex items-center gap-4 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <Phone size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Registered WhatsApp Number</p>
                                    <p className="text-base font-black text-slate-900 tracking-tight">+{dealership.phone}</p>
                                </div>
                                <div className="ml-auto">
                                    <a
                                        href={`https://wa.me/${dealership.phone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
                                    >
                                        Test Link ↗
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-xs font-bold text-amber-700">No WhatsApp number set — buyers will see a disabled button on your listings.</p>
                            </div>
                        )}

                        {/* Update input */}
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                placeholder="Update number e.g. 26771234567"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdatePhone()}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                            />
                            <button
                                onClick={handleUpdatePhone}
                                disabled={isSubmittingPhone || !phoneInput}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {isSubmittingPhone ? "Saving…" : "Save Number"}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium pl-1">Digits only with country code — no spaces or dashes. e.g. <strong>26771234567</strong> for +267 71 234 567</p>
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

            {promotingVehicle && (
                <PromotionModal
                    vehicle={promotingVehicle}
                    onClose={() => setPromotingVehicle(null)}
                />
            )}

            <MobileNav />
        </main>
    );
}
