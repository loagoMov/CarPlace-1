import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new notification (internal or public depending on use case)
export const pushNotification = mutation({
    args: {
        recipientId: v.union(v.id("dealerships"), v.literal("admin")),
        type: v.union(v.literal("billing"), v.literal("account"), v.literal("system")),
        title: v.string(),
        message: v.string(),
        actionUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            ...args,
            isRead: false,
            createdAt: Date.now(),
        });
    }
});

// Mark a single notification as read
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isRead: true });
    }
});

// Mark all unread notifications as read for a specific recipient
export const markAllAsRead = mutation({
    args: { recipientId: v.union(v.id("dealerships"), v.literal("admin")) },
    handler: async (ctx, args) => {
        const unread = await ctx.db.query("notifications")
            .withIndex("by_recipient_and_status", (q) => 
                q.eq("recipientId", args.recipientId).eq("isRead", false)
            )
            .collect();
            
        for (const notif of unread) {
            await ctx.db.patch(notif._id, { isRead: true });
        }
    }
});

// List notifications for a recipient
export const getNotifications = query({
    args: { 
        recipientId: v.union(v.id("dealerships"), v.literal("admin")),
        limit: v.optional(v.number()) 
    },
    handler: async (ctx, args) => {
        const notifs = await ctx.db.query("notifications")
            .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
            .order("desc")
            .take(args.limit || 50);
            
        return notifs;
    }
});

// Get unread count
export const getUnreadCount = query({
    args: { recipientId: v.union(v.id("dealerships"), v.literal("admin")) },
    handler: async (ctx, args) => {
        const unread = await ctx.db.query("notifications")
            .withIndex("by_recipient_and_status", (q) => 
                q.eq("recipientId", args.recipientId).eq("isRead", false)
            )
            .collect();
        return unread.length;
    }
});

// Permanently delete a single notification
export const deleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.notificationId);
    }
});

// Permanently delete ALL notifications for a recipient (clear all)
export const deleteAllNotifications = mutation({
    args: { recipientId: v.union(v.id("dealerships"), v.literal("admin")) },
    handler: async (ctx, args) => {
        const all = await ctx.db.query("notifications")
            .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
            .collect();
        for (const notif of all) {
            await ctx.db.delete(notif._id);
        }
    }
});
