import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

/** SharePoint ISO (UTC/offset) -> "YYYY-MM-DDTHH:mm" (local) */
export function spIsoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/** "YYYY-MM-DDTHH:mm" (local) -> ISO UTC string (para SharePoint) */
export function localInputToSpIso(localValue?: string | null): string | null {
  if (!localValue) return null;

  // Formato esperado: "2026-02-11T14:30"
  const [datePart, timePart] = localValue.split("T");
  if (!datePart || !timePart) return null;

  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;

  return dt.toISOString();
}

export function parseDateFlex(v?: string | Date | null): Date | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  const s = String(v).trim();
  if (!s) return null;

  // 1) Intento directo (ISO u otros)
  const attempt = new Date(s);
  if (!Number.isNaN(attempt.getTime())) return attempt;

  // 2) dd/mm/yyyy [hh[:mm]]
  const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})(?:\s+(\d{1,2})(?::(\d{1,2}))?)?$/.exec(s);
  if (m) {
    const [, dd, mm, yy, hh = '0', mi = '0'] = m;
    const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
    const month = Number(mm) - 1;
    const day = Number(dd);
    const hour = Number(hh);
    const min = Number(mi);
    const d = new Date(year, month, day, hour, min, 0);
    if (
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDate() === day
    ) return d;
  }

  return null;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function toDDMMYYYY_HHmm(v?: string | Date | null): string {
  const d = parseDateFlex(v);
  if (!d) return "";
  return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toGraphDateTime(
  v: Date | { toISOString: () => string } | string | null | undefined
): string | undefined {
  if (!v) return undefined;

  // Si ya viene string ISO/fecha válida, respétalo
  if (typeof v === "string") {
    // "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss(.sss)Z"
    if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v)) return v;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // TZDate, Date u objeto con toISOString()
  try {
    const iso = (v as any).toISOString?.();
    if (typeof iso === "string" && iso) return iso;
  } catch {}

  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const toSafeDate = (v: any): Date | null => {
  if (!v) return null;
  const s = spIsoToLocalInput(v);     // string tipo "YYYY-MM-DDTHH:mm"
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toDayjsSafe = (iso?: string | null): Dayjs | null => {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d : null;
};

export function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;

  // si viene "YYYY-MM-DD" lo tratamos como inicio del día
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function stampNow() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}_${hh}${mm}`;
}

export function toISODateFlex(v?: string | Date | null): string {
  if (v == null || v === '') return '';

  let d: Date | null = null;

  if (v instanceof Date) {
    d = v;
  } else {
    const s = String(v).trim();
    if (!s) return '';

    // 1) Intento directo (ISO u otros que JS entienda)
    const tryIso = new Date(s);
    if (!Number.isNaN(tryIso.getTime())) {
      d = tryIso;
    } else {
      // 2) dd/mm/yyyy [hh[:mm]]
      const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})(?:\s+(\d{1,2})(?::(\d{1,2}))?)?$/.exec(s);
      if (m) {
        const [, dd, mm, yy, hh = '0', mi = '0'] = m;
        const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
        const month = Number(mm) - 1;
        const day = Number(dd);
        const hour = Number(hh);
        const min = Number(mi);
        const candidate = new Date(year, month, day, hour, min, 0);
        // valida que coincida (p.ej. 32/13/2025 no pase)
        if (
          candidate.getFullYear() === year &&
          candidate.getMonth() === month &&
          candidate.getDate() === day
        ) {
          d = candidate;
        }
      }
    }
  }

  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
}
