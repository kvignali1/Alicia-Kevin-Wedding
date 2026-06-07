import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')
const RSVP_SUBMIT_URL = import.meta.env.VITE_RSVP_SUBMIT_URL || ''
const WEDDING_ADDRESS = '555 Third Street, Las Vegas, NV, 89101'
const DINNER_ADDRESS = '3715 South Decatur Blvd, Las Vegas, NV'
const PARTY_BUS_ADDRESS = 'Palms Casino Resort, 4321 West Flamingo Rd, Las Vegas, NV'
const PARTY_BUS_TICKET_URL = 'https://www.groupon.com/deals/nocturnal-tours-party-bus-1?redemptionLocationId=f7679cf9-58cb-b06a-9053-014b95d1c4a6'
const PARTY_BUS_REGISTRATION_URL = 'https://goo.gl/23bco6'
const AMAZON_WISHLIST_URL = 'https://www.amazon.com/hz/wishlist/ls/2J03GPCXJVOI3?ref_=wl_share'
const HONEYMOON_FUND_URL = 'https://gofund.me/1b20b468e'
const RSVP_BASE_TAKEN_SPOTS = 14
const RSVP_TOTAL_SPOTS = 50

type MapLocation = {
  label: string
  address: string
}

const buildUrl = (baseUrl: string, params: Record<string, string>) => {
  const url = new URL(baseUrl, window.location.href)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}

