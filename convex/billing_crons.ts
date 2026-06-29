import { internalMutation } from "./_generated/server";

export const sweepInvoices = internalMutation({
    handler: async (ctx) => {
        const pendingInvoices = await ctx.db.query("invoices")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const now = new Date();
        const overdueThreshold = new Date(now);
        overdueThreshold.setDate(now.getDate() - 3); // 3 days ago

        for (const invoice of pendingInvoices) {
            const dueDate = new Date(invoice.dueDate);
            
            if (dueDate < now && invoice.status !== "overdue") {
                // If it's just past due, we can mark it as overdue or just wait for the freeze
                await ctx.db.patch(invoice._id, { status: "overdue" });
                
                await ctx.db.insert("notifications", {
                    recipientId: invoice.dealerId,
                    type: "billing",
                    title: "Invoice Overdue Warning",
                    message: `Invoice ${invoice.invoiceNumber} for P ${(invoice.amount / 100).toFixed(2)} is now overdue. Please pay to avoid suspension.`,
                    isRead: false,
                    createdAt: Date.now(),
                    actionUrl: "/dashboard/billing",
                });
            }

            if (dueDate < overdueThreshold) {
                // It's more than 3 days overdue, freeze the dealer
                const dealer = await ctx.db.get(invoice.dealerId);
                if (dealer && dealer.accountStatus !== "frozen") {
                    await ctx.db.patch(dealer._id, { accountStatus: "frozen" });
                    
                    await ctx.db.insert("notifications", {
                        recipientId: dealer._id,
                        type: "account",
                        title: "Account Suspended",
                        message: "Your account features have been suspended due to outstanding overdue invoices.",
                        isRead: false,
                        createdAt: Date.now(),
                        actionUrl: "/dashboard/billing",
                    });
                }
            }
        }
    }
});
