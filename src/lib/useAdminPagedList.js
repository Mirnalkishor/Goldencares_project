import { useCallback, useEffect, useRef, useState } from "react";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";

/**
 * Cursor-paged admin callable list. Every backend `adminList*` callable accepts
 * `limit` plus either `startAfter` or `startAfterId`, and returns
 * `{ <key>, lastId, hasMore }`. The two cursor names are sent together so the
 * same hook works across all of them; each callable ignores the one it does
 * not use.
 */
export function useAdminPagedList(fn, params = {}, key = "items", pageSize = 20) {
  const paramsKey = JSON.stringify(params ?? {});
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const cursorRef = useRef(null);
  cursorRef.current = cursor;
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError("");
      const startAfter = reset ? null : cursorRef.current;
      try {
        const result = await adminCall(fn, {
          ...(paramsRef.current || {}),
          limit: pageSize,
          ...(startAfter
            ? { startAfter, startAfterId: startAfter }
            : {}),
        });
        const incoming = result?.[key] || [];
        setRows((current) => (reset ? incoming : [...current, ...incoming]));
        setCursor(result?.lastId || null);
        setHasMore(Boolean(result?.hasMore));
      } catch (err) {
        if (reset) setRows([]);
        setError(adminErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [fn, key, pageSize, paramsKey],
  );

  useEffect(() => {
    load(true);
  }, [load, reloadKey]);

  return {
    rows,
    loading,
    error,
    hasMore,
    loadMore: () => load(false),
    reload: () => setReloadKey((value) => value + 1),
    setRows,
  };
}
