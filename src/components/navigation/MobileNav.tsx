import Link from "next/link";
import { Home, Search, Store, User, LayoutDashboard, LogIn } from "lucide-react";
import { useOrganization, useAuth, SignInButton } from "@clerk/nextjs";

export default function MobileNav() {
    const { organization, isLoaded: orgLoaded } = useOrganization();
    const { isSignedIn, isLoaded: authLoaded } = useAuth();

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass-nav rounded-2xl p-4 flex justify-around items-center z-50">
            <Link href="/" className="flex flex-col items-center gap-1 text-primary-600">
                <Home size={24} />
                <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/search" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors">
                <Search size={24} />
                <span className="text-[10px] font-medium">Search</span>
            </Link>
            <Link href="/dealers" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors">
                <Store size={24} />
                <span className="text-[10px] font-medium">Dealers</span>
            </Link>

            {/* Only show Dealer tab if they belong to an organization and Clerk has loaded */}
            {orgLoaded && organization && (
                <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors">
                    <LayoutDashboard size={24} />
                    <span className="text-[10px] font-medium">Dealer</span>
                </Link>
            )}

            {authLoaded && isSignedIn ? (
                <Link href="/profile" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors">
                    <User size={24} />
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            ) : (
                <SignInButton mode="modal">
                    <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors bg-transparent border-none p-0 cursor-pointer">
                        <LogIn size={24} />
                        <span className="text-[10px] font-medium">Sign In</span>
                    </button>
                </SignInButton>
            )}
        </nav>
    );
}
