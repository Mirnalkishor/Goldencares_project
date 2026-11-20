export function formatDate(value) {
  if (!value) return "Any date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDuration(hours) {
  const value = Number(hours);
  if (!value) return "Duration to confirm";
  return `${value} ${value === 1 ? "hour" : "hours"}`;
}

export function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
