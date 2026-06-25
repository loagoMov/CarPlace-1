"use client";

export default function DealersLoading() {
    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-8 mt-12">
                <div className="h-10 w-48 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-4 w-64 bg-slate-100/80 rounded-md mt-2 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-premium h-48 animate-pulse p-6 space-y-4 flex flex-col justify-center">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-200 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 bg-slate-200 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
