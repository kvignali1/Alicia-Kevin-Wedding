import React from 'react'
import './Navigation.css'

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <a className="nav-logo" href="#top" aria-label="Alicia and Kevin home">
        <span className="nav-logo-mark">A&K</span>
        <span className="nav-logo-text">
          <span>Alicia</span>
          <span>&amp;</span>
          <span>Kevin</span>
        </span>
      </a>
      <div className="nav-links" aria-label="Wedding sections">
        <a href="#about">About</a>
        <a href="#rsvp">RSVP</a>
        <a href="#gallery">Gallery</a>
        <a href="#timeline">Timeline</a>
      </div>
    </nav>
  )
}

export default Navigation
