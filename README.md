# Wrist Mode Website

Dynamic local storefront and admin dashboard for Wrist Mode.

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Admin

Default local admin password:

```text
wristmode2026
```

For real use, set `ADMIN_PASSWORD` before starting the server.

## Check The Site

With the local server running, use:

```bash
npm run check
npm run smoke
npm run smoke:mobile
npm run smoke:api
npm run qa
```

## Update Watch Brands

```bash
npm run catalog:sync-watch-brands
```

Import the WhatsApp photo stock after extracting the zip and generating contact sheets:

```bash
npm run catalog:import-watch-photos
```

## Production Notes

Payment and customer notification buttons are wired as provider-ready placeholders. Connect MTN Mobile Money, Airtel Money, card payments, email, SMS, or WhatsApp Business using provider credentials before accepting live online payments.
