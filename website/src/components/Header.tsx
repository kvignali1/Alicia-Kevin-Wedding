import React, { useEffect, useRef, useState } from 'react'
import './Header.css'

const Header: React.FC = () => {
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
        <p className="hero-kicker">Together With Their Families</p>
        <h1 className="hero-title">Alicia & Kevin's Wedding</h1>
        <p className="hero-date">October 17th, 2026</p>
        <p className="hero-location">555 Third Street, Las Vegas, NV, 89101</p>
      </div>
    </header>
  )
}

export default Header