const fetchJsonp = <T,>(url: string) => {
  return new Promise<T>((resolve, reject) => {
    const callbackName = `rsvpCountCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')

    window.setTimeout(() => {
      reject(new Error('Unable to load RSVP count.'))
      script.remove()
      delete (window as typeof window & Record<string, unknown>)[callbackName]
    }, 10000)

    ;(window as typeof window & Record<string, unknown>)[callbackName] = (payload: T) => {
      resolve(payload)
      script.remove()
      delete (window as typeof window & Record<string, unknown>)[callbackName]
    }

    script.onerror = () => {
      reject(new Error('Unable to load RSVP count.'))
      script.remove()
      delete (window as typeof window & Record<string, unknown>)[callbackName]
    }

    script.src = buildUrl(url, { action: 'count', callback: callbackName })
    document.body.appendChild(script)
  })
}

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  const area = digits.slice(0, 3)
  const prefix = digits.slice(3, 6)
  const line = digits.slice(6, 10)

  if (line) {
    return `(${area}) ${prefix}-${line}`
  }

  if (prefix) {
    return `(${area}) ${prefix}`
  }

  if (area) {
    return `(${area}`
  }

  return ''
}

function App() {
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [rsvpMessage, setRsvpMessage] = useState('')
  const [rsvpTakenSpots, setRsvpTakenSpots] = useState(RSVP_BASE_TAKEN_SPOTS)
  const [hasSpouseGuest, setHasSpouseGuest] = useState(false)
  const [selectedMapLocation, setSelectedMapLocation] = useState<MapLocation | null>(null)

  const refreshRsvpCount = async () => {
    try {
      if (RSVP_SUBMIT_URL) {
        const data = await fetchJsonp<{ takenSpots?: number }>(RSVP_SUBMIT_URL)
        setRsvpTakenSpots(Number(data.takenSpots) || RSVP_BASE_TAKEN_SPOTS)
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/rsvps/count`)
      if (!response.ok) {
        throw new Error('Unable to load RSVP count.')
      }

      const data = await response.json()
      setRsvpTakenSpots(Number(data.takenSpots) || RSVP_BASE_TAKEN_SPOTS)
    } catch {
      setRsvpTakenSpots(RSVP_BASE_TAKEN_SPOTS)
    }
  }

  useEffect(() => {
    refreshRsvpCount()
  }, [])

  const handleRsvpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRsvpStatus('sending')
    setRsvpMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())

    try {
      if (RSVP_SUBMIT_URL) {
        const sheetPayload = new URLSearchParams()
        formData.forEach((value, key) => {
          sheetPayload.append(key, String(value))
        })

        await fetch(RSVP_SUBMIT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: sheetPayload,
        })

        form.reset()
        setHasSpouseGuest(false)
        setRsvpStatus('success')
        setRsvpMessage('Thank you. Your RSVP has been received!')
        refreshRsvpCount()
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/rsvps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        const data = text ? JSON.parse(text) : {}
        throw new Error(data.error || 'Unable to send RSVP.')
      }

      form.reset()
      setHasSpouseGuest(false)
      setRsvpStatus('success')
      setRsvpMessage('Thank you. Your RSVP has been received!')
      refreshRsvpCount()
    } catch (error) {
      setRsvpStatus('error')
      setRsvpMessage(error instanceof Error ? error.message : 'Unable to send RSVP right now.')
    }
  }

  const getMapUrl = (address: string, provider: 'google' | 'apple') => {
    const encodedAddress = encodeURIComponent(address)
    return provider === 'google'
      ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      : `https://maps.apple.com/?q=${encodedAddress}`
  }

  return (
    <div className="App">
      <Navigation />
      <Header onOpenMapOptions={() => setSelectedMapLocation({ label: 'Wedding Address', address: WEDDING_ADDRESS })} />

      <main>
        <section id="about" className="section story-section">
          <div className="section-eyebrow">Our Story</div>
          <h2>Three years, one very easy yes.</h2>
          <div className="story-copy">
            <p>Our story started three years ago at Amazon SBD1 after Kevin finally worked up the courage to ask Alicia for her number with a little encouragement from a friend.</p>
            <p>What started as uncertainty quickly turned into something neither of us expected. From the beginning, there was chemistry on every level. Somewhere between go-kart dates, spontaneous lunch plans, scenic drives through Arrowhead, and late nights laughing together, we realized we had found not only a partner, but also our best friend.</p>
            <p>We're both old souls who love old music, good food, long drives, and nights spent doing absolutely nothing except talking for hours. Food became our love language. Kevin brings the corny jokes, while Alicia keeps him grounded with her sarcastic humor and habit of jokingly talking trash to the cat when she lays on Kevin.</p>
            <p>Over the years, we've continued building a life together by always making room for each other. From sharing a small apartment, adopting our kitten, and creating a home together, to finally moving into a bigger space where everyone has room to grow, every chapter has brought us closer.</p>
            <p>On December 11th, 2025, Kevin proposed to Alicia at the top of Griffith Observatory on a sunny afternoon between the observatory domes. Now we're excited for our next chapter together: building a home, growing our family, creating space for Alicia's future animal rescue, and making sure there's a garage big enough for Kevin's future drift car projects.</p>
            <p>At the center of it all has always been the same thing: love, friendship, laughter, and choosing each other every single day.</p>
            <p>We're excited to share this beautiful day with our closest friends and family as we begin our journey together as husband and wife.</p>
          </div>
        </section>

        <section id="dress-code" className="section">
          <div className="section-eyebrow">The Look</div>
          <h2>Dress Code</h2>
          <div className="detail-grid">
            <div className="detail-card">
              <p className="detail-label">Attire</p>
              <h3>Dressy Casual Attire</h3>
              <p>We want everyone to feel comfortable and enjoy the celebration, so we've chosen a dressy yet casual dress code for our wedding. This means skip the tuxedos and ball gowns, but we still encourage you to dress up a bit to make the day feel special!</p>
            </div>
            <div className="detail-card detail-card-dark">
              <p className="detail-label">Colors Not Allowed</p>
              <h3>Reserved Colors</h3>
              <p>We kindly request that you do not wear Navy Blue, Burgundy, Ivory or White to the wedding. We look forward to any other colors you choose to wear!</p>
            </div>
          </div>
        </section>

        <section id="rsvp" className="section rsvp-section">
          <div className="section-eyebrow">Save Your Seat</div>
          <h2>RSVP</h2>
          <p><strong>We kindly ask that you RSVP by September 1st, 2026.</strong></p>
          <div className="rsvp-capacity" aria-label={`${rsvpTakenSpots} of ${RSVP_TOTAL_SPOTS} spots taken`}>
            <div className="rsvp-capacity-header">
              <span>Guest Count</span>
              <strong>{rsvpTakenSpots}/{RSVP_TOTAL_SPOTS}</strong>
            </div>
            <div className="rsvp-capacity-track" aria-hidden="true">
              <span style={{ width: `${Math.min((rsvpTakenSpots / RSVP_TOTAL_SPOTS) * 100, 100)}%` }} />
            </div>
            <p>This is just a planning indicator. The RSVP form will still submit if responses go over the listed count.</p>
          </div>
          <p className="rsvp-small-print"><em>Just a quick heads up, due to venue capacity and seating limits, our wedding is strictly by invitation only. Invitations are intended only for the people specifically contacted, with the exception of the invitee's married spouses/partners. All planning has been carefully considered before hand.</em></p>
          <p className="rsvp-small-print"><em>Please also note that our wedding will be an adults-only celebration, and we will not be able to accommodate children. We hope you understand and can make arrangements so you can celebrate with us!</em></p>
          <p className="rsvp-small-print"><em>We really appreciate everyone's understanding as we finalize numbers for the big day!</em></p>
          <p className="rsvp-update-note">Plans change? Maybe you are coming on the party bus after all? Just submit another RSVP!</p>
          <form className="rsvp-form" onSubmit={handleRsvpSubmit}>
            <label>
              Full Name
              <input name="fullName" type="text" autoComplete="name" required />
            </label>

            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <label>
              Phone
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="(555) 123-4567"
                required
                onChange={(event) => {
                  event.target.value = formatPhoneNumber(event.target.value)
                }}
              />
            </label>

            <label>
              Will you be attending?
              <select name="attending" required defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="Yes">Yes, I will be there</option>
                <option value="No">No, I cannot make it</option>
              </select>
            </label>

            <label>
              Will you be joining us on the party bus?
              <select name="joiningPartyBus" required defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="Yes">Yes, I plan to join</option>
                <option value="No">No, I will skip the party bus</option>
                <option value="Undecided">I'm not sure yet</option>
              </select>
            </label>

            <div className="rsvp-party-bus-note">
              <p>Party bus tickets will need to be purchased individually by each guest who would like to attend.</p>
              <div className="party-bus-link-steps">
                <a href={PARTY_BUS_TICKET_URL} target="_blank" rel="noreferrer">
                  <span>Step 1</span>
                  Buy the Groupon
                </a>
                <a href={PARTY_BUS_REGISTRATION_URL} target="_blank" rel="noreferrer">
                  <span>Step 2</span>
                  Register your Groupon
                  <strong className="party-bus-group-name">Use group name: Kevin &amp; Alicia</strong>
                </a>
              </div>
            </div>

            <label className="rsvp-checkbox">
              <input
                name="hasSpouseGuest"
                type="checkbox"
                checked={hasSpouseGuest}
                onChange={(event) => setHasSpouseGuest(event.target.checked)}
              />
              I am bringing my spouse.
            </label>
            <p className="rsvp-spouse-note">
              To help us keep the day intimate and within our venue limits, additional guests are limited to spouses only unless a non-spouse guest has been specifically approved by the wedding party.
            </p>

            {hasSpouseGuest && (
              <label>
                Spouse Guest Name
                <input name="spouseName" type="text" autoComplete="name" required />
              </label>
            )}

            <label>
              Message
              <textarea name="message" rows={3} placeholder="Anything else we should know?" required />
            </label>

            <button className="rsvp-button" type="submit" disabled={rsvpStatus === 'sending'}>
              {rsvpStatus === 'sending' ? 'Sending...' : 'Submit RSVP'}
            </button>

            {rsvpMessage && (
              <p className={`rsvp-form-message ${rsvpStatus === 'error' ? 'is-error' : 'is-success'}`}>
                {rsvpMessage}
              </p>
            )}
          </form>
        </section>

        <section id="contact" className="section contact-section">
          <div className="section-eyebrow">Questions?</div>
          <h2>Contact Us</h2>
          <p>If you need help with RSVP details, timeline timing, or party bus plans, you can reach either of us directly.</p>
          <div className="contact-grid">
            <a className="contact-card" href="tel:+19099388638" aria-label="Call Kevin at 909-938-8638">
              <span>Kevin</span>
              <strong>909-938-8638</strong>
            </a>
            <a className="contact-card" href="tel:+19092464794" aria-label="Call Alicia at 909-246-4794">
              <span>Alicia</span>
              <strong>909-246-4794</strong>
            </a>
          </div>
        </section>

        <section id="privacy" className="section privacy-section">
          <div className="section-eyebrow">Private Invite</div>
          <h2>Privacy Policy</h2>
          <div className="privacy-copy">
            <p>This wedding website is intended only for invited guests. To help us keep our wedding private and invite-only, please do not share this link with anyone who was not personally invited.</p>
            <p>RSVP details are used only to help us plan attendance, seating, dinner, and wedding-day logistics.</p>
          </div>
        </section>

        <section id="gallery" className="section gallery-section">
          <div className="section-eyebrow">Moments</div>
          <h2>Photo Gallery</h2>
          <p>Coming soon - our engagement photos and wedding memories. Check back closer to the wedding date!</p>
          <div className="gallery-placeholder">
            <div className="placeholder-image gallery-image-one"></div>
            <div className="placeholder-image gallery-image-two"></div>
            <div className="placeholder-image gallery-image-three"></div>
          </div>
        </section>

        <section id="timeline" className="section timeline-section">
          <div className="section-eyebrow">Wedding Day</div>
          <h2>Wedding Timeline</h2>
          <div className="timeline">
            <div className="timeline-item">
              <h3>Ceremony</h3>
              <p>3:00 PM - 4:00 PM</p>
              <p><strong>Guests are urged to arrive by 2:30 PM.</strong></p>
              <p><em>Strict on time policy is in effect and any guest arriving late may not be admitted.</em></p>
              <button
                className="timeline-address-button"
                type="button"
                onClick={() => setSelectedMapLocation({ label: 'Wedding Address', address: WEDDING_ADDRESS })}
                aria-label={`Open map options for wedding address: ${WEDDING_ADDRESS}`}
              >
                <span className="timeline-address-label">Wedding Address</span>
                <span className="timeline-address-text">{WEDDING_ADDRESS}</span>
                <span className="timeline-address-action">Open maps</span>
              </button>
            </div>
            <div className="timeline-item">
              <h3>Private Photo Shoot</h3>
              <p>4:00 PM - 5:00 PM</p>
              <p><em>This photo shoot will be Alicia and Kevin only. Guests are welcome to explore vegas and or change clothes before dinner at 6:00 PM.</em></p>
            </div>
            <div className="timeline-item">
              <h3>Dinner</h3>
              <p>6:00 PM - 7:30 PM</p>
              <p>Dinner will be at Bonito Michoacan.</p>
              <button
                className="timeline-address-button"
                type="button"
                onClick={() => setSelectedMapLocation({ label: 'Dinner Address', address: DINNER_ADDRESS })}
                aria-label={`Open map options for dinner address: ${DINNER_ADDRESS}`}
              >
                <span className="timeline-address-label">Dinner Address</span>
                <span className="timeline-address-text">{DINNER_ADDRESS}</span>
                <span className="timeline-address-action">Open maps</span>
              </button>
            </div>
            <div className="timeline-item">
              <h3>Noctural Tours Party Bus</h3>
              <p>8:30 PM - End</p>
              <p>After dinner, we will meet at Palms Casino Resort for Noctural Tours Party Bus.</p>
              <button
                className="timeline-address-button"
                type="button"
                onClick={() => setSelectedMapLocation({ label: 'Party Bus Address', address: PARTY_BUS_ADDRESS })}
                aria-label={`Open map options for party bus address: ${PARTY_BUS_ADDRESS}`}
              >
                <span className="timeline-address-label">Party Bus Address</span>
                <span className="timeline-address-text">{PARTY_BUS_ADDRESS}</span>
                <span className="timeline-address-action">Open maps</span>
              </button>
            </div>
          </div>
        </section>

        <section id="registry" className="section">
          <h2>Gift Registry</h2>
          <p>Your love and presence mean the most. If you would like to contribute a gift, we have included a few options below.</p>
          <div className="gift-links">
            <a href={AMAZON_WISHLIST_URL} target="_blank" rel="noreferrer">Amazon Wishlist</a>
            <a href={HONEYMOON_FUND_URL} target="_blank" rel="noreferrer">Donate to Our Honeymoon</a>
          </div>
        </section>
      </main>

      {selectedMapLocation && (
        <div
          className="map-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedMapLocation(null)}
        >
          <div
            className="map-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="map-modal-close"
              type="button"
              onClick={() => setSelectedMapLocation(null)}
              aria-label="Close map options"
            >
              x
            </button>
            <p className="map-modal-kicker">{selectedMapLocation.label}</p>
            <h2 id="map-modal-title">Open this address in maps?</h2>
            <p>{selectedMapLocation.address}</p>
            <div className="map-modal-actions">
              <a href={getMapUrl(selectedMapLocation.address, 'google')} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
              <a href={getMapUrl(selectedMapLocation.address, 'apple')} target="_blank" rel="noreferrer">
                Open in iMaps for iOS
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default App
