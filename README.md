# 📰 blogDEMO - IT & Marketing News Blog

A modern, fully-functional multi-page blog application for IT and marketing news, built with vanilla JavaScript, Vite, Bootstrap 5, and Supabase.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)

## ✨ Features

- 📝 **Article Management** - Create, read, update, delete articles with rich content
- 🔐 **User Authentication** - Register, login, manage user profiles
- 💬 **Comments** - Users can comment on articles and discuss
- 🏞️ **Image Upload** - Upload cover images with validation and optimization
- 🔍 **Search & Filter** - Find articles by keyword, category, date
- 👨‍💼 **Admin Dashboard** - Manage users, articles, and view statistics
- 📱 **Responsive Design** - Mobile-first approach, works on all devices
- ⚡ **Fast Performance** - Instant HMR during development, optimized production build
- 🎨 **Modern UI** - Bootstrap 5 with custom styling and animations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/blogDEMO.git
cd blogDEMO

# Install dependencies
npm install

# Create .env file with Supabase credentials
cp .env.example .env

# Add your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
# Start dev server (localhost:3000 with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Demo Credentials

Test the application with these demo accounts:

**Regular User:**
```
Email: demo@example.com
Password: demo123456
```

**Admin User:**
```
Email: admin@example.com
Password: admin123456
```

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Bootstrap 5.3.0, Vanilla JavaScript (ES6+)
- **Build Tool:** Vite 5.0.0
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Ready for Netlify, Vercel, or any static host

## 📁 Project Structure

```
blogDEMO/
├── src/
│   ├── index.html              # Main HTML entry point
│   ├── main.js                 # Application router
│   ├── pages/                  # Page modules (8+ pages)
│   │   ├── home.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── articles-list.js
│   │   ├── article-detail.js
│   │   ├── create-article.js
│   │   ├── user-profile.js
│   │   └── admin-dashboard.js
│   ├── components/             # Reusable components
│   │   ├── article-card.js
│   │   └── footer.js
│   ├── services/               # Business logic (5 services)
│   │   ├── supabase-client.js
│   │   ├── auth-service.js
│   │   ├── article-service.js
│   │   ├── storage-service.js
│   │   └── user-service.js
│   ├── utils/                  # Utilities
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validators.js
│   └── styles/                 # CSS files
│       ├── main.css
│       ├── components.css
│       └── layout.css
├── db/
│   ├── migrations/             # Database schema
│   │   ├── 001_init_users.sql
│   │   ├── 002_init_categories.sql
│   │   ├── 003_init_articles.sql
│   │   └── 004_init_comments.sql
│   └── seed.sql                # Sample data
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── .env.example                # Environment template
```

## 🗄️ Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | User accounts | id, email, full_name, role, created_at |
| **categories** | Article categories | id, name, slug, description |
| **articles** | Blog posts | id, title, content, cover_image_url, status, category_id, author_id |
| **comments** | Article discussions | id, content, article_id, author_id, status |

### Features
- Row Level Security (RLS) for data protection
- Foreign key relationships
- Indexes for performance
- Cascade delete for referential integrity

## 🔐 Authentication & Authorization

- **JWT Tokens** - Stored in localStorage
- **Roles** - 'user' (default) and 'admin'
- **Protected Pages** - Admin dashboard requires admin role
- **Row Level Security** - Users can only modify their own content (except admins)

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [API.md](./API.md) - Complete API reference for all services
- [SETUP.md](./SETUP.md) - Detailed setup and configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment to Netlify/Vercel
- [TESTING.md](./TESTING.md) - Testing checklist and guidelines
- [FEATURES.md](./FEATURES.md) - Feature list and implementation
- [CONFIG.md](./CONFIG.md) - Configuration and environment variables
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - AI development guidelines

## 🎯 Core Features Explained

### Article Management
- **Create** - Authors can publish articles with categories and cover images
- **Read** - View full articles with related content and comments
- **Update** - Authors can edit their articles anytime
- **Delete** - Authors and admins can remove articles
- **Search** - Full-text search across title and content
- **Filter** - Browse by category or status (draft/published)

### User System
- **Registration** - New users can create accounts
- **Login** - Secure authentication with JWT tokens
- **Profiles** - Users can update their information
- **Admin Panel** - Admins manage users and view statistics

### Comments
- Users can comment on articles
- Comments appear after publication
- Authors can delete inappropriate comments
- Admins can moderate all comments

## ⚙️ Configuration

### Environment Variables

Create `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Building

```bash
# Development
npm run dev

# Production
npm run build
npm run preview
```

## 📊 Performance

- Load time: ~1-2 seconds
- Search response: <500ms
- Optimized images and caching
- Pagination (10 items per page)
- Lazy loading for better performance

## 🧪 Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guidelines including:
- Manual testing checklist
- Test scenarios
- Mobile testing
- Browser compatibility
- Performance benchmarks

## 🚢 Deployment

### Netlify
```bash
# Build
npm run build

# Deploy
# Connect GitHub repo to Netlify
# Configure build command: npm run build
# Configure publish directory: dist
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Git Workflow

This project follows professional git practices:

```bash
# Feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

## 🐛 Known Limitations

- Comments require publication by admin (future: auto-publish verified users)
- Image storage limited to 5MB (Supabase free tier)
- No email notifications yet (future implementation)
- No full-text search across comment content

## 🔮 Future Enhancements

- [ ] Email notifications for comments
- [ ] Social sharing buttons
- [ ] Article tagging system
- [ ] User follow system
- [ ] Article recommendations
- [ ] Advanced caching strategy
- [ ] PWA support
- [ ] Dark mode theme

## 📞 Support

- Check [SETUP.md](./SETUP.md) for troubleshooting
- Review [TESTING.md](./TESTING.md) for testing help
- See [API.md](./API.md) for API reference
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for design details

## 📜 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Created as a comprehensive demo of modern web development practices with vanilla JavaScript, Vite, and Supabase.

---

**Made with ❤️ for IT and Marketing professionals**

⭐ If you find this project helpful, please give it a star!