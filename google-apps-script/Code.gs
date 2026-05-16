const SHEET_NAME = 'RSVPs'

const HEADERS = [
  'Submitted At',
  'Full Name',
  'Email',
  'Phone',
  'Attending',
  'RSVP Type',
  'Linked To',
  'Message',
]

function doPost(event) {
  const data = parseRequest(event)
  const fullName = cleanText(data.fullName)
  const email = cleanText(data.email)
  const attending = cleanText(data.attending)
  const hasSpouseGuest = data.hasSpouseGuest === 'on' || data.hasSpouseGuest === true || data.hasSpouseGuest === 'true'
  const spouseName = cleanText(data.spouseName)

  if (!fullName || !email || !attending) {
    return jsonResponse({ ok: false, error: 'Name, email, and attendance are required.' })
  }

  if (hasSpouseGuest && !spouseName) {
    return jsonResponse({ ok: false, error: 'Please enter your spouse guest name.' })
  }

  const sheet = getSheet()
  const submittedAt = new Date()

  sheet.appendRow([
    submittedAt,
    fullName,
    email,
    cleanText(data.phone),
    attending,
    'Primary',
    '',
    cleanText(data.message),
  ])

  if (hasSpouseGuest) {
    sheet.appendRow([
      submittedAt,
      spouseName,
      '',
      '',
      attending,
      'Spouse Guest',
      fullName,
      `Spouse guest of ${fullName}`,
    ])
  }

  return jsonResponse({ ok: true })
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Wedding RSVP endpoint is live.' })
}

function parseRequest(event) {
  if (!event || !event.postData) {
    return {}
  }

  if (event.postData.type === 'application/json') {
    return JSON.parse(event.postData.contents || '{}')
  }

  return event.parameter || {}
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getSheetByName(SHEET_NAME)

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME)
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS)
    sheet.setFrozenRows(1)
  }

  return sheet
}

function cleanText(value) {
  return String(value || '').trim()
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
