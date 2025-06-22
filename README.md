# AidXBait Management Dashboard

A modern, secure dashboard application built with Next.js for managing users and administrative tasks with role-based access control (RBAC).

## ✨ Features

- **🔐 Authentication & Authorization**: Secure login system with Supabase authentication
- **👥 Role-Based Access Control (RBAC)**: Fine-grained permissions system with multiple user roles
- **📊 User Management**: Complete CRUD operations for user administration
- **🎨 Modern UI**: Beautiful interface built with Tailwind CSS and Radix UI components
- **📱 Responsive Design**: Fully responsive layout that works on all devices
- **🌙 Theme Support**: Dark/light mode toggle with next-themes
- **🔒 Protected Routes**: Middleware-based route protection
- **⚡ Performance**: Optimized with Next.js 15 and React 19

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/)
- **Authentication**: Supabase Auth with SSR
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: React Context + Hooks
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account and project

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd aidxbait-dashboard
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
aidxbait-dashboard/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── rbac/             # RBAC components
│   ├── ui/               # UI components (shadcn/ui)
│   └── users/            # User management components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
│   ├── auth/             # Authentication utilities
│   ├── rbac/             # RBAC configuration
│   └── supabase/         # Supabase client configuration
├── providers/            # React context providers
├── types/                # TypeScript type definitions
└── middleware.ts         # Route protection middleware
```

## 🔑 User Roles & Permissions

The application includes a comprehensive RBAC system with the following roles:

- **Super User**: Full system access
- **Admin**: User management, Operations overview

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 📝 License

This project is private and proprietary.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---
