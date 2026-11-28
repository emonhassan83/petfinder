import { useCallback, useEffect, useRef, useState } from "react";

//* Minimal data loader: runs `fn` on mount and when `deps` change; `reload()` re-runs it. Ignores stale results.
export const useAsync = <T,>(fn: () => Promise<T>, deps: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (id === run.current) setData(result);
    } catch (e: any) {
      if (id === run.current) setError(e?.message ?? "Something went wrong");
    } finally {
      if (id === run.current) setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);
  return { data, loading, error, reload, setData };
};
