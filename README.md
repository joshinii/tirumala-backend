# Tirumala Planners - Backend API

Backend service for Tirumala Planners website, a wedding and event planning business. Built with Express.js, SQLite3, and Nodemailer.

## Features

- **Contact Form API** - Accepts customer inquiries and sends email notifications
- **Database Storage** - Saves all customer contacts to SQLite database
- **Asset Management** - Serves architectural plans and elevation images
- **File Filtering** - Filter assets by category (elevation/plan)
- **CORS Support** - Configured for frontend integration

## Tech Stack

- **Framework:** Express.js (v4.21.2)
- **Database:** SQLite3 (v5.1.7)
- **Email:** Nodemailer (v6.9.16)
- **Port:** 3000 (default)

## API Endpoints

### Health Check
- **GET /** - Server health check

### Contact Form
- **POST /api/send-quote** - Submit customer inquiry
  - Body: `{ name, email, phone, message }`
  - Response: `{ text: "Form submitted and email sent successfully." }`

### Asset Management
- **GET /api/files?category={category}** - List files by category
  - Query: `category` (optional) - "elevation" or "plan"
  - Response: `["file1.jpg", "file2.jpg"]`

- **GET /api/assets/:file** - Serve individual asset file
  - Supports: PDF, JPG, PNG, GIF, SVG

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with required variables:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_OWNER=owner-email@example.com
PORT=3000
```

3. Start the server:
```bash
npm start
```

## Frontend Integration

This backend is designed to work with the Angular frontend at:
- Local: http://localhost:4200
- Production: https://v0-tirumala-planners-k6aoirwdboc.vercel.app
- Production: https://www.tirumalaplanners.com

## Database Schema

**contacts** table:
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `name` - TEXT NOT NULL
- `email` - TEXT NOT NULL
- `phone` - TEXT NOT NULL
- `message` - TEXT NOT NULL

## Development

The server runs on port 3000 by default. All API endpoints are prefixed with `/api`.

For local development, ensure your frontend proxy is configured to forward `/api/*` requests to `http://localhost:3000`.
