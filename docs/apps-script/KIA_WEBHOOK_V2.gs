/** KIA website webhook handler. Add this as WebhookV2.gs in the bound Sheet project. */
const KIA_WEBHOOK_SHEET_ID = "1t0A9zETeXQ1nSVTWCKzO1dZkntvOaBT6ParzkhAXcww";
const KIA_WEBHOOK_FALLBACK_EMAIL = "supportkiaskincare@gmail.com";
const KIA_WEBHOOK_FALLBACK_SECRET = "KIA_SKINCARE_2026_SECURE_KEY";

function doPostV2(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET") || KIA_WEBHOOK_FALLBACK_SECRET;
    if (!payload.secret || payload.secret !== expectedSecret) {
      throw new Error("Invalid webhook secret");
    }
    if (!payload.event || !payload.data) {
      throw new Error("event and data are required");
    }

    const result = kiaProcessWebhookEvent_(payload.event, payload.data);
    return kiaJson_({ success: true, status: "success", processed: true, event: payload.event, sheet: result.sheet, email_sent: result.emailSent });
  } catch (error) {
    kiaLogError_("doPostV2", error, e && e.postData ? e.postData.contents : "No payload");
    return kiaJson_({ success: false, status: "error", processed: false, error: String(error && error.message ? error.message : error) });
  }
}

function kiaProcessWebhookEvent_(eventName, data) {
  let sheet = "";
  let keyHeader = "";
  let keyValue = "";
  let values = {};

  switch (eventName) {
    case "booking.created":
    case "booking.updated":
      sheet = "Bookings";
      keyHeader = "Supabase ID";
      keyValue = data.booking_id;
      values = {
        "Booking ID": data.booking_id,
        "Created Date": data.created_at || data.updated_at,
        "Customer Name": data.customer_name,
        "Phone": data.customer_phone,
        "Email": data.customer_email,
        "Treatment/Kit": data.treatment_name || data.treatment_id,
        "Amount": data.payment_amount,
        "Referral Code": data.referral_code,
        "Payment Status": data.payment_status,
        "Booking Status": data.booking_status,
        "Supabase ID": data.booking_id
      };
      break;
    case "membership.created":
      sheet = "Membership Requests";
      keyHeader = "Supabase ID";
      keyValue = data.request_id;
      values = {
        "Request ID": data.request_id,
        "Created Date": data.created_at,
        "Name": data.full_name,
        "Phone": data.phone,
        "Email": data.email,
        "City": data.city,
        "Referrer Code": data.referral_code,
        "Status": data.status,
        "Supabase ID": data.request_id
      };
      break;
    case "partner.approved":
      sheet = "Referral Partners";
      keyHeader = "Supabase ID";
      keyValue = data.partner_id;
      values = {
        "Partner ID": data.partner_code || data.partner_id,
        "Name": data.full_name,
        "Phone": data.phone,
        "Email": data.email,
        "City": data.city,
        "Status": "active",
        "Joined Date": data.approved_at,
        "Login Email": data.email,
        "Supabase ID": data.partner_id
      };
      break;
    case "commission.created":
    case "commission.updated":
      sheet = "Commissions";
      keyHeader = "Supabase ID";
      keyValue = data.commission_id;
      values = {
        "Commission ID": data.commission_id,
        "Booking ID": data.source_id || data.booking_id,
        "Partner ID": data.partner_code || data.partner_id,
        "Partner Name": data.partner_name,
        "Level": data.level,
        "Commission Amount": data.amount,
        "Status": data.status,
        "Created Date": data.created_at || data.updated_at,
        "Supabase ID": data.commission_id
      };
      break;
    case "payout.updated":
      sheet = "Payouts";
      keyHeader = "Supabase ID";
      keyValue = data.payout_id;
      values = {
        "Payout ID": data.payout_id,
        "Partner ID": data.partner_code || data.partner_id,
        "Partner Name": data.partner_name,
        "Amount": data.amount,
        "Payment Mode": data.payment_method,
        "UPI/Bank Details": data.payment_reference,
        "Status": data.status,
        "Requested Date": data.updated_at,
        "Paid Date": String(data.status || "").toLowerCase() === "paid" ? data.updated_at : "",
        "Supabase ID": data.payout_id
      };
      break;
    default:
      throw new Error("Unsupported event: " + eventName);
  }

  if (!keyValue) throw new Error("Missing unique ID for " + eventName);
  kiaUpsertRow_(sheet, keyHeader, keyValue, values);
  const emailSent = kiaSendEventEmails_(eventName, data);
  return { sheet: sheet, emailSent: emailSent };
}

