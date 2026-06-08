import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 4000)
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me'
const dataDir = path.join(__dirname, 'data')
const rsvpFile = path.join(dataDir, 'rsvps.json')

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    ...headers,
  })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

const readJsonBody = async (req) => {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

const readFormBody = async (req) => {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
}

const readRsvps = async () => {
  try {
    const data = await readFile(rsvpFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

const writeRsvps = async (rsvps) => {
  await mkdir(dataDir, { recursive: true })
  await writeFile(rsvpFile, `${JSON.stringify(rsvps, null, 2)}\n`, 'utf8')
}

const cleanText = (value) => String(value || '').trim()
const normalizeEmail = (value) => cleanText(value).toLowerCase()
const normalizeName = (value) => cleanText(value).replace(/\s+/g, ' ').toLowerCase()

const requireAdmin = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const key = req.headers['x-admin-key'] || url.searchParams.get('key')

  if (key !== ADMIN_KEY) {
    send(res, 401, { error: 'Unauthorized. Add ?key=your-admin-key to the URL.' })
    return false
  }

  return true
}

const escapeCsv = (value) => {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const toCsv = (rsvps) => {
  const headers = [
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

  const rows = rsvps.map((rsvp) => [
    rsvp.submittedAt,
    rsvp.fullName,
    rsvp.email,
    rsvp.phone,
    rsvp.attending,
    rsvp.joiningPartyBus || '',
    rsvp.rsvpType || 'Primary',
    rsvp.linkedTo || '',
    rsvp.message,
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

const getTakenSpotCount = (rsvps) => {
  return rsvps.filter((rsvp) => cleanText(rsvp.attending).toLowerCase() === 'yes').length
}

const adminHtml = (rsvps, key) => {
  const rows = rsvps.map((rsvp) => `
    <tr>
      <td>${escapeHtml(rsvp.submittedAt)}</td>
      <td>${escapeHtml(rsvp.fullName)}</td>
      <td>${escapeHtml(rsvp.email)}</td>
      <td>${escapeHtml(rsvp.phone)}</td>
      <td>${escapeHtml(rsvp.attending)}</td>
      <td>${escapeHtml(rsvp.joiningPartyBus || '')}</td>
      <td>${escapeHtml(rsvp.rsvpType || 'Primary')}</td>
      <td>${escapeHtml(rsvp.linkedTo || '')}</td>
      <td>${escapeHtml(rsvp.message)}</td>
      <td>
        <form method="post" action="/admin/rsvps/${encodeURIComponent(rsvp.id)}/delete" onsubmit="return confirm('Remove this RSVP?');">
          <input type="hidden" name="key" value="${escapeHtml(key)}">
          <button type="submit">Remove</button>
        </form>
      </td>
    </tr>
  `).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Wedding RSVPs</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #2c1810; background: #fbfaf8; }
    header { padding: 24px; background: #2c1810; color: white; }
    main { padding: 24px; overflow-x: auto; }
    a { display: inline-flex; margin-top: 12px; padding: 10px 14px; color: #2c1810; background: #d4af37; text-decoration: none; border-radius: 5px; }
    button { padding: 8px 10px; color: white; background: #8b2f24; border: 0; border-radius: 5px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 10px; border-bottom: 1px solid #e7dfd6; text-align: left; vertical-align: top; }
    th { background: #f8f1e9; white-space: nowrap; }
  </style>
</head>
<body>
  <header>
    <h1>Alicia & Kevin RSVPs</h1>
    <p>${rsvps.length} response${rsvps.length === 1 ? '' : 's'}</p>
    <a href="/admin/rsvps.csv?key=${encodeURIComponent(key)}">Download CSV for Excel</a>
  </header>
  <main>
    <table>
      <thead>
        <tr>
          <th>Submitted</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Attending</th>
          <th>Party Bus</th>
          <th>RSVP Type</th>
          <th>Linked To</th>
          <th>Message</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="10">No RSVPs yet.</td></tr>'}</tbody>
    </table>
  </main>
</body>
</html>`
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'OPTIONS') {
      send(res, 204, '')
      return
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      send(res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/rsvps/count') {
      const rsvps = await readRsvps()
      const takenSpots = getTakenSpotCount(rsvps)
      send(res, 200, {
        ok: true,
        baseTakenSpots: 0,
        attendingRsvps: takenSpots,
        takenSpots,
        totalSpots: 50,
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/rsvps') {
      const body = await readJsonBody(req)
      const fullName = cleanText(body.fullName)
      const email = cleanText(body.email)
      const attending = cleanText(body.attending)
      const joiningPartyBus = cleanText(body.joiningPartyBus)
      const spouseName = cleanText(body.spouseName)
      const hasSpouseGuest = body.hasSpouseGuest === 'on' || body.hasSpouseGuest === true

      if (!fullName || !email || !attending || !joiningPartyBus) {
        send(res, 400, { error: 'Name, email, attendance, and party bus response are required.' })
        return
      }

      if (hasSpouseGuest && !spouseName) {
        send(res, 400, { error: 'Please enter your spouse guest name.' })
        return
      }

      const rsvps = await readRsvps()
      const submittedAt = new Date().toISOString()
      const targetEmail = normalizeEmail(email)
      const targetName = normalizeName(fullName)
      const existingPrimaryIndex = rsvps.findIndex((rsvp) => {
        if ((rsvp.rsvpType || 'Primary') !== 'Primary') return false

        const rsvpEmail = normalizeEmail(rsvp.email)
        if (rsvpEmail && rsvpEmail === targetEmail) return true

        return !rsvpEmail && normalizeName(rsvp.fullName) === targetName
      })
      const newRsvp = {
        id: existingPrimaryIndex >= 0 ? rsvps[existingPrimaryIndex].id : randomUUID(),
        submittedAt,
        fullName,
        email,
        phone: cleanText(body.phone),
        attending,
        joiningPartyBus,
        rsvpType: 'Primary',
        linkedTo: '',
        message: cleanText(body.message),
      }

      if (existingPrimaryIndex >= 0) {
        rsvps[existingPrimaryIndex] = newRsvp
      } else {
        rsvps.push(newRsvp)
      }

      const spouseLinkedTo = normalizeName(fullName)
      const rsvpsWithoutOldSpouse = rsvps.filter((rsvp) => {
        return !((rsvp.rsvpType || 'Primary') === 'Spouse Guest' && normalizeName(rsvp.linkedTo) === spouseLinkedTo)
      })

      if (hasSpouseGuest) {
        rsvpsWithoutOldSpouse.push({
          id: randomUUID(),
          submittedAt,
          fullName: spouseName,
          email: '',
          phone: '',
          attending,
          joiningPartyBus,
          rsvpType: 'Spouse Guest',
          linkedTo: fullName,
          message: `Spouse guest of ${fullName}`,
        })
      }

      await writeRsvps(rsvpsWithoutOldSpouse)
      send(res, existingPrimaryIndex >= 0 ? 200 : 201, {
        ok: true,
        mode: existingPrimaryIndex >= 0 ? 'updated' : 'created',
        rsvp: newRsvp,
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/admin') {
      if (!requireAdmin(req, res)) return
      const rsvps = await readRsvps()
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(adminHtml(rsvps, url.searchParams.get('key') || ''))
      return
    }

    const deleteMatch = url.pathname.match(/^\/admin\/rsvps\/([^/]+)\/delete$/)

    if (req.method === 'POST' && deleteMatch) {
      const form = await readFormBody(req)
      const key = form.get('key')

      if (key !== ADMIN_KEY) {
        send(res, 401, { error: 'Unauthorized.' })
        return
      }

      const id = decodeURIComponent(deleteMatch[1])
      const rsvps = await readRsvps()
      const filteredRsvps = rsvps.filter((rsvp) => rsvp.id !== id)

      await writeRsvps(filteredRsvps)
      res.writeHead(303, { Location: `/admin?key=${encodeURIComponent(key)}` })
      res.end()
      return
    }

    if (req.method === 'GET' && url.pathname === '/admin/rsvps.csv') {
      if (!requireAdmin(req, res)) return
      const rsvps = await readRsvps()
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="wedding-rsvps.csv"',
      })
      res.end(toCsv(rsvps))
      return
    }

    send(res, 404, { error: 'Not found' })
  } catch (error) {
    console.error(error)
    send(res, 500, { error: 'Something went wrong.' })
  }
})

server.listen(PORT, () => {
  console.log(`RSVP backend running on http://localhost:${PORT}`)
  console.log(`Admin page: http://localhost:${PORT}/admin?key=${ADMIN_KEY}`)
})
