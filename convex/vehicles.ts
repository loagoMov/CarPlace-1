import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// ─── Input length constants ─────────────────────────────────────────────────
const MAX_SHORT = 50;
const MAX_DESCRIPTION = 2000;
const MAX_IMAGES = 10;
const MIN_YEAR = 1900;
const MAX_YEAR = 2030;

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function requireAuth(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError("Unauthorized: You must be signed in.");
    }
    return identity;
}

// ─── Ownership helper ────────────────────────────────────────────────────────
// Verifies the authenticated user's Clerk org matches the dealership that owns
// the given vehicle. Prevents any dealer from editing another dealer's stock.
async function requireVehicleOwnership(ctx: any, vehicleId: any) {
    const identity = await requireAuth(ctx);
    const vehicle = await ctx.db.get(vehicleId);
    if (!vehicle) throw new ConvexError("Vehicle not found.");

    const dealership = await ctx.db.get(vehicle.dealerId);
    if (!dealership) throw new ConvexError("Dealership not found.");

    // Clerk org ID is stored in the token under orgId (or orgID) claim, or falls back to
    // the user's subject token when acting as an individual (no org).
    const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
    if (dealership.clerkOrgId !== callerOrgId) {
        throw new ConvexError("Forbidden: You do not own this vehicle listing.");
    }
    return { vehicle, dealership };
}

// ─── Queries (public read — no auth needed) ──────────────────────────────────

