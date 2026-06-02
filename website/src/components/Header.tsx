import React, { useEffect, useState } from 'react'
import './Header.css'

const HERO_FADE_STORAGE_KEY = 'alicia-kevin-hero-background-seen'

const Header: React.FC = () => {
  const [shouldFadeHeroImage, setShouldFadeHeroImage] = useState(false)

  useEffect(() => {
    if (window.sessionStorage.getItem(HERO_FADE_STORAGE_KEY)) {
      return
    }

    setShouldFadeHeroImage(true)
    window.sessionStorage.setItem(HERO_FADE_STORAGE_KEY, 'true')
  }, [])

  return (
    <header id="top" className={`hero-section${shouldFadeHeroImage ? ' hero-section-fade-image' : ''}`}>
      <div className="hero-content">
        <p className="hero-kicker">Together With Their Families</p>
        <h1 className="hero-title">Alicia & Kevin's Wedding</h1>
        <p className="hero-date">October 17th, 2026</p>
        <p className="hero-location">555 Third Street, Las Vegas, NV, 89101</p>
      </div>
    </header>
  )
}

export default Header
