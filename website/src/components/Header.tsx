import React, { useEffect, useRef, useState } from 'react'
import './Header.css'

const WEDDING_ADDRESS = '555 Third Street, Las Vegas, NV, 89101'

type HeaderProps = {
  onOpenMapOptions: () => void
}

const Header: React.FC<HeaderProps> = ({ onOpenMapOptions }) => {
  const heroRef = useRef<HTMLElement | null>(null)
  const [shouldFadeHeroImage, setShouldFadeHeroImage] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShouldFadeHeroImage(entry.isIntersecting)
      },
      { threshold: 0.35 }
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <header
      id="top"
      ref={heroRef}
      className={`hero-section${shouldFadeHeroImage ? ' hero-section-fade-image' : ''}`}
    >
      <div className="hero-content">
        <p className="hero-kicker">Together With Family and Friends</p>
        <h1 className="hero-title">Alicia & Kevin's Wedding</h1>
        <p className="hero-date">October 17th, 2026</p>
        <button
          className="hero-location-button"
          type="button"
          onClick={onOpenMapOptions}
          aria-label={`Open map options for wedding address: ${WEDDING_ADDRESS}`}
        >
          <span className="hero-location-pin" aria-hidden="true" />
          <span className="hero-location-text">{WEDDING_ADDRESS}</span>
          <span className="hero-location-action">Open maps</span>
        </button>
      </div>
    </header>
  )
}

export default Header
