# PlaymakersHub

## Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

## Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd playmakershub
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following credentials:

   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   VITE_SUPABASE_ADMIN=your_supabase_admin_key

   # Email Service (Brevo)
   VITE_BREVO_API_KEY=your_brevo_api_key
   VITE_BREVO_API_KEY_ADMIN=your_brevo_admin_api_key

   # Other APIs
   VITE_API_KEY=your_api_key_for_playmakers_bot
   ```

## Required Services

### Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project and note your project URL and API keys
3. Set up the following tables in your Supabase database:
   - events
   - members
   - updates
   - chats
   - bookings

### Brevo Email Service

1. Create a Brevo account at [brevo.com](https://brevo.com)
2. Generate API keys for regular and admin operations
3. Configure email templates as needed

## Development

Start the development server:

```bash
npm run dev
```

## Production Build

Create a production-ready build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

This project is configured for deployment with Vercel. The `vercel.json` file contains the necessary configuration.

## Technology Stack

- React (v18.2.0)
- Vite (v5.2.0)
- TailwindCSS (v3.4.4)
- Supabase
- Redux
- React Router DOM
- Material UI
- Framer Motion
- Chart.js
