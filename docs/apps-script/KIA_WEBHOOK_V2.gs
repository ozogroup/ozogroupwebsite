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
        "Email": data.email,
        "Gross Amount": data.gross_amount || data.amount,
        "Deduction": data.deduction_amount || 0,
        "Net Amount": data.amount,
        "Payment Mode": data.payment_method,
        "Bank Holder": data.bank_account_holder || "",
        "Account Number": data.bank_account_number || "",
        "IFSC": data.bank_ifsc || "",
        "Bank Name": data.bank_name || "",
        "UPI ID": data.upi_id || "",
        "KIA Payout ID": data.kia_payout_id || "",
        "UTR/Reference": data.payment_reference || "",
        "Status": data.status,
        "Requested Date": data.updated_at,
        "Paid Date": String(data.status || "").toLowerCase() === "paid" ? data.updated_at : "",
        "Supabase ID": data.payout_id
      };
      break;
    case "kyc.submitted":
      sheet = "KYC Submissions";
      keyHeader = "Supabase ID";
      keyValue = data.partner_id;
      values = {
        "Partner ID": data.partner_code || data.partner_id,
        "Name": data.full_name,
        "Email": data.email,
        "Phone": data.phone,
        "Payment Method": data.payment_method,
        "Bank Holder": data.bank_account_holder || "",
        "Account Number": data.bank_account_number || "",
        "IFSC": data.bank_ifsc || "",
        "Bank Name": data.bank_name || "",
        "Branch": data.bank_branch_name || "",
        "UPI ID": data.upi_id || "",
        "UPI Holder": data.upi_holder_name || "",
        "Submitted Date": data.submitted_at,
        "Supabase ID": data.partner_id
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
  if (data.email && eventName === "partner.approved") {
    sent = kiaSendEmail_(data.email, "Welcome to KIA Skin Care — Your Partner ID: " + (data.partner_code || ""), kiaPartnerWelcomeHtml_(data), eventName + ".partner", data.partner_id) || sent;
  }
  if (data.email && eventName === "payout.updated" && String(data.status || "").toLowerCase() === "paid") {
    sent = kiaSendEmail_(data.email, "KIA Skin Care — Payout Processed Successfully", kiaPayoutPaidHtml_(data), eventName + ".partner", data.payout_id) || sent;
  }
  return sent;
}

function kiaPartnerWelcomeHtml_(data) {
  var name = kiaEscapeHtml_(data.full_name || "Partner");
  var code = kiaEscapeHtml_(data.partner_code || "N/A");
  var email = kiaEscapeHtml_(data.email || "");
  return '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;color:#3f3632">'
    + '<div style="background:linear-gradient(135deg,#4F4542,#6F625C);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center">'
    + '<h1 style="color:#f6e7b6;font-size:28px;margin:0">KIA Skin Care</h1>'
    + '<p style="color:#e0d8cc;margin:8px 0 0;font-size:14px">Premium Skincare Partner Program</p>'
    + '</div>'
    + '<div style="background:#ffffff;padding:32px 24px;border:1px solid #e0d8cc;border-top:none">'
    + '<h2 style="color:#4F4542;margin:0 0 16px">Welcome, ' + name + '!</h2>'
    + '<p style="font-size:15px;line-height:1.6;color:#5a4a3a">Congratulations! Your KIA Skin Care Partner membership has been approved. You are now part of our premium skincare referral network.</p>'
    + '<div style="background:#f9f6f0;border:2px solid #d4c5a0;border-radius:12px;padding:24px;margin:24px 0;text-align:center">'
    + '<p style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#8b7355;margin:0 0 8px">Your Partner ID</p>'
    + '<p style="font-size:36px;font-weight:700;color:#4F4542;margin:0;font-family:monospace;letter-spacing:3px">' + code + '</p>'
    + '</div>'
    + '<div style="background:#f4eee4;border-radius:8px;padding:16px;margin:16px 0">'
    + '<p style="margin:0 0 8px;font-weight:600;color:#4F4542">Your Login Details:</p>'
    + '<p style="margin:4px 0;font-size:14px"><strong>Portal:</strong> <a href="https://kiaskincare.com/partner/login" style="color:#8b7355">kiaskincare.com/partner/login</a></p>'
    + '<p style="margin:4px 0;font-size:14px"><strong>Email:</strong> ' + email + '</p>'
    + '<p style="margin:4px 0;font-size:14px"><strong>Password:</strong> The password you set during registration</p>'
    + '</div>'
    + '<h3 style="color:#4F4542;margin:24px 0 12px">What You Can Do Now:</h3>'
    + '<ul style="font-size:14px;line-height:1.8;color:#5a4a3a;padding-left:20px">'
    + '<li>Share your referral link and earn on every booking</li>'
    + '<li>Refer new members and earn Rs. 500 per approved membership</li>'
    + '<li>Track your team, income, and payouts in your dashboard</li>'
    + '<li>Complete your KYC to unlock payout requests</li>'
    + '</ul>'
    + '<div style="text-align:center;margin:32px 0 16px">'
    + '<a href="https://kiaskincare.com/partner/dashboard" style="display:inline-block;background:#4F4542;color:#f6e7b6;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Open Your Dashboard</a>'
    + '</div>'
    + '</div>'
    + '<div style="background:#f4eee4;padding:16px 24px;border-radius:0 0 16px 16px;text-align:center;font-size:12px;color:#8b7355">'
    + '<p style="margin:0">KIA Skin Care | Premium Partner Program</p>'
    + '<p style="margin:4px 0 0">Questions? Contact us at supportkiaskincare@gmail.com</p>'
    + '</div></div>';
}

