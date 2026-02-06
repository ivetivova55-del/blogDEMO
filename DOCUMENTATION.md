# Blog Demo - IT & Marketing News Blog

A modern, feature-rich blogging platform for sharing IT and marketing news, built with vanilla JavaScript, Vite, and Supabase.

## Project Overview

BlogDemo is a multi-page web application that demonstrates professional software development practices. It features user authentication, article management with image uploads, admin dashboard, and responsive design using Bootstrap 5.

### Key Features
- 🔐 **Authentication System**: Secure login/registration with role-based access control
- 📝 **Article Management**: Create, edit, delete articles with rich formatting
- 🖼️ **Image Upload**: Upload and display article cover images via Supabase Storage
- 💬 **Comments**: Community discussions on articles
- 👑 **Admin Dashboard**: Manage users, moderate content, view statistics
- 📱 **Responsive Design**: Mobile-first approach with Bootstrap 5
- 🔍 **Search & Filter**: Find articles by category and keywords
- ⚡ **Fast Performance**: Vite for instant module replacement and optimized builds

## Tech Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Netlify/Vercel (deployment ready)

## Project Structure

```
blogDEMO/
├── src/
│   ├── index.html              # Main HTML entry point
│   ├── main.js                 # Application router and initialization
│   ├── pages/                  # Page modules (8+ pages)
│   ├── components/             # Reusable UI components
│   ├── services/               # Business logic & API calls
│   ├── utils/                  # Helpers, validators, constants
│   └── styles/                 # CSS modules (main, components, layout)
├── db/
│   ├── migrations/             # SQL schema creation scripts
│   └── seed.sql               # Sample data
├── .github/
│   └── copilot-instructions.md # AI development guidelines
├── package.json                # Dependencies
├── vite.config.js             # Vite configuration
└── .env.example               # Environment template
```

## Installation & Setup

### Prerequisites
- Node.js v16+
- npm or yarn
- Supabase account (free tier available)

### Local Development

1. **Clone Repository**
```bash
git clone <repository-url>
cd blogDEMO
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Setup Supabase**
   - Create project at https://supabase.com
   - Execute migration scripts in Supabase SQL editor (`db/migrations/*.sql`)
   - Run seed data (`db/seed.sql`)
   - Create `article-images` storage bucket

5. **Start Development**
```bash
npm run dev
# Opens http://localhost:3000
```

6. **Build for Production**
```bash
npm run build
# Output: dist/
```

## Demo Account Credentials

Test the application using demo credentials:

**Regular User:**
- Email: demo@example.com
- Password: demo123456

**Admin User:**
- Email: admin@example.com  
- Password: admin123456

## Pages & Features

### User Pages
1. **Home** (`/`) - Landing page with featured articles
2. **Login** (`/login`) - User authentication
3. **Register** (`/register`) - New account creation
4. **Profile** (`/profile`) - User account management
5. **My Articles** (`/my-articles`) - User's published articles

### Content Pages
6. **Articles List** (`/articles`) - Browse all articles with filtering
7. **Article Detail** (`/article/:id`) - Full article view with comments
8. **Create Article** (`/create-article`) - Write new articles

### Admin Pages
9. **Admin Dashboard** (`/admin`) - Manage users, articles, statistics

## Database Schema

### users
- id, email, full_name, avatar_url, role, created_at, updated_at

### categories
- id, name, slug, description, created_at

### articles
- id, title, content, excerpt, cover_image_url, category_id, author_id, status, views, created_at, updated_at

### comments
- id, article_id, author_id, content, status, created_at, updated_at

## Deployment

### Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
5. Deploy!

### Deploy to Vercel

Similar process - import from GitHub and configure environment variables.

## Development Guidelines

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for:
- Architecture principles
- Coding standards
- File naming conventions
- Modular design patterns
- Git workflow
- Code review checklist

## Git Commit History

The repository demonstrates 15+ meaningful commits across 3+ days:

**Phase 1 (Day 1)**: Project setup and structure
**Phase 2 (Day 2)**: Frontend pages and components
**Phase 3 (Day 3)**: Backend integration and documentation

## Features in Detail

### Authentication & Authorization
- Secure password hashing (Supabase Auth handles this)
- JWT token-based sessions
- Role-based access control (User/Admin)
- Session persistence with localStorage

### Article Management
- Rich text formatting support
- Automatic excerpt generation
- Cover image upload (max 5MB)
- Draft/published status
- View counter
- Timestamp tracking

### Admin Features
- User role management
- Article moderation
- Statistics dashboard
- User activity monitoring

### Performance
- Lazy loading for images
- Pagination (10 items per page)
- Optimized CSS with utility classes
- Fast module bundling with Vite

## Security Considerations

- ✅ SQL injection prevention (Supabase parameterized queries)
- ✅ XSS protection (textContent vs innerHTML)
- ✅ CORS handling via Supabase
- ✅ Row Level Security (RLS) policies
- ✅ Environment variables for secrets
- ✅ Secure password requirements (6+ chars)
- ✅ Admin-only endpoints protected
- ✅ User data validation

## Troubleshooting

**Supabase connection fails:**
- Verify API URL and key in .env
- Check network connectivity
- Ensure Supabase project is running

**Images not uploading:**
- Confirm `article-images` bucket exists
- Check file size (max 5MB)
- Verify image format (JPEG, PNG, WebP)

**Build fails:**
- Delete node_modules and .cache
- Run `npm install` again
- Check Node version (v16+)

## License

MIT - Feel free to use for learning and development.

---

**Built with ❤️ using Vite, Supabase, and Bootstrap**

*Last Updated: February 6, 2026*
