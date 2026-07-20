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
  secret?: string;
  data: Record<string, unknown>;
}

const TIMEOUT_MS = 10000;

/**
 * Core webhook posting function with error handling and timeout.
 * Never throws - logs errors and returns success/failure status.
 */
async function postToGoogleSheet(event: WebhookEvent, data: Record<string, unknown>): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim();

  if (!webhookUrl) {
    console.warn('[GoogleSheetSync] Webhook URL is not configured. Skipping sync.');
    return false;
  }

  if (!webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    console.error('[GoogleSheetSync] Refusing to send data to an invalid Apps Script URL.');
    return false;
  }

  const payload: WebhookPayload = {
    event,
    source: 'kia-website',
    timestamp: new Date().toISOString(),
    data,
  };
  if (webhookSecret) payload.secret = webhookSecret;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    if (!response.ok) {
      console.error(`[GoogleSheetSync] Webhook failed with status ${response.status}:`, responseText);
      return false;
    }

    if (responseText) {
      try {
        const result = JSON.parse(responseText) as { success?: boolean; error?: unknown };
        if (result.success === false || result.error) {
          console.error(`[GoogleSheetSync] Apps Script rejected event ${event}:`, result.error || result);
          return false;
        }
      } catch {
        console.error(`[GoogleSheetSync] Apps Script returned a non-JSON response for event ${event}.`);
        return false;
      }
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
  source_id: string;
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
    source_type: 'booking',
    source_id: commission.source_id,
    booking_id: commission.source_id,
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
  source_id: string;
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
    source_type: 'booking',
    source_id: commission.source_id,
    booking_id: commission.source_id,
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
  partner_email?: string;
  amount: number;
  gross_amount?: number;
  deduction_amount?: number;
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
    email: payout.partner_email,
    amount: payout.amount,
    gross_amount: payout.gross_amount,
    deduction_amount: payout.deduction_amount,
    status: payout.status,
    payment_method: payout.payment_method,
    payment_reference: payout.payment_reference,
    updated_at: payout.updated_at,
  });
}
