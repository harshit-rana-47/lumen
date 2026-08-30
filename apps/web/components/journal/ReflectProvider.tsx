"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";

export type ReflectTarget = {
  entryId: string;
  title: string | null;
  entryDate: string;
};

type ReflectContextValue = {
  isOpen: boolean;
  target: ReflectTarget | null;
  openReflect: (target: ReflectTarget, trigger?: HTMLElement | null) => void;
  closeReflect: () => void;
  triggerRef: RefObject<HTMLElement | null>;
};

const ReflectContext = createContext<ReflectContextValue | null>(null);

export function useReflect(): ReflectContextValue {
  const value = useContext(ReflectContext);
  if (!value) {
    throw new Error("useReflect must be used within ReflectProvider");
  }
  return value;
}

type ReflectProviderProps = {
  children: ReactNode;
  /** When the active journal entry changes, clear stale reflection state. */
  activeEntryId: string | null;
};

export function ReflectProvider({ children, activeEntryId }: ReflectProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<ReflectTarget | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const closeReflect = useCallback(() => {
    setIsOpen(false);
    setTarget(null);
    const trigger = triggerRef.current;
    // Restore focus after close settles into the DOM.
    window.requestAnimationFrame(() => {
      trigger?.focus();
    });
  }, []);

  const openReflect = useCallback((next: ReflectTarget, trigger?: HTMLElement | null) => {
    if (trigger) {
      triggerRef.current = trigger;
    }
    setTarget(next);
    setIsOpen(true);
  }, []);

  // Critical: switching entries must never leave a stale pinned entry.
  useEffect(() => {
    if (!isOpen || !target) {
      return;
    }
    if (activeEntryId !== target.entryId) {
      setIsOpen(false);
      setTarget(null);
    }
  }, [activeEntryId, isOpen, target]);

  const value = useMemo(
    () => ({
      isOpen,
      target,
      openReflect,
      closeReflect,
      triggerRef
    }),
    [isOpen, target, openReflect, closeReflect]
  );

  return <ReflectContext.Provider value={value}>{children}</ReflectContext.Provider>;
}
