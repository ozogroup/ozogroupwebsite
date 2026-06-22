# Google Sheet / Apps Script Integration Setup

## Overview

This integration connects the KIA Skin Care admin system to a Google Sheet via Google Apps Script Webhook for secondary logging and email automation.

**Important:**
- **Supabase is the PRIMARY database** (source of truth)
- **Google Sheet is SECONDARY** (logging + email automation only)
- Admin panel remains the approval source
- Do not make Sheet source of truth
- Booking/referral/commission flow works even if Google Sheet is down

## Environment Variables

Add the following environment variables to your `.env.local` or production environment:

```bash
# Google Apps Script Webhook URL
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzUH44o7o4yep2fo4NlkvjGhKcdQMGcUOO6rug7GMgo8TZfV4tAHDz2Hu9jGPUDe7Ot/exec

# Deployment metadata (not called directly by Next.js)
GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID=AKfycbzUH44o7o4yep2fo4NlkvjGhKcdQMGcUOO6rug7GMgo8TZfV4tAHDz2Hu9jGPUDe7Ot
GOOGLE_APPS_SCRIPT_LIBRARY_URL=https://script.google.com/macros/library/d/1vR-qQQXucD_fX7R48Hk-h1VSoLntLP33zig9tB_Wh80V-zyvuJVZZ4y_/2

# Secret key for webhook authentication (shared with Apps Script)
GOOGLE_APPS_SCRIPT_SECRET=your-secret-key-here
```

Only `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` is required for transport. The shared secret is strongly recommended and must match the Apps Script `WEBHOOK_SECRET` script property when enabled. The library URL is used inside an Apps Script project; it is not a webhook and must never be called from the browser.

Add the same server-only values to the Production, Preview, and Development environments in Vercel, then redeploy. Do not prefix them with `NEXT_PUBLIC_`.

### Setting the Secret

1. Generate a secure random string (e.g., using `openssl rand -hex 32` or a password manager)
2. Set this as `GOOGLE_APPS_SCRIPT_SECRET` in your environment
3. Update the Apps Script code to verify this secret in incoming requests

## Apps Script Setup

### Web App URL

The provided Web App URL is:
```
https://script.google.com/macros/s/AKfycbzUH44o7o4yep2fo4NlkvjGhKcdQMGcUOO6rug7GMgo8TZfV4tAHDz2Hu9jGPUDe7Ot/exec
```

### Apps Script Code Structure

Your Apps Script should:

1. **Verify the secret** - Check `payload.secret` matches your configured secret
2. **Handle events** - Process different event types:
   - `booking.created` - Log new booking
   - `booking.updated` - Log booking status/payment changes
   - `membership.created` - Log new membership request
   - `partner.approved` - Log partner approval
   - `commission.created` - Log new commission
   - `commission.updated` - Log commission status changes
   - `payout.updated` - Log payout status changes

3. **Prevent duplicates** - Use Supabase IDs (booking_id, commission_id, etc.) as unique keys in the Sheet
4. **Return success** - Return HTTP 200 on success
5. **Return JSON** - Return `{ "success": true }` after the Sheet write and email action complete. Return `{ "success": false, "error": "..." }` on failure.
6. **Send booking emails** - For `booking.created`, send a confirmation to `data.customer_email`. For `booking.updated`, send a status/payment update only when the email is present. Apps Script must use `MailApp.sendEmail` or the supplied library for the actual delivery.

### Example Apps Script Handler

```javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Verify the secret when WEBHOOK_SECRET is configured.
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (expectedSecret && payload.secret !== expectedSecret) {
      return ContentService.createTextOutput(JSON.stringify({error: 'Invalid secret'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle event based on type
    switch (payload.event) {
      case 'booking.created':
        handleBookingCreated(payload.data);
        break;
      case 'booking.updated':
        handleBookingUpdated(payload.data);
        break;
      // ... handle other events
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Synced Events

### 1. Booking Created
- **Triggered when:** Customer submits booking form on website
- **Payload includes:** booking_id, customer_name, customer_email, customer_phone, treatment_id, treatment_name, booking_date, booking_status, payment_status, payment_amount, created_at

### 2. Booking Updated
- **Triggered when:** Admin updates booking status or payment status
- **Payload includes:** booking_id, customer_name, customer_email, booking_status, payment_status, payment_amount, updated_at

### 3. Membership Created
- **Triggered when:** New membership request is submitted
- **Payload includes:** request_id, full_name, email, phone, city, status, created_at

### 4. Partner Approved
- **Triggered when:** Admin approves a membership request (partner becomes active)
- **Payload includes:** partner_id, partner_code, full_name, email, phone, city, approved_at

### 5. Commission Created
- **Triggered when:** Booking is paid/confirmed and commissions are generated
   - **Payload includes:** commission_id, source_type, source_id, booking_id (legacy Sheet alias), partner_id, partner_code, partner_name, level, amount, status, created_at

### 6. Commission Updated
- **Triggered when:** Admin approves, rejects, or reverts commission status
   - **Payload includes:** commission_id, source_type, source_id, booking_id (legacy Sheet alias), partner_id, partner_code, partner_name, level, amount, status, updated_at

### 7. Payout Updated
- **Triggered when:** Admin updates payout status (processing, paid, rejected)
- **Payload includes:** payout_id, partner_id, partner_code, partner_name, amount, status, payment_method, payment_reference, updated_at

## Failure Handling

The integration is designed to be **failure-isolated**:

- Webhook calls are made **after** Supabase operations succeed
- The server waits for the secondary webhook so Vercel does not terminate an unfinished request
- Webhook failures are **logged but do not roll back** the successful Supabase action
- Customer booking flow continues smoothly even if Google Sheet is down
- Admin operations continue even if webhook fails
- 10-second timeout protection prevents hanging

### Error Logging

All webhook errors are logged to the console with clear event identification:
```
[GoogleSheetSync] Webhook error for event booking.created: [error details]
[GoogleSheetSync] Webhook timeout after 10000ms for event: commission.updated
```

## Testing

### Test Booking Created

1. Submit a booking through the website form
2. Check Supabase bookings table - booking should be created
3. Check Google Sheet - new row should appear with booking details
4. Check server logs - should see "Successfully synced event: booking.created"

### Test Booking Updated

1. Go to admin bookings page
2. Update booking status or payment status
3. Check Supabase - booking should be updated
4. Check Google Sheet - row should be updated
5. Check server logs - should see "Successfully synced event: booking.updated"

### Test Partner Approved

1. Go to admin memberships page
2. Approve a pending membership request
3. Check Supabase - partner status should be "active"
4. Check Google Sheet - new partner approval row should appear
5. Check server logs - should see "Successfully synced event: partner.approved"

### Test Commission Updated

1. Go to admin commissions page
2. Approve a pending commission
3. Check Supabase - commission status should be "approved", wallet credited
4. Check Google Sheet - commission row should be updated
5. Check server logs - should see "Successfully synced event: commission.updated"

### Test Payout Updated

1. Go to admin payouts page
2. Mark a payout as "paid"
3. Check Supabase - payout status should be "paid", wallet debited, commissions marked paid
4. Check Google Sheet - payout row should be updated
5. Check server logs - should see "Successfully synced event: payout.updated"

## Primary vs Secondary

### Primary (Supabase)
- **Source of truth** for all data
- All CRUD operations happen here first
- Admin panel reads/writes from Supabase
- Website reads from Supabase
- Wallet balances calculated from Supabase
- Commission lifecycle managed in Supabase

### Secondary (Google Sheet)
- **Logging only** - for record keeping
- **Email automation** - can trigger emails based on events
- **Reporting** - can be used for custom reports
- **Backup** - serves as a secondary data copy
- **Never** used as source of truth
- **Never** used for admin panel operations

## Email Delivery

The website sends the customer email address and complete booking context to Apps Script immediately after Supabase succeeds. Email delivery is performed by the deployed Apps Script, not by the browser or Supabase. Verify the Apps Script execution log after a test booking and confirm that the deployment owner has authorized Gmail/MailApp permissions. If the script writes the Sheet but no email arrives, the fault is in the Apps Script handler or its authorization/quota, not the Next.js webhook transport.

## Security

- Webhook calls are server-side only (no browser calls)
- Secret key authentication required
- No hardcoded URLs in components
- Environment variables only
- Timeout protection (10 seconds)
- Error handling prevents data leakage

## Troubleshooting

### Webhook not receiving data
- Check `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` is set correctly
- Check Apps Script is deployed as Web App with "Anyone" access
- Check Apps Script is not throwing errors
- Check server logs for webhook errors

### Duplicate rows in Sheet
- Ensure Apps Script uses Supabase IDs as unique keys
- Check Apps Script deduplication logic
- Verify payload contains correct IDs

### Webhook timing out
- Check Apps Script execution time
- Reduce Apps Script processing complexity
- Check network connectivity
- Timeout is set to 10 seconds - adjust if needed

### Secret verification failing
- Ensure `GOOGLE_APPS_SCRIPT_SECRET` matches Apps Script property
- Check secret is not truncated or has extra spaces
- Verify Apps Script reads secret correctly

## Files Modified

- `lib/integrations/google-sheet-sync.ts` - New webhook integration service
- `lib/actions/bookings.ts` - Added sync calls for booking create/update
- `lib/actions/memberships.ts` - Added sync calls for membership create/partner approve
- `lib/actions/referral-tracking.ts` - Added sync call for commission create
- `lib/actions/commissions.ts` - Added sync calls for commission status updates
- `lib/actions/payouts.ts` - Added sync calls for payout status updates
