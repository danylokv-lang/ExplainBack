/** "1 gap" / "3 gaps" without dragging in an i18n library. */
export function plural(count: number, one: string, many = `${one}s`): string {
  return count === 1 ? one : many;
}

const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function formatSeconds(ms: number): string {
  return decimal.format(ms / 1000);
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  const parsed = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.getTime()) ? iso : dateFormat.format(parsed);
}
