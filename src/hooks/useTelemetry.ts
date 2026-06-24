"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface TelemetryEvent {
  anonymousSessionId?: string;
  vehicleId?: string;
  eventType: string;
  pageRoute: string;
  metadata?: any;
  timestamp: number;
}

// Global queue shared across components to avoid duplicate buffers and keep tracking batching clean.
const eventQueue: TelemetryEvent[] = [];

// Helper to generate simple UUID-like string if crypto.randomUUID isn't available
function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("carplace_anon_id");
  if (!id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = "anon_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);
    }
    localStorage.setItem("carplace_anon_id", id);
  }
  return id;
}

export function useTelemetry() {
  const logEvents = useMutation(api.telemetry.logEvents);
  const { isSignedIn } = useAuth();

  // Ref to hold mutation to avoid stale closures in event listeners or unmount functions
  const logMutationRef = useRef(logEvents);
  useEffect(() => {
    logMutationRef.current = logEvents;
  }, [logEvents]);

  const flushEvents = useCallback(async () => {
    if (eventQueue.length === 0) return;
    const batch = [...eventQueue];
    eventQueue.length = 0; // Clear queue
    try {
      await logMutationRef.current({
        events: batch.map((e) => ({
          ...e,
          vehicleId: e.vehicleId as Id<"vehicles"> | undefined,
        })),
      });
    } catch (err) {
      console.error("Failed to flush telemetry events", err);
      // Re-add to queue if flush failed
      eventQueue.unshift(...batch);
    }
  }, []);

  const trackEvent = useCallback(
    (eventType: string, vehicleId?: string, metadata?: any) => {
      if (typeof window === "undefined") return;

      const anonymousSessionId = !isSignedIn ? getOrCreateAnonId() : undefined;
      const pageRoute = window.location.pathname;

      const event: TelemetryEvent = {
        anonymousSessionId,
        vehicleId,
        eventType,
        pageRoute,
        metadata,
        timestamp: Date.now(),
      };

      eventQueue.push(event);

      if (eventQueue.length >= 5) {
        flushEvents();
      }
    },
    [isSignedIn, flushEvents]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushEvents();
    };
  }, [flushEvents]);

  // Flush on page unload / hide (standard beacon/persistence pattern)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushEvents();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushEvents]);

  return { trackEvent, flushEvents };
}
export { getOrCreateAnonId };
