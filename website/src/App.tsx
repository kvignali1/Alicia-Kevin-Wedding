import { useState } from 'react'
import type { FormEvent } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')
const RSVP_SUBMIT_URL = import.meta.env.VITE_RSVP_SUBMIT_URL || ''

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
  const [hasSpouseGuest, setHasSpouseGuest] = useState(false)

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
    } catch (error) {
      setRsvpStatus('error')
      setRsvpMessage(error instanceof Error ? error.message : 'Unable to send RSVP right now.')
    }
  }

  return (
    <div className="App">
      <Navigation />
      <Header />

      <main>
        <section id="about" className="section">
          <h2>Our Story</h2>
          <p>Our story started three years ago at Amazon SBD1 after Kevin finally worked up the courage to ask Alicia for her number with a little encouragement from a friend.</p>
          <p>What started as uncertainty quickly turned into something neither of us expected. From the beginning, there was chemistry on every level. Somewhere between go-kart dates, spontaneous lunch plans, scenic drives through Arrowhead, and late nights laughing together, we realized we had found not only a partner, but also our best friend.</p>
          <p>We're both old souls who love old music, good food, long drives, and nights spent doing absolutely nothing except talking for hours. Food became our love language. Kevin brings the corny jokes, while Alicia keeps him grounded with her sarcastic humor and habit of jokingly talking trash to the cat when she lays on Kevin.</p>
          <p>Over the years, we've continued building a life together by always making room for each other. From sharing a small apartment, adopting our kitten, and creating a home together, to finally moving into a bigger space where everyone has room to grow, every chapter has brought us closer.</p>
          <p>On December 11th, 2025, Kevin proposed to Alicia at the top of Griffith Observatory on a sunny afternoon between the observatory domes. Now we're excited for our next chapter together: building a home, growing our family, creating space for Alicia's future animal rescue, and making sure there's a garage big enough for Kevin's future drift car projects.</p>
          <p>At the center of it all has always been the same thing: love, friendship, laughter, and choosing each other every single day.</p>
          <p>We're excited to share this beautiful day with our closest friends and family as we begin our journey together as husband and wife.</p>
        </section>

        <section id="dress-code" className="section">
          <h2>Dress Code</h2>
            <div className="section-divider" />
              <p><strong>Dressy Casual Attire</strong></p>
                <p>We want everyone to feel comfortable and enjoy the celebration, so we've chosen a dressy casual dress code for our wedding. This means you can skip the tuxedos and ball gowns, but we still encourage you to dress up a bit to make the day feel special!</p>
          <h2>Colors</h2>
            <div className="section-divider" />
              <p><strong>Colors Not Allowed</strong></p>
              <p>We kindly request that you do not wear Navy Blue, Burgundy, Ivory or White to the wedding. We look forward to any other colors you choose to wear!</p>
        </section>

        <section id="rsvp" className="section">
          <h2>RSVP</h2>
          <p><strong>We kindly ask that you RSVP by September 1st, 2026.</strong></p>
          <p className="rsvp-small-print"><em>Just a quick heads up, due to venue capacity and seating limits, our wedding is strictly by invitation only. Invitations are intended only for the people specifically named, with the exception of married spouses.</em></p>
          <p className="rsvp-small-print"><em>Please also note that our wedding will be an adults-only celebration, and we will not be able to accommodate children. We hope you understand and can make arrangements so you can celebrate with us!</em></p>
          <p className="rsvp-small-print"><em>We really appreciate everyone's understanding as we finalize numbers for the big day!</em></p>
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

            <label className="rsvp-checkbox">
              <input
                name="hasSpouseGuest"
                type="checkbox"
                checked={hasSpouseGuest}
                onChange={(event) => setHasSpouseGuest(event.target.checked)}
              />
              Do you have a guest coming with you that is a spouse?
            </label>

            {hasSpouseGuest && (
              <label>
                Spouse Guest Name
                <input name="spouseName" type="text" autoComplete="name" required />
              </label>
            )}

            <label>
              Message
              <textarea name="message" rows={3} placeholder="Anything else we should know?" />
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

        <section id="gallery" className="section">
          <h2>Photo Gallery</h2>
          <p>Coming soon - our engagement photos and wedding memories. Check back closer to the wedding date!</p>
          <div className="gallery-placeholder">
            <div className="placeholder-image"></div>
            <div className="placeholder-image"></div>
            <div className="placeholder-image"></div>
          </div>
        </section>

        <section id="timeline" className="section">
          <h2>Wedding Timeline</h2>
          <div className="timeline">
            <div className="timeline-item">
              <h3>Ceremony</h3>
              <p>3:00 PM - 4:00 PM</p>
              <p><strong>Guests are urged to arrive by 2:30 PM.</strong></p>
              <p><em>Strict on time policy is in effect and any guest arriving late may not be admitted.</em></p>
            </div>
            <div className="timeline-item">
              <h3>Private Photo Shoot</h3>
              <p>4:00 PM - 5:00 PM</p>
              <p><em>This photo shoot will be Alicia and Kevin only. Guests are welcome to explore vegas and or change clothes before dinner at 6:00 PM.</em></p>
            </div>
            <div className="timeline-item">
              <h3>Dinner</h3>
              <p>6:00 PM - End</p>
              <p>Dinner will be at Bonito Michoacan.</p>
              <p>Address: (Input address here)</p>
            </div>
            <div className="timeline-item">
              <h3>Party!</h3>
              <p>After Dinner End we will be hitting the Vegas Strip!</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default App