export const list = query({
    args: {
        status: v.optional(v.union(v.literal("available"), v.literal("reserved"), v.literal("sold"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const safeLimit = Math.min(args.limit ?? 50, 100);
        let results;
        if (args.status) {
            const currentStatus = args.status;
            results = await ctx.db.query("vehicles")
                .withIndex("by_status", (q) => q.eq("status", currentStatus))
                .order("desc")
                .take(safeLimit);
        } else {
            results = await ctx.db.query("vehicles").order("desc").take(safeLimit);
        }

        return Promise.all(
            results.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

export const getVehicle = query({
    args: { id: v.id("vehicles") },
    handler: async (ctx, args) => {
        const car = await ctx.db.get(args.id);
        if (!car) return null;
        return {
            ...car,
            imageUrls: (await Promise.all(
                car.images.map(async (id) => await ctx.storage.getUrl(id))
            )).filter((url) => url !== null) as string[],
        };
    },
});

export const getByDealerId = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const results = await ctx.db
            .query("vehicles")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .order("desc")
            .take(50);

        return Promise.all(
            results.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

export const search = query({
    args: {
        queryText: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Limit query text length to prevent abuse
        const safeQuery = args.queryText.slice(0, 100);

        let results;
        if (safeQuery === "") {
            let q = ctx.db.query("vehicles");
            if (args.category) {
                results = await q.order("desc").take(50);
                results = results.filter(v => v.category === args.category);
            } else {
                results = await q.order("desc").take(20);
            }
        } else {
            let q = ctx.db
                .query("vehicles")
                .withSearchIndex("search_vehicles", (q) =>
                    q.search("searchText", safeQuery)
                );

            results = await q.take(20);

            if (args.category) {
                results = results.filter(v => v.category === args.category);
            }
        }

        return Promise.all(
            results.map(async (car) => ({
                ...car,
                images: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

// ─── Mutations (all require authentication) ───────────────────────────────────

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        // V-06 fix: require auth before issuing upload URLs
        await requireAuth(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

export const create = mutation({
    args: {
        dealerId: v.id("dealerships"),
        make: v.string(),
        model: v.string(),
        price: v.number(),
        year: v.number(),
        images: v.array(v.id("_storage")),
        status: v.union(v.literal("available"), v.literal("reserved"), v.literal("sold")),
        description: v.optional(v.string()),
        mileage: v.optional(v.number()),
        fuelType: v.optional(v.string()),
        transmission: v.optional(v.string()),
        engineSize: v.optional(v.string()),
        color: v.optional(v.string()),
        category: v.optional(v.union(
            v.literal("suv"),
            v.literal("sedan"),
            v.literal("hatchback"),
            v.literal("truck"),
            v.literal("coupe"),
            v.literal("wagon"),
            v.literal("van"),
            v.literal("luxury")
        )),
    },
    handler: async (ctx, args) => {
        // V-02 fix: require authentication
        const identity = await requireAuth(ctx);

        // V-03 fix: verify the caller belongs to the dealership org
        const dealership = await ctx.db.get(args.dealerId);
        if (!dealership) throw new ConvexError("Dealership not found.");
        const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
        if (dealership.clerkOrgId !== callerOrgId) {
            throw new ConvexError("Forbidden: You cannot create listings for another dealership.");
        }

        // V-08 fix: input length and range validation
        if (args.make.length > MAX_SHORT) throw new ConvexError(`Make must be ≤ ${MAX_SHORT} characters.`);
        if (args.model.length > MAX_SHORT) throw new ConvexError(`Model must be ≤ ${MAX_SHORT} characters.`);
        if (args.description && args.description.length > MAX_DESCRIPTION) throw new ConvexError(`Description must be ≤ ${MAX_DESCRIPTION} characters.`);
        if (args.color && args.color.length > MAX_SHORT) throw new ConvexError(`Color must be ≤ ${MAX_SHORT} characters.`);
        if (args.fuelType && args.fuelType.length > MAX_SHORT) throw new ConvexError(`Fuel type must be ≤ ${MAX_SHORT} characters.`);
        if (args.transmission && args.transmission.length > MAX_SHORT) throw new ConvexError(`Transmission must be ≤ ${MAX_SHORT} characters.`);
        if (args.engineSize && args.engineSize.length > MAX_SHORT) throw new ConvexError(`Engine size must be ≤ ${MAX_SHORT} characters.`);
        if (args.year < MIN_YEAR || args.year > MAX_YEAR) throw new ConvexError(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
        if (args.price <= 0) throw new ConvexError("Price must be a positive number.");
        if (args.mileage !== undefined && args.mileage < 0) throw new ConvexError("Mileage cannot be negative.");
        if (args.images.length > MAX_IMAGES) throw new ConvexError(`You may upload at most ${MAX_IMAGES} images.`);

        const searchText = `${args.make} ${args.model}`.toLowerCase();
        return await ctx.db.insert("vehicles", { ...args, searchText });
    },
});

export const update = mutation({
    args: {
        id: v.id("vehicles"),
        make: v.optional(v.string()),
        model: v.optional(v.string()),
        price: v.optional(v.number()),
        year: v.optional(v.number()),
        status: v.optional(v.union(v.literal("available"), v.literal("reserved"), v.literal("sold"))),
        description: v.optional(v.string()),
        mileage: v.optional(v.number()),
        fuelType: v.optional(v.string()),
        transmission: v.optional(v.string()),
        engineSize: v.optional(v.string()),
        color: v.optional(v.string()),
        category: v.optional(v.union(
            v.literal("suv"),
            v.literal("sedan"),
            v.literal("hatchback"),
            v.literal("truck"),
            v.literal("coupe"),
            v.literal("wagon"),
            v.literal("van"),
            v.literal("luxury")
        )),
        images: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        // V-02 + V-03 fix: require auth and ownership
        const { vehicle: existing } = await requireVehicleOwnership(ctx, args.id);

        // V-08 fix: validate lengths
        if (args.make && args.make.length > MAX_SHORT) throw new ConvexError(`Make must be ≤ ${MAX_SHORT} characters.`);
        if (args.model && args.model.length > MAX_SHORT) throw new ConvexError(`Model must be ≤ ${MAX_SHORT} characters.`);
        if (args.description && args.description.length > MAX_DESCRIPTION) throw new ConvexError(`Description must be ≤ ${MAX_DESCRIPTION} characters.`);
        if (args.color && args.color.length > MAX_SHORT) throw new ConvexError(`Color must be ≤ ${MAX_SHORT} characters.`);
        if (args.fuelType && args.fuelType.length > MAX_SHORT) throw new ConvexError(`Fuel type must be ≤ ${MAX_SHORT} characters.`);
        if (args.transmission && args.transmission.length > MAX_SHORT) throw new ConvexError(`Transmission must be ≤ ${MAX_SHORT} characters.`);
        if (args.engineSize && args.engineSize.length > MAX_SHORT) throw new ConvexError(`Engine size must be ≤ ${MAX_SHORT} characters.`);
        if (args.year !== undefined && (args.year < MIN_YEAR || args.year > MAX_YEAR)) throw new ConvexError(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
        if (args.price !== undefined && args.price <= 0) throw new ConvexError("Price must be a positive number.");
        if (args.mileage !== undefined && args.mileage < 0) throw new ConvexError("Mileage cannot be negative.");
        if (args.images && args.images.length > MAX_IMAGES) throw new ConvexError(`You may upload at most ${MAX_IMAGES} images.`);

        const { id, ...fields } = args;
        const updateData: any = { ...fields };
        if (fields.make || fields.model) {
            const make = fields.make ?? existing.make;
            const model = fields.model ?? existing.model;
            updateData.searchText = `${make} ${model}`.toLowerCase();
        }

        await ctx.db.patch(id, updateData);
    },
});

export const remove = mutation({
    args: { id: v.id("vehicles") },
    handler: async (ctx, args) => {
        // V-02 + V-03 fix: require auth and ownership
        const { vehicle: existing } = await requireVehicleOwnership(ctx, args.id);

        // Clean up images from storage
        for (const storageId of existing.images) {
            await ctx.storage.delete(storageId);
        }

        await ctx.db.delete(args.id);
    },
});
