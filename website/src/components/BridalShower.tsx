import React from 'react'

const AMAZON_WISHLIST_URL = 'https://www.amazon.com/hz/wishlist/ls/2J03GPCXJVOI3?ref_=wl_share'
const HONEYMOON_FUND_URL = 'https://gofund.me/1b20b468e'

const BridalShower: React.FC = () => {
  return (
    <div className="bridal-page">
      <nav className="navigation">
        <a href="#shower-home">Shower</a>
        <a href="#shower-details">Details</a>
        <a href="#shower-gifts">Gifts</a>
      </nav>

      <header id="shower-home" className="shower-hero">
        <div className="shower-hero-content">
          <p className="shower-kicker">Bridal Shower</p>
          <h1>Alicia's Bridal Shower</h1>
          <p>Friday, September 18th, 2026</p>
          <p>Location to be announced</p>
        </div>
      </header>

      <main>
        <section id="shower-details" className="section">
          <h2>Celebrate With Us</h2>
          <p>Join us for an afternoon celebrating Alicia before the big day. We will share food, laughs, photos, and a little time together before wedding season gets beautifully busy.</p>
          <p>More details will be added here once the date, time, and location are finalized.</p>
        </section>

        <section className="section">
          <h2>Event Details</h2>
          <div className="timeline shower-details">
            <div className="timeline-item">
              <h3>Date</h3>
              <p>Friday, September 18th, 2026</p>
            </div>
            <div className="timeline-item">
              <h3>Time</h3>
              <p>6:00 PM</p>
            </div>
            <div className="timeline-item">
              <h3>Location</h3>
              <p>To be announced</p>
            </div>
          </div>
        </section>

        <section id="shower-gifts" className="section">
          <h2>Gift Registry</h2>
          <p>Your love and presence mean the most. If you would like to contribute a gift, we have included a few options below.</p>
          <div className="gift-links">
            <a href={AMAZON_WISHLIST_URL} target="_blank" rel="noreferrer">Amazon Wishlist</a>
            <a href={HONEYMOON_FUND_URL} target="_blank" rel="noreferrer">Donate to Our Honeymoon</a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default BridalShower
