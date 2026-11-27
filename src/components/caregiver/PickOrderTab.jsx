import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2, MapPin, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PickOrderTab({ onChanged, onOpenBookings }) {
  const [orders, setOrders] = useState(null);
  const [pickingId, setPickingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await base44.functions.invoke("getPickOrders", {});
      setOrders(result?.orders || []);
    } catch (loadError) {
      setOrders([]);
      setError(loadError?.message || "We could not load platform orders. Please try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Picked orders disappear for every caregiver, including caregivers who
  // already have the tab open. Refresh periodically and on tab focus.
  useEffect(() => {
    function refresh() {
      if (pickingId || document.visibilityState !== "visible") return;
      load();
    }
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load, pickingId]);

  async function pick(order) {
    setPickingId(order.id);
    setError("");
    setNotice("");
    try {
      await base44.functions.invoke("pickOrder", { bookingId: order.id });
      setNotice(`${order.jobType} is now assigned to you. Full details are in Bookings.`);
      onChanged?.();
      await load();
    } catch (pickError) {
      setError(pickError?.message || "We could not pick that order. Please try again.");
    } finally {
      setPickingId("");
    }
  }

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-[1.5rem] text-foreground">Pick order</h2>
          <p className="mt-1 text-[0.88rem] text-muted-foreground">
            Today’s and upcoming platform jobs. Job type, location and price only — full details appear once assigned.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[0.8rem] font-medium text-muted-foreground">
          <ClipboardList className="h-4 w-4 text-primary" /> Max 7
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.88rem] text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <div role="status" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[0.88rem] text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={onOpenBookings} className="font-semibold underline">
            Open Bookings
          </button>
        </div>
      ) : null}

      {orders === null ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-[1.5rem] border border-border bg-card" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 font-heading text-[1.3rem] text-foreground">No open orders right now</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.92rem] leading-relaxed text-muted-foreground">
            Check back later — new bookings for today and upcoming days appear here automatically.
          </p>
        </div>
      ) : (
        <ul aria-label="Pick order list" className="mt-5 grid gap-3 sm:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-col justify-between rounded-[1.5rem] border border-border bg-card p-5">
              <div>
                <h3 className="font-heading text-[1.15rem] text-foreground">{order.jobType}</h3>
                <p className="mt-2 flex items-center gap-2 text-[0.88rem] text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" /> {order.location}
                </p>
                <p className="mt-3 text-[0.9rem] font-semibold text-foreground">
                  <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1">
                    {order.priceInr != null
                      ? `₹${Number(order.priceInr).toLocaleString("en-IN")}`
                      : "Price on assignment"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(pickingId)}
                onClick={() => pick(order)}
                className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[0.85rem] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {pickingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pickingId === order.id ? "Picking…" : "Pick order"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
