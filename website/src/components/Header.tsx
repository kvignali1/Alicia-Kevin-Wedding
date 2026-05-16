import React from 'react'
import './Header.css'

const Header: React.FC = () => {
  return (
    <header className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">Alicia & Kevin's Wedding</h1>
        <p className="hero-date">October 17th, 2026</p>
        <p className="hero-location">555 Third Street, Las Vegas, NV, 89101</p>
      </div>
    </header>
  )
}

export default Header