function kiaUpsertRow_(sheetName, keyHeader, keyValue, values) {
  const spreadsheet = SpreadsheetApp.openById(KIA_WEBHOOK_SHEET_ID);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName);
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(String);
  const keyIndex = headers.indexOf(keyHeader);
  if (keyIndex < 0) throw new Error("Missing header " + keyHeader + " in " + sheetName);

  let targetRow = sheet.getLastRow() + 1;
  if (sheet.getLastRow() > 1) {
    const keys = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
    for (let index = 0; index < keys.length; index++) {
      if (String(keys[index][0]) === String(keyValue)) {
        targetRow = index + 2;
        break;
      }
    }
  }

  const existing = targetRow <= sheet.getLastRow()
    ? sheet.getRange(targetRow, 1, 1, lastColumn).getValues()[0]
    : new Array(lastColumn).fill("");
  Object.keys(values).forEach(function(header) {
    const column = headers.indexOf(header);
    const value = values[header];
    if (column >= 0 && value !== undefined && value !== null && value !== "") existing[column] = value;
  });
  sheet.getRange(targetRow, 1, 1, lastColumn).setValues([existing]);
}

function kiaSendEventEmails_(eventName, data) {
  const adminSubject = "KIA Website Activity: " + eventName;
  const adminBody = kiaEventHtml_(eventName, data);
  let sent = kiaSendEmail_(KIA_WEBHOOK_FALLBACK_EMAIL, adminSubject, adminBody, eventName, kiaReferenceId_(data));

  if (data.customer_email && (eventName === "booking.created" || eventName === "booking.updated")) {
    const subject = eventName === "booking.created" ? "KIA Skin Care booking request received" : "KIA Skin Care booking update";
    sent = kiaSendEmail_(data.customer_email, subject, adminBody, eventName + ".customer", data.booking_id) || sent;
  }
  if (data.email && eventName === "membership.created") {
    sent = kiaSendEmail_(data.email, "KIA Skin Care membership request received", adminBody, eventName + ".customer", data.request_id) || sent;
  }
  return sent;
}

function kiaEventHtml_(eventName, data) {
  const rows = Object.keys(data).filter(function(key) { return data[key] !== undefined && data[key] !== null && data[key] !== ""; }).map(function(key) {
    return "<tr><td style='padding:6px 10px;border:1px solid #e6dccf;font-weight:600'>" + kiaEscapeHtml_(key.replace(/_/g, " ")) + "</td><td style='padding:6px 10px;border:1px solid #e6dccf'>" + kiaEscapeHtml_(String(data[key])) + "</td></tr>";
  }).join("");
  return "<div style='font-family:Arial,sans-serif;color:#4f4542'><h2>KIA Skin Care Website Activity</h2><p><strong>Event:</strong> " + kiaEscapeHtml_(eventName) + "</p><table style='border-collapse:collapse'>" + rows + "</table></div>";
}

function kiaSendEmail_(to, subject, htmlBody, type, relatedId) {
  if (!to || String(to).indexOf("@") < 1) return false;
  try {
    MailApp.sendEmail({ to: String(to), subject: subject, htmlBody: htmlBody, name: "KIA Skin Care" });
    kiaLogEmail_(type, to, subject, "Sent", relatedId, "");
    return true;
  } catch (error) {
    kiaLogEmail_(type, to, subject, "Failed", relatedId, String(error));
    return false;
  }
}

function kiaLogEmail_(type, to, subject, status, relatedId, errorMessage) {
  try {
    const sheet = SpreadsheetApp.openById(KIA_WEBHOOK_SHEET_ID).getSheetByName("Email Logs");
    const now = new Date();
    sheet.appendRow([Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"), Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"), type, to, "", "", subject, status, relatedId || "", errorMessage || ""]);
  } catch (ignored) {}
}

function kiaLogError_(functionName, error, payload) {
  try {
    const sheet = SpreadsheetApp.openById(KIA_WEBHOOK_SHEET_ID).getSheetByName("Error Logs");
    const now = new Date();
    sheet.appendRow([Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"), Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"), functionName, String(error), String(payload || "")]);
  } catch (ignored) {}
}

function kiaReferenceId_(data) {
  return data.booking_id || data.request_id || data.partner_id || data.commission_id || data.payout_id || "";
}

function kiaEscapeHtml_(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function kiaJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
