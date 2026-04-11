# LuminaQ — Quran & Quotes Collector

A Pinterest-style web app to curate and manage inspirational quotes from the Quran, books, movies, and poems — with image uploads, mood tagging, and a dashboard.

## Quick Start

```bash
npm install
# Edit .env with your MongoDB connection string
npm run dev
```

Open **http://localhost:3000**

## API Endpoints

| Method | Route                        | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/quotes`                | List quotes (filters: `sourceType`, `mood`, `search`) |
| GET    | `/api/quotes/:id`            | Get single quote         |
| POST   | `/api/quotes`                | Create quote (multipart) |
| PUT    | `/api/quotes/:id`            | Update quote (multipart) |
| DELETE | `/api/quotes/:id`            | Delete quote             |
| GET    | `/api/quotes/stats/moods`    | Mood breakdown           |
| GET    | `/api/quotes/stats/dashboard`| Dashboard overview       |

## Tech Stack

Express · MongoDB/Mongoose · Multer (image uploads) · Vanilla JS · CSS Masonry Grid
# Jenkins Test
# Test Trigger Sat Apr 11 15:46:41 UTC 2026
