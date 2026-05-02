"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import BookingModal from "./BookingModal";

type BookingCtx = {
  isOpen: boolean;
  treatmentSlug?: string;
  open: (treatmentSlug?: string) => void;
  close: () => void;
};

const Ctx = createContext<BookingCtx | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [treatmentSlug, setTreatmentSlug] = useState<string | undefined>();

  const open = useCallback((slug?: string) => {
    setTreatmentSlug(slug);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const value = useMemo(
    () => ({ isOpen, treatmentSlug, open, close }),
    [isOpen, treatmentSlug, open, close]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <BookingModal />
    </Ctx.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
