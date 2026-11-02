"use client";

import { useCallback, useRef, useState } from "react";

const LIMIT = 50;

/**
 * Value with undo/redo. Consecutive edits that share a `group` within 800ms collapse into one
 * step, so undo reverts a typed sentence rather than a single keystroke.
 */
export function useHistory<T>(initial: T) {
  const [state, setState] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const last = useRef<{ group?: string; at: number }>({ at: 0 });

  const set = useCallback((update: (prev: T) => T, group?: string) => {
    setState((s) => {
      const next = update(s.present);
      if (next === s.present) return s;
      const now = Date.now();
      const coalesce = group && last.current.group === group && now - last.current.at < 800;
      last.current = { group, at: now };
      return {
        past: coalesce ? s.past : [...s.past, s.present].slice(-LIMIT),
        present: next,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { at: 0 };
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1]!, future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    last.current = { at: 0 };
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0]!, future: s.future.slice(1) } : s));
  }, []);

  return { value: state.present, set, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
