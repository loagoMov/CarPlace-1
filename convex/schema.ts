import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    dealerships: defineTable({
        name: v.string(),
        location: v.string(),
        logoUrl: v.optional(v.string()),
        slug: v.string(),
        clerkOrgId: v.string(),
    })
        .index("by_slug", ["slug"])
        .index("by_clerk_org_id", ["clerkOrgId"]),

    vehicles: defineTable({
        dealerId: v.id("dealerships"),
        make: v.string(),
        model: v.string(),
        price: v.number(),
        year: v.number(),
        images: v.array(v.id("_storage")),
        status: v.union(
            v.literal("available"),
            v.literal("reserved"),
            v.literal("sold")
        ),
        description: v.optional(v.string()),
        mileage: v.optional(v.number()),
        fuelType: v.optional(v.string()),
        transmission: v.optional(v.string()),
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
        engineSize: v.optional(v.string()),
        color: v.optional(v.string()),
        // Concatenated field for fuzzy search across make + model
        searchText: v.optional(v.string()),
    })
        .index("by_dealer", ["dealerId"])
        .index("by_status", ["status"])
        .searchIndex("search_vehicles", {
            searchField: "searchText",
            filterFields: ["status"],
        }),
});
