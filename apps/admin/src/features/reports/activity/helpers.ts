export function parseActivityDate(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string" && value) return value;
  return fallback;
}

export function eventTone(entityType: string) {
  switch (entityType) {
    case "order":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "return":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "cancellation":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "product":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "config":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "report":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  }
}
