# CampusFix

CampusFix is a full-stack web app for reporting and tracking problems across a college campus. Students can submit issues such as broken lights, dirty spaces, water leaks, damaged equipment, and other maintenance concerns, while admins can review, filter, and update each issue from a dashboard.

## Features

- Modern responsive landing page for the app overview
- Student issue form with title, description, category, location, priority, and optional image upload
- SQLite-powered storage for submitted issues
- Admin dashboard with issue status updates
- Filters for category, priority, and status
- Summary cards for total, unresolved, and resolved issues
- Automatic demo data for immediate use in GitHub Codespaces and local development

## Tech Stack

- React + Vite frontend
- Express backend API
- SQLite database
- Simple file upload support for issue images

## Project Structure

- `client/` – React frontend app
- `server/` – Express server and SQLite logic
- `package.json` – workspace scripts for running the app together

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the application in development mode:

   ```bash
   npm run dev
   ```

3. Open the app in a browser:
   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api/issues

## Codespaces Notes

This project is configured for GitHub Codespaces and local development. The Vite frontend binds to `0.0.0.0`, so forwarded ports work correctly for previewing the app from the browser.

## Production Build

To build the frontend for production:

```bash
npm run build
```

To run only the backend:

```bash
npm run start
```

## Demo Data

The server seeds several example issues on first launch so the dashboard is populated and usable immediately.
