import {
  Landmark,
  ShoppingBag,
  Users,
  Sunset,
  Stethoscope,
  Clapperboard,
  Footprints,
  Smartphone,
} from "lucide-react";

export const services = [
  {
    slug: "temple-visit",
    serviceId: "1",
    name: "Temple Visit",
    category: "Faith & community",
    icon: Landmark,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 699, 3: 899 },
    durationLabels: { 1: "1 hours", 2: "2 hours", 3: "3 hours" },
    benefit: "Faith and peace, without the logistics.",
    intro:
      "A companion accompanies your parent to the temple or spiritual centre they love, arranges the auto or cab, walks at their pace, and stays close through the whole visit.",
    looks: [
      "Door-to-door pickup at the agreed time",
      "Slow, supported walking with seating breaks",
      "Offerings, prasad and small errands handled",
      "A short update to you afterwards",
    ],
    note: null,
  },
  {
    slug: "shopping-and-grocery",
    serviceId: "2",
    name: "Shopping & Grocery",
    category: "Everyday help",
    icon: ShoppingBag,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 699, 3: 899 },
    durationLabels: { 1: "1 hours", 2: "2 hours", 3: "3 hours" },
    benefit: "Independence, with a steady hand nearby.",
    intro:
      "Help with the daily or weekly shop, so your parent keeps choosing what goes into their kitchen — with someone patient carrying the bags and checking the bill.",
    looks: [
      "A market or supermarket run on their list",
      "Help carrying bags, reading labels and comparing prices",
      "Guidance with bills, change and card payments",
      "Everything unpacked and put away before we leave",
    ],
    note: null,
  },
  {
    slug: "regional-and-community-visit",
    serviceId: "3",
    name: "Community & Regional Visits",
    category: "Faith & community",
    icon: Users,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 699, 3: 899 },
    durationLabels: { 1: "1 hours", 2: "2 hours", 3: "3 hours" },
    benefit: "A place in the community, kept alive.",
    intro:
      "Society functions, cultural programmes, kitty lunches and neighbourhood gatherings — your parent attends, and stays part of the life around them.",
    looks: [
      "Accompaniment to society, club or cultural events",
      "Support with crowds, stairs and seating",
      "Conversation and introductions, never leaving their side",
      "Safe return home and a note on how it went",
    ],
    note: null,
  },
  {
    slug: "evening-outing",
    serviceId: "4",
    name: "Evening Outing",
    category: "Joy & company",
    icon: Sunset,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 699, 3: 899 },
    durationLabels: { 1: "1 hour", 2: "2 hours", 3: "3 hours" },
    benefit: "Fresh air and a change of scene.",
    intro:
      "A park, a lake, a favourite spot nearby. An unhurried hour outdoors does more for mood than almost anything else we do.",
    looks: [
      "A nearby park, garden or lakeside spot",
      "A slow walk, a bench, and unhurried company",
      "Tea or a snack if they would like one",
      "Home before dark, exactly as agreed",
    ],
    note: null,
  },
  {
    slug: "doctor-visit",
    serviceId: "5",
    name: "Doctor Visit",
    category: "Health & appointments",
    icon: Stethoscope,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 699, 3: 899 },
    durationLabels: { 1: "1 hours", 2: "2 hours", 3: "3 hours" },
    benefit: "A calm companion at appointments.",
    intro:
      "Clinics are confusing and waiting rooms are tiring. A companion handles the travel, the queue and the notes, so your parent is never alone at an appointment.",
    looks: [
      "Pickup, company and support at the clinic",
      "Queue, forms and waiting-room company",
      "Instructions and timings written down for the family",
      "Prescriptions handed over — never interpreted",
    ],
    note: "Accompaniment only. We do not give medical advice, treatment or nursing care.",
  },
  {
    slug: "movie-and-theatre",
    serviceId: "6",
    name: "Movie & Theatre",
    category: "Joy & company",
    icon: Clapperboard,
    durations: [2, 3],
    prices: { 2: 599, 3: 699 },
    durationLabels: { 2: "2 hours", 3: "3 hours" },
    benefit: "A good story, shared.",
    intro:
      "A film or a live performance, with the tickets, the timing and the interval breaks all taken care of.",
    looks: [
      "Show and timings chosen with you in advance",
      "Comfortable seating and help with interval breaks",
      "Snacks and washroom support",
      "Safe return home afterwards",
    ],
    note: null,
  },
  {
    slug: "morning-and-evening-walking",
    serviceId: "7",
    name: "Morning & Evening Walks",
    category: "Health & appointments",
    icon: Footprints,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 599, 3: 699 },
    durationLabels: { 1: "1 hours", 2: "2 hours", 3: "3 hours" },
    benefit: "A walking habit that actually holds.",
    intro:
      "A steady companion at a fixed time, so the daily walk happens safely and consistently — the smallest service we offer, and often the one families notice most.",
    looks: [
      "A fixed time each day, so the routine sticks",
      "Company at their pace, never ours",
      "Water, shade and rest stops as needed",
      "A weekly word with you on how it is going",
    ],
    note: null,
  },
  {
    slug: "assistant-in-online-activity",
    serviceId: "8",
    name: "Online & Phone Assistance",
    category: "Everyday help",
    icon: Smartphone,
    durations: [1, 2, 3],
    prices: { 1: 499, 2: 599, 3: 699 },
    durationLabels: { 1: "1 hour", 2: "2 hours", 3: "3 hours" },
    benefit: "Family on the other side of the screen.",
    intro:
      "Video calls, bill payments, forms and photos — technology made calm and safe, with a companion sitting alongside and explaining as they go.",
    looks: [
      "Video calls with children and grandchildren",
      "Bill payments, forms and app setup",
      "Scam awareness and safer passwords",
      "Patience, repetition and no jargon",
    ],
    note: null,
  },
];

export const serviceBySlug = (slug) => services.find((service) => service.slug === slug);

// Prices and duration labels mirror the live Firestore `services` documents.
// The Razorpay callable re-checks them server-side, so these must stay in sync
// with the backend pricing screen.
export function getServicePriceInr(slug, durationHours) {
  const service = serviceBySlug(slug);
  return service?.prices?.[Number(durationHours)] ?? null;
}

export function getServiceDurationLabel(slug, durationHours) {
  const service = serviceBySlug(slug);
  return service?.durationLabels?.[Number(durationHours)] ?? `${Number(durationHours)} hours`;
}
