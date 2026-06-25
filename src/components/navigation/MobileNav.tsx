import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Store, User, LayoutDashboard, LogIn, Shield } from "lucide-react";
import { useOrganization, useAuth, SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function MobileNav() {
    const { organization, isLoaded: orgLoaded } = useOrganization();
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user } = useUser();
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);
    const pathname = usePathname();

    const NavLink = ({ href, icon: Icon, label, exact = false }: { href: string; icon: any; label: string; exact?: boolean }) => {
        const isActive = exact ? pathname === href : pathname?.startsWith(href);
        return (
            <Link href={href} className={`flex flex-col items-center gap-1 transition-all duration-200 relative py-2 px-3 rounded-xl min-w-[60px] active:scale-95 ${
                isActive ? "text-primary-600 font-semibold" : "text-slate-500 hover:text-primary-600"
            }`}>
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? "bg-primary-50 scale-105" : ""}`}>
                    <Icon size={20} />
                </div>
                <span className="text-[9px] font-medium tracking-tight">{label}</span>
                {isActive && (
                    <span className="absolute bottom-0 w-1 h-1 bg-primary-600 rounded-full animate-pulse" />
                )}
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md glass-nav rounded-2xl p-2 flex justify-around items-center z-50">
            <NavLink href="/" icon={Home} label="Home" exact />
            <NavLink href="/search" icon={Search} label="Search" />
            <NavLink href="/dealers" icon={Store} label="Dealers" />

            {/* Only show Dealer tab if they belong to an organization and Clerk has loaded */}
            {orgLoaded && organization && (
                <NavLink href="/dashboard" icon={LayoutDashboard} label="Dealer" />
            )}

            {/* Global Admin tab — only visible to registered CarPlace admins */}
            {isGlobalAdmin && (
                <NavLink href="/admin" icon={Shield} label="Admin" />
            )}

            {authLoaded && isSignedIn ? (
                <NavLink href="/profile" icon={User} label="Profile" />
            ) : (
                <SignInButton mode="modal">
                    <button className="flex flex-col items-center gap-1 transition-all duration-200 relative py-2 px-3 rounded-xl min-w-[60px] active:scale-95 text-slate-500 hover:text-primary-600 bg-transparent border-none p-0 cursor-pointer">
                        <div className="p-1.5 rounded-lg">
                            <LogIn size={20} />
                        </div>
                        <span className="text-[9px] font-medium tracking-tight">Sign In</span>
                    </button>
                </SignInButton>
            )}
        </nav>
    );
}