function kiaPayoutPaidHtml_(data) {
  var name = kiaEscapeHtml_(data.partner_name || "Partner");
  var code = kiaEscapeHtml_(data.partner_code || "");
  var amount = Number(data.amount || 0).toLocaleString("en-IN");
  var gross = Number(data.gross_amount || data.amount || 0).toLocaleString("en-IN");
  var deduction = Number(data.deduction_amount || 0).toLocaleString("en-IN");
  var ref = kiaEscapeHtml_(data.payment_reference || "N/A");
  var kiaPayId = kiaEscapeHtml_(data.kia_payout_id || ref);
  var method = kiaEscapeHtml_(data.payment_method || "bank");
  var date = data.updated_at ? new Date(data.updated_at).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"}) : new Date().toLocaleDateString("en-IN");
  var maskedDest = "";
  if (method.toLowerCase() === "upi" && data.upi_id) {
    var parts = String(data.upi_id).split("@");
    maskedDest = (parts[0].length > 4 ? "XXXX" + parts[0].slice(-4) : parts[0]) + "@" + (parts[1] || "upi");
  } else if (data.bank_account_number) {
    var acc = String(data.bank_account_number);
    maskedDest = (data.bank_name ? kiaEscapeHtml_(data.bank_name) + " - " : "") + "XXXX" + acc.slice(-4);
  }
  return '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;color:#3f3632">'
    + '<div style="background:linear-gradient(135deg,#047857,#065f46);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center">'
    + '<h1 style="color:#ffffff;font-size:28px;margin:0">Payout Processed</h1>'
    + '<p style="color:#a7f3d0;margin:8px 0 0;font-size:14px">KIA Skin Care Partner Program</p>'
    + '</div>'
    + '<div style="background:#ffffff;padding:32px 24px;border:1px solid #e0d8cc;border-top:none">'
    + '<h2 style="color:#047857;margin:0 0 16px">Hello, ' + name + '!</h2>'
    + '<p style="font-size:15px;line-height:1.6;color:#5a4a3a">Great news! Your payout has been successfully processed and transferred to your registered ' + method.toUpperCase() + ' account.</p>'
    + '<div style="background:#ecfdf5;border:2px solid #a7f3d0;border-radius:12px;padding:24px;margin:24px 0;text-align:center">'
    + '<p style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#047857;margin:0 0 8px">Amount Credited</p>'
    + '<p style="font-size:36px;font-weight:700;color:#047857;margin:0">Rs. ' + amount + '</p>'
    + '</div>'
    + '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">KIA Payout ID</td><td style="padding:10px;border-bottom:1px solid #e0d8cc;font-weight:700;font-family:monospace;color:#047857">' + kiaPayId + '</td></tr>'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">Partner ID</td><td style="padding:10px;border-bottom:1px solid #e0d8cc;font-weight:600">' + code + '</td></tr>'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">Payout Date</td><td style="padding:10px;border-bottom:1px solid #e0d8cc;font-weight:600">' + date + '</td></tr>'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">Gross Amount</td><td style="padding:10px;border-bottom:1px solid #e0d8cc;font-weight:600">Rs. ' + gross + '</td></tr>'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">15% Deduction</td><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#dc2626">- Rs. ' + deduction + '</td></tr>'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">Net Paid</td><td style="padding:10px;border-bottom:1px solid #e0d8cc;font-weight:700;color:#047857">Rs. ' + amount + '</td></tr>'
    + '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">Payment Mode</td><td style="padding:10px;border-bottom:1px solid #e0d8cc">' + method.toUpperCase() + '</td></tr>'
    + (maskedDest ? '<tr><td style="padding:10px;border-bottom:1px solid #e0d8cc;color:#8b7355">Credited To</td><td style="padding:10px;border-bottom:1px solid #e0d8cc">' + maskedDest + '</td></tr>' : '')
    + '</table>'
    + '<p style="font-size:13px;color:#8b7355;margin:16px 0 0">Your wallet has been reset. Continue sharing and earning — new commissions will be credited automatically!</p>'
    + '<div style="text-align:center;margin:32px 0 16px">'
    + '<a href="https://kiaskincare.com/partner/dashboard" style="display:inline-block;background:#047857;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">View Dashboard</a>'
    + '</div>'
    + '</div>'
    + '<div style="background:#ecfdf5;padding:16px 24px;border-radius:0 0 16px 16px;text-align:center;font-size:12px;color:#047857">'
    + '<p style="margin:0">KIA Skin Care | Premium Partner Program</p>'
    + '<p style="margin:4px 0 0">Questions? Contact us at supportkiaskincare@gmail.com</p>'
    + '</div></div>';
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
