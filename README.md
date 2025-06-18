# Bull Horn Analytics

A modern, cloud-based Point of Sale (POS) and Business Intelligence system built with React, TypeScript, and Supabase.

## Features

- 🔐 Secure Authentication with Role-Based Access Control
- 💰 Point of Sale System
- 📊 Real-time Analytics Dashboard
- 🤖 AI-Powered Business Insights
- 📱 Responsive Design
- 🔄 Real-time Data Sync
- 📈 Sales and Inventory Management
- 👥 Multi-user Support

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini API
- **Deployment**: Vercel
- **State Management**: React Query
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud account (for Gemini API)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bull-horn-analytics.git
   cd bull-horn-analytics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   - Get Supabase URL and anon key from your Supabase project settings
   - Get Google AI API key from Google Cloud Console

5. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

1. Run the Supabase migrations:
   ```bash
   supabase db reset
   ```

2. Create an admin user:
   - Sign up through the application
   - Run this SQL in Supabase SQL editor:
     ```sql
     UPDATE public.users
     SET role = 'admin'
     WHERE email = 'your-admin-email@example.com';
     ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Deployment

The application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy on push to the main branch.

## Security

- Row Level Security (RLS) policies are enabled on all tables
- Content Security Policy (CSP) headers are configured
- Authentication is handled by Supabase Auth
- All API keys are stored as environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@bullhornanalytics.com or open an issue in the GitHub repository. 