import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CarPlace | Botswana's Premium Automotive Marketplace",
    description: "Buy and sell cars with ease in Botswana. High-performance, real-time car listings.",
    manifest: "/manifest.json",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConvexClientProvider>
            <html lang="en">
                <body className={inter.className}>
                    <header className="px-4 py-2 flex justify-end absolute top-0 right-0 z-50">
                        <SignedOut>
                            <div className="flex gap-4">
                                <SignInButton mode="modal">
                                    <button className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">Sign In</button>
                                </SignInButton>
                            </div>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </header>
                    {children}
                </body>
            </html>
        </ConvexClientProvider>
    );
}
