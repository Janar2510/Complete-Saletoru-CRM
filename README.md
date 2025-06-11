# SaleToru CRM

A modern, AI-powered CRM application built with React, TypeScript, and Supabase.

## Features

- 🚀 Modern dashboard with analytics
- 💼 Complete deals management (Kanban board)
- 👥 Contacts and organizations management
- 📧 Email tracking and templates
- 📅 Calendar integration
- 🤖 AI-powered Guru assistant
- 📊 Advanced analytics and reporting
- 🔐 Secure authentication with Supabase
- 📱 Fully responsive design
- 🎨 Beautiful dark theme with purple accents

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create `.env` file based on `.env.example`
4. Start the development server: `npm run dev`

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router DOM

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Card, StatCard, etc.)
│   └── layout/         # Layout components (Sidebar, Header, etc.)
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Utility libraries (Supabase client, etc.)
├── pages/             # Page components
└── types/             # TypeScript type definitions
```

## Development

To connect to Supabase, make sure to:
1. Click the "Connect to Supabase" button in the top right
2. Set up your database schema
3. Configure Row Level Security (RLS) policies

## License

MIT License - see LICENSE file for details.