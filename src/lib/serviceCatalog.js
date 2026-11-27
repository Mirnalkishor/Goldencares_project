import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Sparkles } from "lucide-react";
import { getDb } from "../api/firebaseClient.js";
import { services as fallbackServices } from "./services.js";

const STATIC_BY_ID = new Map(fallbackServices.map((service) => [service.serviceId, service]));

let snapshot = fallbackServices;
let ready = false;
let unsubscribe = null;
let subscribers = 0;
const listeners = new Set();

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseHours(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const match = String(value).trim().toLowerCase().match(/^(\d+(?:\.\d+)?)/);
  const number = match ? Number(match[1]) : NaN;
  return Number.isFinite(number) && number > 0 ? number : null;
}

function slugFor(id, data, fallback) {
  const explicit = String(data?.slug || "").trim();
  if (explicit) return explicit;
  if (fallback?.slug) return fallback.slug;
  return `service-${id}`;
}

export function normalizeService(id, data) {
  const value = data || {};
  const fallback = STATIC_BY_ID.get(String(id));
  const name = String(value.name || value.title || fallback?.name || `Service ${id}`).trim();
  const rawOptions = Array.isArray(value.options) ? value.options : [];

  const options = rawOptions
    .map((option) => {
      const hours = parseHours(option?.durationHours ?? option?.duration);
      const price = finiteNumber(option?.price);
      if (!hours || price == null || price <= 0) return null;
      return {
        hours,
        price,
        label: String(option?.duration || `${hours} hours`).trim() || `${hours} hours`,
      };
    })
    .filter(Boolean);

  const durations = [];
  const prices = {};
  const durationLabels = {};
  for (const option of options) {
    if (!durations.includes(option.hours)) durations.push(option.hours);
    prices[option.hours] = option.price;
    durationLabels[option.hours] = option.label;
  }
  durations.sort((a, b) => a - b);

  const fallbackHours = parseHours(value.durationHours) ?? durations[0] ?? fallback?.durations?.[0] ?? 1;
  if (!durations.length) {
    const basePrice = finiteNumber(value.price);
    durations.push(fallbackHours);
    if (basePrice != null && basePrice > 0) {
      prices[fallbackHours] = basePrice;
      durationLabels[fallbackHours] = `${fallbackHours} hours`;
    }
  }

  const included = Array.isArray(value.includedItems)
    ? value.includedItems.map((item) => String(item).trim()).filter(Boolean)
    : null;
  const order = finiteNumber(value.order);
  const description = String(value.description || "").trim();
  const category = String(value.category || "").trim();

  return {
    ...fallback,
    slug: slugFor(id, value, fallback),
    serviceId: String(id),
    name,
    category: category || fallback?.category || "General",
    description: description || fallback?.description || "",
    icon: fallback?.icon || Sparkles,
    benefit: String(value.benefit || fallback?.benefit || description || "Companionship, handled properly.").trim(),
    intro: String(value.intro || description || fallback?.intro || "").trim(),
    looks: included?.length ? included : fallback?.looks || [],
    note: value.note == null ? fallback?.note ?? null : String(value.note).trim() || null,
    durations,
    prices: { ...(fallback?.prices || {}), ...prices },
    durationLabels: { ...(fallback?.durationLabels || {}), ...durationLabels },
    order: order != null ? order : Number(id) || 999,
    isActive: value.isActive !== false && value.isPopular !== false,
    imageUrl: String(value.imageUrl || "").trim(),
  };
}

export function getServicesSnapshot() {
  return snapshot;
}

export function getServicesReady() {
  return ready;
}

export function serviceBySlug(slug) {
  return snapshot.find((service) => service.slug === slug) || null;
}

export function getServicePriceInr(slug, durationHours) {
  const service = serviceBySlug(slug);
  return service?.prices?.[Number(durationHours)] ?? null;
}

export function getServiceDurationLabel(slug, durationHours) {
  const service = serviceBySlug(slug);
  return service?.durationLabels?.[Number(durationHours)] ?? `${Number(durationHours)} hours`;
}

function ensureSubscription() {
  if (typeof window === "undefined" || unsubscribe) return;
  try {
    unsubscribe = onSnapshot(
      collection(getDb(), "services"),
      (querySnapshot) => {
        const live = querySnapshot.docs
          .map((doc) => normalizeService(doc.id, doc.data()))
          .filter((service) => service.isActive)
          .sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
        snapshot = live.length ? live : fallbackServices;
        ready = true;
        listeners.forEach((listener) => listener(snapshot, ready));
      },
      () => {
        ready = true;
        listeners.forEach((listener) => listener(snapshot, ready));
      }
    );
  } catch {
    ready = true;
  }
}

export function useLiveServices() {
  const [value, setValue] = useState({ services: snapshot, ready });

  useEffect(() => {
    subscribers += 1;
    const listener = (nextServices, nextReady) => setValue({ services: nextServices, ready: nextReady });
    listeners.add(listener);
    setValue({ services: snapshot, ready });
    ensureSubscription();
    return () => {
      listeners.delete(listener);
      subscribers -= 1;
      if (subscribers === 0 && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  return value;
}
