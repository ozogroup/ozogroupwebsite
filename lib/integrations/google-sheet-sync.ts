/**
 * Google Sheet / Apps Script Webhook Integration
 * 
 * PURPOSE: Secondary logging + email automation only.
 * PRIMARY DATABASE: Supabase (source of truth).
 * SECONDARY: Google Sheet (logging/email only).
 * 
 * RULES:
 * - Webhook called only AFTER Supabase operation succeeds.
 * - Webhook failure does NOT fail main website/admin action.
 * - No webhook calls from frontend/browser.
 * - Uses env variables only (no hardcoded URLs).
 * - Timeout protection included.
 * - Prevents duplicate sheet rows using Supabase IDs.
 */

type WebhookEvent =
  | 'booking.created'
  | 'booking.updated'
  | 'membership.created'
  | 'partner.approved'
  | 'commission.created'
  | 'commission.updated'
  | 'payout.updated';

interface WebhookPayload {
  event: WebhookEvent;
  source: 'kia-website';
  timestamp: string;
  secret: string;
  data: Record<string, unknown>;
}

const WEBHOOK_URL = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.GOOGLE_APPS_SCRIPT_SECRET;
const TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Core webhook posting function with error handling and timeout.
 * Never throws - logs errors and returns success/failure status.
 */
async function postToGoogleSheet(event: WebhookEvent, data: Record<string, unknown>): Promise<boolean> {
  // Skip if webhook URL not configured
  if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
    console.warn('[GoogleSheetSync] Webhook URL or secret not configured. Skipping sync.');
    return false;
  }

  const payload: WebhookPayload = {
    event,
    source: 'kia-website',
    timestamp: new Date().toISOString(),
    secret: WEBHOOK_SECRET,
    data,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[GoogleSheetSync] Webhook failed with status ${response.status}:`, await response.text());
      return false;
    }

    console.log(`[GoogleSheetSync] Successfully synced event: ${event}`);
    return true;
  } catch (error) {
    // Never throw - log and continue
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[GoogleSheetSync] Webhook timeout after ${TIMEOUT_MS}ms for event: ${event}`);
    } else {
      console.error(`[GoogleSheetSync] Webhook error for event ${event}:`, error);
    }
    return false;
  }
}

/**
 * Sync when a new booking is created (website booking form).
 */
export async function syncBookingCreated(booking: {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  treatment_id: string;
  treatment_name?: string;
  booking_date: string;
  booking_status: string;
  payment_status: string;
  payment_amount?: number;
  created_at: string;
}): Promise<void> {
  await postToGoogleSheet('booking.created', {
    booking_id: booking.id,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    customer_phone: booking.customer_phone,
    treatment_id: booking.treatment_id,
    treatment_name: booking.treatment_name,
    booking_date: booking.booking_date,
    booking_status: booking.booking_status,
    payment_status: booking.payment_status,
    payment_amount: booking.payment_amount,
    created_at: booking.created_at,
  });
}

/**
 * Sync when booking status/payment is updated (admin panel).
 */
export async function syncBookingUpdated(booking: {
  id: string;
  customer_name: string;
  customer_email: string;
  booking_status: string;
  payment_status: string;
  payment_amount?: number;
  updated_at: string;
}): Promise<void> {
  await postToGoogleSheet('booking.updated', {
    booking_id: booking.id,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    booking_status: booking.booking_status,
    payment_status: booking.payment_status,
    payment_amount: booking.payment_amount,
    updated_at: booking.updated_at,
  });
}

/**
 * Sync when a new membership request is created.
 */
export async function syncMembershipCreated(request: {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  created_at: string;
}): Promise<void> {
  await postToGoogleSheet('membership.created', {
    request_id: request.id,
    full_name: request.full_name,
    email: request.email,
    phone: request.phone,
    city: request.city,
    status: request.status,
    created_at: request.created_at,
  });
}

/**
 * Sync when a partner is approved (admin approval action).
 */
export async function syncPartnerApproved(partner: {
  id: string;
  partner_code: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  approved_at?: string;
}): Promise<void> {
  await postToGoogleSheet('partner.approved', {
    partner_id: partner.id,
    partner_code: partner.partner_code,
    full_name: partner.full_name,
    email: partner.email,
    phone: partner.phone,
    city: partner.city,
    approved_at: partner.approved_at || new Date().toISOString(),
  });
}

/**
 * Sync when a commission is generated (booking paid/confirmed).
 */
export async function syncCommissionCreated(commission: {
  id: string;
  booking_id: string;
  partner_id: string;
  partner_code?: string;
  partner_name?: string;
  level: number;
  amount: number;
  status: string;
  created_at: string;
}): Promise<void> {
  await postToGoogleSheet('commission.created', {
    commission_id: commission.id,
    booking_id: commission.booking_id,
    partner_id: commission.partner_id,
    partner_code: commission.partner_code,
    partner_name: commission.partner_name,
    level: commission.level,
    amount: commission.amount,
    status: commission.status,
    created_at: commission.created_at,
  });
}

/**
 * Sync when commission status is updated (admin approval/rejection).
 */
export async function syncCommissionUpdated(commission: {
  id: string;
  booking_id: string;
  partner_id: string;
  partner_code?: string;
  partner_name?: string;
  level: number;
  amount: number;
  status: string;
  updated_at: string;
}): Promise<void> {
  await postToGoogleSheet('commission.updated', {
    commission_id: commission.id,
    booking_id: commission.booking_id,
    partner_id: commission.partner_id,
    partner_code: commission.partner_code,
    partner_name: commission.partner_name,
    level: commission.level,
    amount: commission.amount,
    status: commission.status,
    updated_at: commission.updated_at,
  });
}

/**
 * Sync when payout status is updated (admin payment processing).
 */
export async function syncPayoutUpdated(payout: {
  id: string;
  partner_id: string;
  partner_code?: string;
  partner_name?: string;
  amount: number;
  status: string;
  payment_method?: string;
  payment_reference?: string;
  updated_at: string;
}): Promise<void> {
  await postToGoogleSheet('payout.updated', {
    payout_id: payout.id,
    partner_id: payout.partner_id,
    partner_code: payout.partner_code,
    partner_name: payout.partner_name,
    amount: payout.amount,
    status: payout.status,
    payment_method: payout.payment_method,
    payment_reference: payout.payment_reference,
    updated_at: payout.updated_at,
  });
}
