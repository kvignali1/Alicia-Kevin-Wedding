# Alicia & Kevin Wedding Website

Wedding website with a mobile-friendly RSVP form, local RSVP backend, admin list, and CSV export for Excel.

## Local Development

Start the RSVP backend:

```powershell
cd backend
npm run dev
```

Start the website:

```powershell
cd website
npm run dev
```

Website:

```text
http://localhost:5173
```

Admin RSVP list:

```text
http://localhost:4000/admin?key=change-me
```

Excel CSV export:

```text
http://localhost:4000/admin/rsvps.csv?key=change-me
```

## Going Live

The frontend can be hosted by Vercel, Netlify, or GitHub Pages.

The RSVP backend must be hosted on a server platform such as Render, Railway, Fly.io, or another Node-capable host. GitHub Pages cannot run the backend because it only serves static files.
