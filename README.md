# Pratibha — Statewide Youth Festival

A responsive React + Tailwind CSS registration experience with an Express API and MongoDB Atlas persistence.

## Requirements

- Node.js 20 or newer
- A MongoDB Atlas cluster and database user

## Run locally

1. Install dependencies from the project root:

   ```bash
   npm install
   npm --prefix client install
   ```

2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your Atlas connection string. In Atlas, allow your development IP in **Network Access** and ensure the database user has read/write access.

3. Start the client and API together:

   ```bash
   npm run dev
   ```

4. Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API runs on `http://localhost:5000`; check `GET /api/health` to confirm the database connection.

Registrations are stored in the `registrations` collection. Age and age group are calculated and validated by the API from the participant's date of birth. Age groups are 5–8, 9–12, 13–17, and 18+. The form uses Tailwind CSS 4 and SweetAlert2 for registration feedback and competition detail pop-ups.

If submission fails, check that both development commands are still running and that `GET /api/health` reports `"database":"connected"`. After changing backend code or `.env`, restart `npm run dev:server`; after changing dependencies, stop and restart the client as well.

## Production build

```bash
npm --prefix client run build
npm start
```

Set `CLIENT_ORIGIN` to the deployed frontend origin and configure `MONGODB_URI` in the hosting provider's environment settings. Do not commit `.env` or put Atlas credentials in frontend code.
