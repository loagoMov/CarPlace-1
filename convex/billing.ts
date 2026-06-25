import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const generateMockInvoicePdf = (dealerName: string, bursTin: string, invoiceNumber: string) => {
    // Generates a mock BURS-compliant PDF link (0% VAT for under P500,000 threshold)
    return `https://carplace.co.bw/mock-invoice?dealer=${encodeURIComponent(dealerName)}&tin=${encodeURIComponent(bursTin)}&inv=${encodeURIComponent(invoiceNumber)}&vat=0`;
};

// Common bank filler strings to strip for Tier 2 matching
const BANK_FILLERS = [/EFT/gi, /Deposit/gi, /FNB ATM/gi, /Immediate Pay/gi];

function normalizeReference(ref: string) {
    let normalized = ref;
    for (const filler of BANK_FILLERS) {
        normalized = normalized.replace(filler, "");
    }
    return normalized.trim().toLowerCase();
}

export const processBankStatement = mutation({
    args: {
        rows: v.array(v.object({
            amount: v.number(), // in cents
            referenceString: v.string(),
        }))
    },
    handler: async (ctx, args) => {
        const evaluatedTransactions = [];
        
        // Load dealers for matching
        const dealers = await ctx.db.query("dealerships").collect();
        const pendingInvoices = await ctx.db.query("invoices")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
            
        for (const row of args.rows) {
            let matchedDealerId: Id<"dealerships"> | null = null;
            let confidence: "PERFECT" | "FUZZY" | "NONE" = "NONE";
            
            // Tier 1: RegEx Match for CP-\d{3}
            const cpMatch = row.referenceString.match(/CP-\d{3}/i);
            if (cpMatch) {
                const customId = cpMatch[0].toUpperCase();
                const dealer = dealers.find(d => d.clientCustomId === customId);
                if (dealer) {
                    matchedDealerId = dealer._id;
                    confidence = "PERFECT";
                }
            }
            
            // Tier 2: Fuzzy & Alias Match
            if (!matchedDealerId) {
                const normalizedRowRef = normalizeReference(row.referenceString);
                
                for (const dealer of dealers) {
                    const normalizedName = dealer.name.toLowerCase();
                    const aliases = (dealer.knownBankAliases || []).map(a => a.toLowerCase());
                    
                    if (normalizedRowRef.includes(normalizedName) || normalizedName.includes(normalizedRowRef)) {
                        matchedDealerId = dealer._id;
                        confidence = "FUZZY";
                        break;
                    }
                    
                    const aliasMatch = aliases.some(alias => 
                        normalizedRowRef.includes(alias) || alias.includes(normalizedRowRef)
                    );
                    
                    if (aliasMatch) {
                        matchedDealerId = dealer._id;
                        confidence = "FUZZY";
                        break;
                    }
                }
            }
            
            // Reconcile Invoice if matched
            let matchedInvoiceId: Id<"invoices"> | undefined = undefined;
            if (matchedDealerId) {
                // Find an invoice for this dealer with matching amount
                const matchingInvoice = pendingInvoices.find(
                    inv => inv.dealerId === matchedDealerId && inv.amount === row.amount && inv.status === "pending"
                );
                
                if (matchingInvoice) {
                    matchedInvoiceId = matchingInvoice._id;
                } else {
                    confidence = "NONE";
                    matchedDealerId = null;
                }
            }
            
            evaluatedTransactions.push({
                confidence,
                amount: row.amount,
                referenceString: row.referenceString,
                matchedDealerId,
                matchedInvoiceId
            });
        }
        
        return evaluatedTransactions;
    }
});

