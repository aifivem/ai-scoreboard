import { record } from "@aicore-fivem/lib/shared";
import type { Counts } from "common/board";

export function toCounts(v: unknown): Counts | null {
  const b = record(v);
  if (
    typeof b.online !== "number" ||
    typeof b.max !== "number" ||
    !Array.isArray(b.jobs)
  )
    return null;
  return {
    online: b.online,
    max: b.max,
    jobs: b.jobs.flatMap((j) => {
      const r = record(j);
      return typeof r.label === "string" && typeof r.count === "number"
        ? [{ label: r.label, count: r.count }]
        : [];
    }),
  };
}
