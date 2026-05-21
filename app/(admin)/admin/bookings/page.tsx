"use client";

import { useEffect, useState } from "react";
import { deleteBooking, getBookings, updateBookingStatus } from "@/lib/actions/bookings";
import Breadcrumb from "@/components/admin/Breadcrumb";

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
      case "pending":
        return "bg-blue-100 text-blue-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function getBookingStatus(booking: any) {
    return booking.booking_status || "pending";
  }

  function getCustomerContact(booking: any) {
    return booking.customer_phone || booking.customer_email || "N/A";
  }

  function getTreatmentTitle(booking: any) {
    return booking.treatment?.title || booking.treatment_name || "N/A";
  }

  function getLinkedPartner(booking: any) {
    return booking.referred_partner?.partner_code || booking.referral_code || "N/A";
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
      <Breadcrumb items={[{ label: "Bookings" }]} />
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Bookings</h1>
        <p className="text-sm text-brand-muted">Manage treatment bookings and referral-linked sales</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:hidden divide-y divide-slate-200">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No bookings found</div>
          ) : (
            bookings.map((booking: any) => {
              const status = getBookingStatus(booking);
              return (
                <article key={booking.id} className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 break-words">{booking.customer_name || "Unnamed customer"}</p>
                      <p className="mt-1 text-xs text-slate-500 break-words">{getCustomerContact(booking)}</p>
                    </div>
                    <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase text-slate-400">Treatment</p>
                      <p className="font-medium text-slate-800">{getTreatmentTitle(booking)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Amount</p>
                      <p className="font-medium text-slate-800">₹{Number(booking.payment_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Date</p>
                      <p className="font-medium text-slate-800">{booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Time</p>
                      <p className="font-medium text-slate-800">{booking.preferred_time || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs uppercase text-slate-400">Referral / Partner</p>
                      <p className="font-medium text-slate-800">{getLinkedPartner(booking)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(booking.id, status === "confirmed" ? "pending" : "confirmed")}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                    >
                      {status === "confirmed" ? "Mark Pending" : "Confirm"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(booking.id, "completed")}
                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Treatment</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Referral</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">No bookings found</td>
                </tr>
              ) : (
                bookings.map((booking: any) => {
                  const status = getBookingStatus(booking);
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 md:px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{booking.customer_name || "Unnamed customer"}</p>
                        <p className="text-xs text-slate-500">{getCustomerContact(booking)}</p>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-900">{getTreatmentTitle(booking)}</td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-600">
                        {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-600">{booking.preferred_time || "N/A"}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium min-w-[80px] justify-center ${getStatusColor(status)}`}>
                          {status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{getLinkedPartner(booking)}</p>
                        {booking.referral_code && <p className="text-xs text-slate-500">Code: {booking.referral_code}</p>}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-medium text-slate-900">
                        ₹{Number(booking.payment_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, status === "confirmed" ? "pending" : "confirmed")}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                            title={status === "confirmed" ? "Mark pending" : "Confirm"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "completed")}
                            className="p-2 rounded-lg hover:bg-green-50 transition-colors text-slate-600 hover:text-green-700"
                            title="Complete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
