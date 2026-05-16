import React from 'react'
import ReactDOM from 'react-dom/client'
import BridalShower from './components/BridalShower'
import Footer from './components/Footer'
import './style.css'
import './App.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <div className="App">
      <BridalShower />
      <Footer />
    </div>
  </React.StrictMode>,
)
