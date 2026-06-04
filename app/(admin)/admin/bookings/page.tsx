"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { deleteBooking, getBookings, updateBookingStatus } from "@/lib/actions/bookings";

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setBookings(await getBookings());
    setLoading(false);
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await updateBookingStatus(id, status);
      await loadBookings();
    } catch {
      alert("Error updating booking status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    await deleteBooking(id);
    await loadBookings();
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Bookings" }]} />
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Bookings</h1>
        <p className="text-sm text-brand-muted">Manage treatment and kit bookings.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Treatment / Kit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Booking Date &amp; Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Referral</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No bookings found</td></tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-900">{booking.customer_name}</p>
                      <p className="text-xs text-slate-500">{booking.customer_phone || booking.customer_email || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {booking.treatment_name || booking.treatment?.title || "N/A"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatBookingDateTime(booking.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {booking.partner_code || booking.referral_code || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      ₹{Number(booking.payment_amount || booking.treatment_price || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        booking.booking_status === "confirmed" ? "bg-green-100 text-green-700" :
                        booking.booking_status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        booking.booking_status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-brand-light text-brand-primaryDark"
                      }`}>
                        {booking.booking_status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={booking.booking_status || "pending"}
                          onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                          className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-accent outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="px-3 py-1.5 text-xs rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
