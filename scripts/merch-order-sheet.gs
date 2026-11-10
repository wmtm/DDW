/**
 * Receives merch order requests from the site's "Commander" form
 * (src/MerchPage.tsx) and appends each one as a row in this spreadsheet —
 * the tracking sheet the client uses to confirm payment and place the
 * print order with whichever local supplier they choose. Not run by any
 * build or CI step: this file is pasted into the Google Sheet's own Apps
 * Script editor and deployed from there (see setup steps below). It isn't
 * part of the site's TypeScript build.
 *
 * One-time setup (for the site owner, not a developer task):
 *
 * 1. Open the tracking Google Sheet.
 * 2. In the top menu: Extensions → Apps Script. A new tab opens with an
 *    empty Code.gs file.
 * 3. Delete anything in Code.gs and paste this file's contents in its
 *    place, then save (the save icon, or Ctrl/Cmd+S).
 * 4. Click Deploy → New deployment.
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: anything, e.g. "Merch order intake".
 *    - Execute as: Me (your own account).
 *    - Who has access: Anyone.
 *    - Click Deploy, then authorize it with your Google account when
 *      prompted (it's your own script, acting only on this one sheet).
 * 5. Copy the "Web app URL" it gives you — it looks like
 *    https://script.google.com/macros/s/AKfycb.../exec
 * 6. Send that URL back so it can be set as ORDER_SHEET_WEBHOOK_URL in
 *    src/MerchPage.tsx — until then the order form shows a friendly
 *    "orders aren't open yet" message instead of failing silently.
 *
 * If you ever need to change this script later, edit it in the same
 * Apps Script editor and use Deploy → Manage deployments → edit (pencil
 * icon) → New version, rather than creating a brand new deployment —
 * that keeps the same URL so the site doesn't need updating again.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
  var data = JSON.parse(e.postData.contents)

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Horodatage',
      'Article',
      'Quantité',
      'Taille / précisions',
      'Nom',
      'Contact',
      'Livraison',
      'Mode de paiement',
      'Référence de paiement',
      'Statut',
    ])
  }

  sheet.appendRow([
    new Date(),
    data.item || '',
    data.quantity || '',
    data.notes || '',
    data.name || '',
    data.contact || '',
    data.delivery || '',
    data.paymentMethod || '',
    data.paymentReference || '',
    'En attente',
  ])

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON,
  )
}
