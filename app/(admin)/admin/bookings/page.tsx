"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import {
  deleteBooking,
  getBookings,
  markBookingViewed,
  updateBookingPaymentStatus,
  updateBookingStatus,
} from "@/lib/actions/bookings";

function formatBookingDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(value))
    .replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}

const filters = ["all", "new", "pending", "confirmed", "cancelled", "completed"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    const data = await getBookings();
    setBookings(data);
    const bookingId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("booking")
      : null;
    if (bookingId) {
      const booking = data.find((item: any) => item.id === bookingId);
      if (booking) await handleView(booking);
    }
    setLoading(false);
  }

  async function handleStatus(id: string, status: string) {
    setBusy(id);
    try {
      await updateBookingStatus(id, status);
      await loadBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Unable to update booking status.");
    } finally {
      setBusy(null);
    }
  }

  async function handlePayment(id: string, status: string) {
    setBusy(id);
    try {
      await updateBookingPaymentStatus(id, status as any);
      await loadBookings();
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Unable to update payment status. Apply the final handover migration if this status is not available.");
    } finally {
      setBusy(null);
    }
  }

  async function handleView(booking: any) {
    setSelectedBooking(booking);
    if (!booking.viewed_at) {
      try {
        await markBookingViewed(booking.id);
        setBookings((items) =>
          items.map((item) =>
            item.id === booking.id ? { ...item, viewed_at: new Date().toISOString() } : item
          )
        );
      } catch (error) {
        console.error("Unable to mark booking as viewed:", error);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    await deleteBooking(id);
    await loadBookings();
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    if (filter === "new") return !booking.viewed_at;
    return (booking.booking_status || "pending") === filter;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Bookings" }]} />
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Bookings</h1>
        <p className="text-sm text-brand-muted">Manage customers, payment readiness, and booking status.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
              filter === item
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-accent"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {["Customer", "Treatment / Kit", "Booking Date & Time", "Referral", "Amount", "Payment", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Loading bookings...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No bookings found for this filter.</td></tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className={!booking.viewed_at ? "bg-amber-50/45" : "hover:bg-slate-50"}>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        {!booking.viewed_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{booking.customer_name}</p>
                          <p className="text-xs text-slate-500">{booking.customer_phone || booking.customer_email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">{booking.treatment_name || booking.treatment?.title || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatBookingDateTime(booking.created_at)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{booking.partner_code || booking.referral_code || "Direct"}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">Rs. {Number(booking.payment_amount || booking.treatment_price || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4">
                      <select value={booking.payment_status || "pending_payment"} disabled={busy === booking.id} onChange={(event) => handlePayment(booking.id, event.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-accent">
                        <option value="unpaid">Unpaid</option>
                        <option value="pending_payment">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select value={booking.booking_status || "pending"} disabled={busy === booking.id} onChange={(event) => handleStatus(booking.id, event.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-accent">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleView(booking)} className="rounded border border-brand-border bg-white px-3 py-1.5 text-xs text-brand-ink hover:border-brand-accent">View</button>
                        <button type="button" onClick={() => handleDelete(booking.id)} className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/55 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">Booking Details</p>
                <h2 className="mt-1 text-xl font-semibold text-brand-ink">{selectedBooking.customer_name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedBooking(null)} className="rounded-lg px-3 py-1 text-brand-muted hover:bg-brand-surface">Close</button>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <BookingDetail label="Phone" value={selectedBooking.customer_phone} />
              <BookingDetail label="Email" value={selectedBooking.customer_email} />
              <BookingDetail label="Treatment / Package" value={selectedBooking.treatment_name || selectedBooking.treatment?.title} />
              <BookingDetail label="Date & Time" value={formatBookingDateTime(selectedBooking.created_at)} />
              <BookingDetail label="Amount" value={`Rs. ${Number(selectedBooking.payment_amount || selectedBooking.treatment_price || 0).toLocaleString("en-IN")}`} />
              <BookingDetail label="Booking Status" value={selectedBooking.booking_status || "pending"} />
              <BookingDetail label="Payment Status" value={selectedBooking.payment_status || "pending"} />
              <BookingDetail label="Source" value={selectedBooking.referral_code || selectedBooking.partner_code ? "Partner referral" : "Direct website"} />
              <BookingDetail label="Partner / Referral" value={selectedBooking.partner_code || selectedBooking.referral_code || "-"} />
              <BookingDetail label="City" value={selectedBooking.city} />
              <div className="sm:col-span-2"><BookingDetail label="Address" value={[selectedBooking.address, selectedBooking.pin_code].filter(Boolean).join(", ")} /></div>
              <div className="sm:col-span-2"><BookingDetail label="Notes" value={selectedBooking.notes || "-"} /></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingDetail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-brand-surface/60 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium capitalize text-brand-ink">{value || "-"}</dd>
    </div>
  );
}
