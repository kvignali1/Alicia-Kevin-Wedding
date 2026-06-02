const SHEET_NAME = 'RSVPs'
const DEFAULT_SHEET_NAME = 'Sheet1'

const HEADERS = [
  'Submitted At',
  'Full Name',
  'Email',
  'Phone',
  'Attending',
  'Joining Party Bus',
  'RSVP Type',
  'Linked To',
  'Message',
]

function doPost(event) {
  const data = parseRequest(event)
  const fullName = cleanText(data.fullName)
  const email = cleanText(data.email)
  const attending = cleanText(data.attending)
  const joiningPartyBus = cleanText(data.joiningPartyBus)
  const hasSpouseGuest = data.hasSpouseGuest === 'on' || data.hasSpouseGuest === true || data.hasSpouseGuest === 'true'
  const spouseName = cleanText(data.spouseName)

  if (!fullName || !email || !attending || !joiningPartyBus) {
    return jsonResponse({ ok: false, error: 'Name, email, attendance, and party bus response are required.' })
  }

  if (hasSpouseGuest && !spouseName) {
    return jsonResponse({ ok: false, error: 'Please enter your spouse guest name.' })
  }

  const sheet = getSheet()
  const submittedAt = new Date()
  const headerMap = getHeaderMap(sheet)
  const primaryRow = findPrimaryRsvpRow(sheet, headerMap, fullName, email)
  const primaryValues = makeRowValues({
    submittedAt,
    fullName,
    email,
    phone: cleanText(data.phone),
    attending,
    joiningPartyBus,
    rsvpType: 'Primary',
    linkedTo: '',
    message: cleanText(data.message),
  })

  if (primaryRow) {
    sheet.getRange(primaryRow, 1, 1, HEADERS.length).setValues([primaryValues])
  } else {
    sheet.appendRow(primaryValues)
  }

  deleteLinkedSpouseRows(sheet, headerMap, fullName)

  if (hasSpouseGuest) {
    sheet.appendRow(makeRowValues({
      submittedAt,
      fullName: spouseName,
      email: '',
      phone: '',
      attending,
      joiningPartyBus,
      rsvpType: 'Spouse Guest',
      linkedTo: fullName,
      message: `Spouse guest of ${fullName}`,
    }))
  }

  return jsonResponse({ ok: true, mode: primaryRow ? 'updated' : 'created' })
}

function makeRowValues(row) {
  return [
    row.submittedAt,
    row.fullName,
    row.email,
    row.phone,
    row.attending,
    row.joiningPartyBus,
    row.rsvpType,
    row.linkedTo,
    row.message,
  ]
}

function findPrimaryRsvpRow(sheet, headerMap, fullName, email) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) {
    return 0
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues()
  const targetEmail = normalizeEmail(email)
  const targetName = normalizeName(fullName)

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const rowType = cleanText(row[headerMap['RSVP Type']]).toLowerCase()
    const rowEmail = normalizeEmail(row[headerMap.Email])
    const rowName = normalizeName(row[headerMap['Full Name']])

    if (rowType === 'primary' && rowEmail && rowEmail === targetEmail) {
      return index + 2
    }

    if (rowType === 'primary' && !rowEmail && rowName === targetName) {
      return index + 2
    }
  }

  return 0
}

function deleteLinkedSpouseRows(sheet, headerMap, fullName) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) {
    return
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues()
  const targetName = normalizeName(fullName)

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    const rowType = cleanText(row[headerMap['RSVP Type']]).toLowerCase()
    const linkedTo = normalizeName(row[headerMap['Linked To']])

    if (rowType === 'spouse guest' && linkedTo === targetName) {
      sheet.deleteRow(index + 2)
    }
  }
}

function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  return headers.reduce((map, header, index) => {
    map[cleanText(header)] = index
    return map
  }, {})
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase()
}

function normalizeName(value) {
  return cleanText(value).replace(/\s+/g, ' ').toLowerCase()
}

function doGet(event) {
  const params = event && event.parameter ? event.parameter : {}

  if (params.action === 'count') {
    const payload = getRsvpCountPayload()
    if (params.callback) {
      return javascriptResponse(`${params.callback}(${JSON.stringify(payload)});`)
    }

    return jsonResponse(payload)
  }

  return jsonResponse({ ok: true, message: 'Wedding RSVP endpoint is live.' })
}

function getRsvpCountPayload() {
  const baseTakenSpots = 14
  const totalSpots = 50
  const sheet = getSheet()
  const headerMap = getHeaderMap(sheet)
  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return {
      ok: true,
      baseTakenSpots,
      attendingRsvps: 0,
      takenSpots: baseTakenSpots,
      totalSpots,
    }
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues()
  const attendingRsvps = rows.filter((row) => {
    return cleanText(row[headerMap.Attending]).toLowerCase() === 'yes'
  }).length

  return {
    ok: true,
    baseTakenSpots,
    attendingRsvps,
    takenSpots: baseTakenSpots + attendingRsvps,
    totalSpots,
  }
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
    sheet = spreadsheet.getSheetByName(DEFAULT_SHEET_NAME)
  }

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME)
  } else if (sheet.getName() !== SHEET_NAME) {
    sheet.setName(SHEET_NAME)
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS)
    sheet.setFrozenRows(1)
  } else {
    ensureHeaders(sheet)
  }

  return sheet
}

function ensureHeaders(sheet) {
  for (let index = 0; index < HEADERS.length; index += 1) {
    const desiredHeader = HEADERS[index]
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(cleanText)
    const currentIndex = currentHeaders.indexOf(desiredHeader)

    if (currentIndex === -1) {
      sheet.insertColumnBefore(index + 1)
      sheet.getRange(1, index + 1).setValue(desiredHeader)
    }
  }
}

function cleanText(value) {
  return String(value || '').trim()
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function javascriptResponse(source) {
  return ContentService
    .createTextOutput(source)
    .setMimeType(ContentService.MimeType.JAVASCRIPT)
}
