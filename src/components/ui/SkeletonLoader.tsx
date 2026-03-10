export function SkeletonCard() {
    return (
        <div className="card-premium animate-pulse">
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-6 bg-slate-200 rounded-md w-1/2" />
                <div className="flex gap-2 pt-2">
                    <div className="h-3 bg-slate-100 rounded-full w-12" />
                    <div className="h-3 bg-slate-100 rounded-full w-12" />
                    <div className="h-3 bg-slate-100 rounded-full w-12" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
