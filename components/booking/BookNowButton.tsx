"use client";

import { useBooking } from "./BookingContext";

type Props = {
  treatmentSlug?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children?: React.ReactNode;
};

export default function BookNowButton({
  treatmentSlug,
  variant = "primary",
  className = "",
  children = "Book Now",
}: Props) {
  const { open } = useBooking();
  const base =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
      ? "btn-secondary"
      : "btn-ghost";
  return (
    <button
      type="button"
      onClick={() => open(treatmentSlug)}
      className={`${base} ${className}`}
    >
      {children}
    </button>
  );
}
