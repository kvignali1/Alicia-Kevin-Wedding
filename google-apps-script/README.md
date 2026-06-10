# Google Sheets RSVP Backend

This replaces the Node backend with a free Google Sheets backend.

## 1. Create The Sheet

Create a new Google Sheet named something like:

```text
Alicia & Kevin Wedding RSVPs
```

## 2. Add The Apps Script

In the Google Sheet:

1. Click `Extensions`
2. Click `Apps Script`
3. Delete the starter code
4. Paste the code from `google-apps-script/Code.gs`
5. Click `Save`

## 3. Deploy The Web App

In Apps Script:

1. Click `Deploy`
2. Click `New deployment`
3. Choose type: `Web app`
4. Description: `Wedding RSVP endpoint`
5. Execute as: `Me`
6. Who has access: `Anyone`
7. Click `Deploy`
8. Authorize access
9. Copy the Web app URL

It will look similar to:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

## 4. Connect GitHub Pages To The Sheet

In GitHub:

1. Open the repo
2. Go to `Settings`
3. Go to `Secrets and variables`
4. Click `Actions`
5. Click the `Variables` tab
6. Add a repository variable:

```text
Name: VITE_RSVP_SUBMIT_URL
Value: your Apps Script Web app URL
```

Then rerun the `Deploy Website To GitHub Pages` workflow.

## 5. View RSVPs On Your Phone

Open the Google Sheet from the Google Sheets app or your phone browser.

The same Apps Script also stores guest chalkboard notes and guest photo metadata. It will create these extra tabs automatically:

```text
Guest Comments
Guest Photos
```

To hide a chalkboard comment or guest photo from the website without deleting it, change its `Visible` value to:

```text
No
```

Guest photo uploads are saved to a Google Drive folder named:

```text
Wedding Guest Photo Uploads
```

When you deploy the updated script, Google may ask you to authorize Drive access because the upload feature creates shared image files.

To export to Excel:

1. Open the Sheet
2. Click `File`
3. Click `Download`
4. Choose `Microsoft Excel (.xlsx)` or CSV
