import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {
        status: v.optional(v.union(v.literal("available"), v.literal("reserved"), v.literal("sold"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let results;
        if (args.status) {
            const currentStatus = args.status;
            results = await ctx.db.query("vehicles")
                .withIndex("by_status", (q) => q.eq("status", currentStatus))
                .order("desc")
                .take(args.limit ?? 50);
        } else {
            results = await ctx.db.query("vehicles").order("desc").take(args.limit ?? 50);
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
                images: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
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
        const { id, ...fields } = args;
        const existing = await ctx.db.get(id);
        if (!existing) throw new Error("Vehicle not found");

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
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Vehicle not found");

        // Optionally delete images from storage too
        for (const storageId of existing.images) {
            await ctx.storage.delete(storageId);
        }

        await ctx.db.delete(args.id);
    },
});

export const search = query({
    args: {
        queryText: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let results;
        if (args.queryText === "") {
            let q = ctx.db.query("vehicles");
            if (args.category) {
                // If we have no search text but have a category, we can filter
                // However, 'vehicles' doesn't have a category index yet.
                // For now, let's just filter in memory or add an index.
                results = await q.order("desc").take(50);
                if (args.category) {
                    results = results.filter(v => v.category === args.category);
                }
            } else {
                results = await q.order("desc").take(20);
            }
        } else {
            let q = ctx.db
                .query("vehicles")
                .withSearchIndex("search_vehicles", (q) =>
                    q.search("searchText", args.queryText)
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

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
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
        const searchText = `${args.make} ${args.model}`.toLowerCase();
        return await ctx.db.insert("vehicles", { ...args, searchText });
    },
});
