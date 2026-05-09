"use client";

import { useState, useEffect } from "react";
import { getBookings, updateBookingStatus, deleteBooking } from "@/lib/actions/bookings";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    const data = await getBookings();
    setBookings(data);
    setLoading(false);
  }

  async function handleUpdateStatus(id: string, status: string, adminNote?: string) {
    try {
      await updateBookingStatus(id, status, adminNote);
      await loadBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Error updating booking status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await deleteBooking(id);
      await loadBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Error deleting booking");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Bookings</h1>
        <p className="text-sm text-brand-muted">Manage treatment bookings</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-brand-surface/50 border-b border-brand-border">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Customer</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Phone</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Treatment</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">City</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Date</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">📅</span>
                    <p className="text-brand-muted">No bookings found</p>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-medium text-brand-ink">{booking.name}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{booking.phone}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{booking.treatment_name || booking.treatment_id}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{booking.city}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">
                    {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={booking.status}
                        onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                        className="px-2 py-1.5 text-xs border border-brand-border rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
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
