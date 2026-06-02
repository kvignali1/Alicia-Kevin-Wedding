import React, { useEffect, useRef, useState } from 'react'
import './Header.css'

const WEDDING_ADDRESS = '555 Third Street, Las Vegas, NV, 89101'

const Header: React.FC = () => {
  const heroRef = useRef<HTMLElement | null>(null)
  const [shouldFadeHeroImage, setShouldFadeHeroImage] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

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

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(WEDDING_ADDRESS)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }

    window.setTimeout(() => setCopyStatus('idle'), 2200)
  }

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
          className={`hero-location-copy${copyStatus === 'copied' ? ' is-copied' : ''}`}
          type="button"
          onClick={handleCopyAddress}
          aria-label={`Copy wedding address: ${WEDDING_ADDRESS}`}
        >
          <span className="hero-location-pin" aria-hidden="true" />
          <span className="hero-location-text">{WEDDING_ADDRESS}</span>
          <span className="hero-location-action" aria-live="polite">
            {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy address'}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Header
