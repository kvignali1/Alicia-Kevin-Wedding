# Wedding Website

A beautiful, responsive wedding website built with React, TypeScript, and Vite.

## Features

- **Hero Section**: Stunning full-screen hero with wedding details
- **Navigation**: Fixed navigation bar with smooth scrolling
- **About Section**: Couple's story and wedding details
- **RSVP Section**: Call-to-action for guest responses
- **Photo Gallery**: Placeholder for wedding photos
- **Timeline**: Wedding day schedule
- **Gift Registry**: Links to wedding registries
- **Responsive Design**: Works beautifully on all devices

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with custom properties
- **Deployment**: Ready for GitHub Pages

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Header.tsx
│   ├── Navigation.tsx
│   └── Footer.tsx
├── pages/         # Page components (future use)
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
├── App.css        # Main application styles
└── main.ts        # Application entry point
```

## Next Steps

- [ ] Add RSVP form functionality
- [ ] Implement photo gallery
- [ ] Add contact information section
- [ ] Set up Firebase backend integration
- [ ] Deploy to GitHub Pages
- [ ] Add mobile app integration

## Customization

To customize this website for your wedding:

1. Update the couple's names and wedding details in `Header.tsx`
2. Modify the wedding date and location
3. Replace placeholder images with your wedding photos
4. Update registry links in `App.tsx`
5. Customize colors in `App.css` CSS variables