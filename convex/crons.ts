import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "clear expired featured listings",
    { hours: 24 },
    internal.featured.clearExpired
);

export default crons;
