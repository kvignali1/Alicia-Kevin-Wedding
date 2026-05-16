# RSVP Backend

This backend stores wedding RSVPs in `backend/data/rsvps.json` and gives you an admin page with a CSV download for Excel.

## Start Locally

From the `backend` folder:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:4000
```

## View RSVPs

Open this in your browser:

```text
http://localhost:4000/admin?key=change-me
```

## Download For Excel

Use the button on the admin page, or open:

```text
http://localhost:4000/admin/rsvps.csv?key=change-me
```

Excel can open the downloaded CSV file directly.

## Change The Admin Key

For real use, start the server with your own admin key:

```bash
$env:ADMIN_KEY="your-private-password"; npm run dev
```

Then use:

```text
http://localhost:4000/admin?key=your-private-password
```
