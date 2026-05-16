import React from 'react'
import './Navigation.css'

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <a href="#about">About</a>
      <a href="#rsvp">RSVP</a>
      <a href="#gallery">Gallery</a>
      <a href="#timeline">Timeline</a>
      <a href="#registry">Registry</a>
    </nav>
  )
}

export default Navigation