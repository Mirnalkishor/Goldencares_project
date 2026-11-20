// Single source of truth for GoldenCares contact details and navigation.

export const CONTACT = {
  email: "info@goldencares.in",
  // [ADD PHONE NUMBER] — include country code, e.g. "+91 98xxx xxxxx"
  phone: "",
  // [ADD WHATSAPP NUMBER] — digits only with country code, e.g. "9198xxxxxxxx"
  whatsapp: "",
  address: "Chandigarh, 160017, India",
  hours: "Every day, 7 am – 9 pm",
  hoursShort: "7 am – 9 pm, every day",
};

export const CITIES = ["Chandigarh", "Mohali", "Panchkula"];

export const NAV = [
  { label: "Services", to: "/services" },
  { label: "How it works", to: "/how-it-works" },
  { label: "Find caregivers", to: "/caregivers" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export const DISCLAIMER =
  "GoldenCares provides companionship and assistance only. No overnight care, no medical or nursing services, no clinical treatment. Doctor Visit means accompaniment only.";

export const hasPhone = () => Boolean(CONTACT.phone);
export const hasWhatsApp = () => Boolean(CONTACT.whatsapp);

export const telHref = () => `tel:${CONTACT.phone.replace(/\s+/g, "")}`;
export const whatsappHref = () =>
  `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hello GoldenCares, I would like to know more about companion care for my parent."
  )}`;