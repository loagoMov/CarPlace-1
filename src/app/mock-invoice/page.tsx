import { redirect } from "next/navigation";

export default function MockInvoiceRedirect({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
        if (val) qs.set(key, Array.isArray(val) ? val[0] : val);
    }
    redirect(`/invoice?${qs.toString()}`);
}
