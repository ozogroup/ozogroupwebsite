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

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Treatment</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Time</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Amount</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {bookings.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 md:px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{booking.name}</p>
                      <p className="text-xs text-slate-500 md:hidden">{booking.treatment_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{booking.phone || booking.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-900">{booking.treatment_name || 'N/A'}</p>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                    <p className="text-sm text-slate-600">
                      {booking.date ? new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </p>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                    <p className="text-sm text-slate-600">{booking.time || 'N/A'}</p>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium min-w-[80px] text-center ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                    <p className="text-sm font-medium text-slate-900">₹{booking.total_amount?.toLocaleString() || '0'}</p>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(booking.id, booking.status === 'new' ? 'confirmed' : 'new')}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                        title={booking.status === 'new' ? 'Confirm' : 'Mark as new'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-600 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
