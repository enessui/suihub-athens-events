# Registration → Google Sheet setup

Every coworking registration is saved to your Supabase database **and** appended
to a Google Sheet you control. Two one-time steps:

## 1. Create the database table (Supabase)

Supabase dashboard → SQL Editor → run:

```sql
create table if not exists public.coworking_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  telegram text,
  building text,
  created_at timestamptz default now(),
  unique (email)
);
alter table public.coworking_members enable row level security;
```

## 2. Connect the Google Sheet (Apps Script webhook)

1. Create a new Google Sheet (sheets.new). Name the first row of columns however
   you like, e.g. `Timestamp | Name | Email | Telegram | Building`.
2. In the Sheet: **Extensions → Apps Script**.
3. Delete anything there and paste this:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.telegram || '',
    data.building || '',
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize when prompted.
5. Copy the **Web app URL** (ends in `/exec`).

## 3. Add the webhook URL to the app

Add this variable in **both** places (value = the `/exec` URL from step 2.5):

- **Local** — add to `.env.local`:
  ```
  GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
  ```
- **Vercel** — Project → Settings → Environment Variables → add the same, then
  redeploy (`vercel --prod`).

That's it. New registrations now append a row to the Sheet automatically. If the
webhook is ever down, registration still succeeds (it's saved in Supabase; the
Sheet is a mirror, not the source of truth).
