const SHEET_NAME = 'RSVPs'
const DEFAULT_SHEET_NAME = 'Sheet1'
const SPREADSHEET_ID = '1ALh0r85_RGQI1NOB8hrPLdQ1TVvcozUdlmoF1AsG06k'
const COMMENTS_SHEET_NAME = 'Guest Comments'
const PHOTOS_SHEET_NAME = 'Guest Photos'
const PHOTO_FOLDER_NAME = 'Wedding Guest Photo Uploads'

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

const COMMENT_HEADERS = [
  'Submitted At',
  'Name',
  'Message',
  'Visible',
]

const PHOTO_HEADERS = [
  'Submitted At',
  'Name',
  'Caption',
  'File Name',
  'File ID',
  'Image URL',
  'Visible',
]

function doPost(event) {
  const data = parseRequest(event)
  const action = cleanText(data.action).toLowerCase()

  if (action === 'comment') {
    return handleCommentPost(data)
  }

  if (action === 'photo') {
    return handlePhotoPost(data)
  }

  const fullName = cleanText(data.fullName)
  const email = cleanText(data.email)
  const attending = cleanText(data.attending)
  const joiningPartyBus = cleanText(data.joiningPartyBus)

  if (!fullName || !email || !attending || !joiningPartyBus) {
    return jsonResponse({ ok: false, error: 'Name, email, attendance, and party bus response are required.' })
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

  if (params.action === 'comments') {
    const payload = getGuestCommentsPayload()
    if (params.callback) {
      return javascriptResponse(`${params.callback}(${JSON.stringify(payload)});`)
    }

    return jsonResponse(payload)
  }

  if (params.action === 'photos') {
    const payload = getGuestPhotosPayload()
    if (params.callback) {
      return javascriptResponse(`${params.callback}(${JSON.stringify(payload)});`)
    }

    return jsonResponse(payload)
  }

  return jsonResponse({ ok: true, message: 'Wedding RSVP endpoint is live.' })
}

function getRsvpCountPayload() {
  const totalSpots = 50
  const sheet = getSheet()
  const headerMap = getHeaderMap(sheet)
  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return {
      ok: true,
      baseTakenSpots: 0,
      attendingRsvps: 0,
      takenSpots: 0,
      totalSpots,
    }
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues()
  const attendingRsvps = rows.filter((row) => {
    return cleanText(row[headerMap.Attending]).toLowerCase() === 'yes'
  }).length

  return {
    ok: true,
    baseTakenSpots: 0,
    attendingRsvps,
    takenSpots: attendingRsvps,
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

function handleCommentPost(data) {
  const name = cleanText(data.name)
  const message = cleanText(data.message)

  if (!name || !message) {
    return jsonResponse({ ok: false, error: 'Name and message are required.' })
  }

  const sheet = getNamedSheet(COMMENTS_SHEET_NAME, COMMENT_HEADERS)
  sheet.appendRow([new Date(), name, message, 'Yes'])

  return jsonResponse({ ok: true })
}

function handlePhotoPost(data) {
  const name = cleanText(data.name)
  const caption = cleanText(data.caption)
  const fileName = cleanText(data.fileName) || `guest-photo-${Date.now()}.jpg`
  const mimeType = cleanText(data.mimeType) || 'image/jpeg'
  const photoData = cleanText(data.photoData)

  if (!name || !photoData) {
    return jsonResponse({ ok: false, error: 'Name and photo are required.' })
  }

  const folder = getGuestPhotoFolder()
  const bytes = Utilities.base64Decode(photoData)
  const blob = Utilities.newBlob(bytes, mimeType, fileName)
  const file = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

  const fileId = file.getId()
  const imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
  const sheet = getNamedSheet(PHOTOS_SHEET_NAME, PHOTO_HEADERS)
  sheet.appendRow([new Date(), name, caption, fileName, fileId, imageUrl, 'Yes'])

  return jsonResponse({ ok: true, imageUrl })
}

function getGuestCommentsPayload() {
  const sheet = getNamedSheet(COMMENTS_SHEET_NAME, COMMENT_HEADERS)
  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return { ok: true, comments: [] }
  }

  const headerMap = getHeaderMap(sheet)
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues()
  const comments = rows
    .filter((row) => cleanText(row[headerMap.Visible]).toLowerCase() !== 'no')
    .map((row) => ({
      submittedAt: formatDate(row[headerMap['Submitted At']]),
      name: cleanText(row[headerMap.Name]),
      message: cleanText(row[headerMap.Message]),
    }))
    .filter((comment) => comment.name && comment.message)
    .reverse()

  return { ok: true, comments }
}

function getGuestPhotosPayload() {
  const sheet = getNamedSheet(PHOTOS_SHEET_NAME, PHOTO_HEADERS)
  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return { ok: true, photos: [] }
  }

  const headerMap = getHeaderMap(sheet)
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues()
  const photos = rows
    .filter((row) => cleanText(row[headerMap.Visible]).toLowerCase() !== 'no')
    .map((row) => ({
      submittedAt: formatDate(row[headerMap['Submitted At']]),
      name: cleanText(row[headerMap.Name]),
      caption: cleanText(row[headerMap.Caption]),
      imageUrl: cleanText(row[headerMap['Image URL']]),
    }))
    .filter((photo) => photo.name && photo.imageUrl)
    .reverse()

  return { ok: true, photos }
}

function getSheet() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet()
  const preferredSheet = spreadsheet.getSheetByName(SHEET_NAME)
  const defaultSheet = spreadsheet.getSheetByName(DEFAULT_SHEET_NAME)
  const activeSheet = spreadsheet.getActiveSheet()
  const firstSheet = spreadsheet.getSheets()[0]
  const candidates = [preferredSheet, defaultSheet, activeSheet, firstSheet].filter(Boolean)
  let sheet = candidates.find((candidate) => candidate.getLastRow() > 1)

  if (!sheet) {
    sheet = preferredSheet || defaultSheet || activeSheet
  }

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME)
  } else if (sheet.getName() !== SHEET_NAME && !preferredSheet) {
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

function getNamedSheet(sheetName, headers) {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getSheetByName(sheetName)

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers)
    sheet.setFrozenRows(1)
  } else {
    ensureHeadersForSheet(sheet, headers)
  }

  return sheet
}

function getGuestPhotoFolder() {
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME)
  if (folders.hasNext()) {
    return folders.next()
  }

  return DriveApp.createFolder(PHOTO_FOLDER_NAME)
}

function ensureHeaders(sheet) {
  ensureHeadersForSheet(sheet, HEADERS)
}

function ensureHeadersForSheet(sheet, headers) {
  for (let index = 0; index < headers.length; index += 1) {
    const desiredHeader = headers[index]
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

function formatDate(value) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return cleanText(value)
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
