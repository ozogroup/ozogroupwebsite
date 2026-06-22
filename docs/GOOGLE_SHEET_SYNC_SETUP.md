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

# Secret key for webhook authentication (shared with Apps Script)
GOOGLE_APPS_SCRIPT_SECRET=your-secret-key-here
```

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

### Example Apps Script Handler

```javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Verify secret
    if (payload.secret !== PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET')) {
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
- **Payload includes:** commission_id, booking_id, partner_id, partner_code, partner_name, level, amount, status, created_at

### 6. Commission Updated
- **Triggered when:** Admin approves, rejects, or reverts commission status
- **Payload includes:** commission_id, booking_id, partner_id, partner_code, partner_name, level, amount, status, updated_at

### 7. Payout Updated
- **Triggered when:** Admin updates payout status (processing, paid, rejected)
- **Payload includes:** payout_id, partner_id, partner_code, partner_name, amount, status, payment_method, payment_reference, updated_at

## Failure Handling

The integration is designed to be **non-blocking**:

- Webhook calls are made **after** Supabase operations succeed
- Webhook failures are **logged but do not fail** the main action
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