export const linkManualAliasToDealer = mutation({
    args: {
        dealerId: v.id("dealerships"),
        unmatchedReference: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new Error("Dealer not found");
        
        // Add to known bank aliases
        const aliases = dealer.knownBankAliases || [];
        if (!aliases.includes(args.unmatchedReference)) {
            await ctx.db.patch(args.dealerId, {
                knownBankAliases: [...aliases, args.unmatchedReference]
            });
        }
        
        // Find and pay invoice
        const invoice = await ctx.db.query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .filter((q) => q.eq(q.field("amount"), args.amount))
            .first();
            
        if (invoice) {
            await ctx.db.patch(invoice._id, { status: "paid" });
            return { success: true, invoiceId: invoice._id };
        }
        
        return { success: false, message: "Alias added but no matching pending invoice found for this amount." };
    }
});

export const markInvoiceAsPaid = mutation({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.invoiceId, { status: "paid" });
    }
});

// Admin helper query to get all dealers
export const getAllDealers = query({
    handler: async (ctx) => {
        return await ctx.db.query("dealerships").collect();
    }
});

// Admin helper query to get pending invoices
export const getPendingInvoices = query({
    handler: async (ctx) => {
        return await ctx.db.query("invoices")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
    }
});

// Dealer helper query to get their own active/pending/overdue invoices
export const getDealerInvoices = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        return await ctx.db.query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .collect();
    }
});

// For testing/mocking: create an invoice
export const createMockInvoice = mutation({
    args: {
        dealerId: v.id("dealerships"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new Error("Dealer not found");
        
        const invoiceCount = (await ctx.db.query("invoices").collect()).length;
        const invoiceNumber = `INV-${1000 + invoiceCount}`;
        
        // Due 7 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        
        const tin = dealer.bursTin || "000000000";
        const externalPdfUrl = generateMockInvoicePdf(dealer.name, tin, invoiceNumber);
        
        return await ctx.db.insert("invoices", {
            dealerId: args.dealerId,
            invoiceNumber,
            amount: args.amount,
            status: "pending",
            dueDate: dueDate.toISOString(),
            externalPdfUrl,
        });
    }
});

// Full billing summary for a single dealer (dealer portal)
export const getDealerBillingSummary = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const invoices = await ctx.db.query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .collect();

        const now = Date.now();
        const pending  = invoices.filter(i => i.status === "pending");
        const overdue  = invoices.filter(i => i.status === "overdue");
        const paid     = invoices.filter(i => i.status === "paid");

        const totalOwed = [...pending, ...overdue].reduce((s, i) => s + i.amount, 0);
        const totalPaid = paid.reduce((s, i) => s + i.amount, 0);

        // Next upcoming invoice = earliest pending due date
        const upcoming = pending
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

        return { invoices, pending, overdue, paid, totalOwed, totalPaid, upcoming };
    }
});

// Admin roster: every dealer with their billing health snapshot
export const getAllDealersBillingSummary = query({
    handler: async (ctx) => {
        const dealers = await ctx.db.query("dealerships").collect();
        const allInvoices = await ctx.db.query("invoices").collect();

        return dealers.map(dealer => {
            const dealerInvoices = allInvoices.filter(i => i.dealerId === dealer._id);
            const pending = dealerInvoices.filter(i => i.status === "pending");
            const overdue = dealerInvoices.filter(i => i.status === "overdue");
            const paid    = dealerInvoices.filter(i => i.status === "paid");

            const totalOwed = [...pending, ...overdue].reduce((s, i) => s + i.amount, 0);
            const totalPaid = paid.reduce((s, i) => s + i.amount, 0);

            // Next due invoice
            const nextInvoice = pending
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

            // Days until next invoice is due (negative = overdue)
            const daysUntilDue = nextInvoice
                ? Math.ceil((new Date(nextInvoice.dueDate).getTime() - Date.now()) / 86_400_000)
                : null;

            const health: "good" | "warning" | "critical" =
                overdue.length > 0 ? "critical" :
                (daysUntilDue !== null && daysUntilDue <= 7) ? "warning" : "good";

            return {
                dealer,
                pending,
                overdue,
                paid,
                totalOwed,
                totalPaid,
                nextInvoice,
                daysUntilDue,
                health,
            };
        });
    }
});
