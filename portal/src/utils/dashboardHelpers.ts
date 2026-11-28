import { toast } from "sonner";

//* Shared helpers for dashboard pages that call RTK Query endpoints.

export const errorMessage = (res: any, fallback = "Something went wrong"): string => {
  const e = res?.error;
  if (!e) return fallback;
  const d = e.data;
  if (typeof d === "string") return d;
  const first = Array.isArray(d?.errors) ? d.errors[0]?.message : undefined;
  return d?.message || first || e.message || fallback;
};

//* Runs `promise` (an RTK mutation trigger result) and shows a toast. Returns the response data on success, otherwise null.
export const runMutation = async (promise: PromiseLike<any>, okMessage?: string): Promise<{ ok: boolean; data?: any; status?: number }> => {
  try {
    const res: any = await promise;
    if (res?.error) {
      toast.error(errorMessage(res));
      return { ok: false, status: res.error.status };
    }
    if (okMessage) toast.success(okMessage);
    return { ok: true, data: res?.data };
  } catch (err: any) {
    toast.error(err?.message || "Something went wrong");
    return { ok: false };
  }
};

//* Minor units -> display string, e.g. money(1900, "USD") => "$19.00"
export const money = (minor: number | null | undefined, currency = "USD") => {
  const v = (minor ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
};

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "-");
export const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "-");

export const statusError = (error: any): number | undefined => error?.status;
