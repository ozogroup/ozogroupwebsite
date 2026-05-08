/**
 * Bookings data access layer (placeholder).
 *
 * Will expose:
 *  - createBooking(payload)
 *  - listBookingsForAdmin(filters)
 *  - listBookingsForPartner(partnerId)
 *  - updateBookingStatus(id, status)
 *
 * Implementation pending creation of `bookings` table.
 */

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
