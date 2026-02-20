# DigitalMarketingQUILL Tasker

Уеб приложение за управление на задачи, създадено за дигитални маркетолози и блогъри.

DigitalMarketingQUILL Tasker предоставя личен dashboard, в който всеки потребител може да организира маркетинговия си workflow чрез задачи с описание, краен срок и статус.

![Build Status](https://img.shields.io/badge/build-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
[![Netlify Status](https://api.netlify.com/api/v1/badges/afe69858-9151-4a59-ae7c-082c6f50081c/deploy-status)](https://app.netlify.com/projects/bolgdigidem/deploys)

## Concept of the Site

Основната идея на платформата е бързо и практично task управление за маркетинг дейности:

- регистрация и вход на потребители;
- персонален dashboard след успешен login;
- създаване на задачи (напр. SEO статия, email одит, content calendar);
- задаване на описание и deadline;
- маркиране на задача като `OPEN` или `COMPLETED`;
- филтриране и сортиране за по-добра видимост на приоритетите.

Приложението е ориентирано към прост UX, висока яснота и ежедневна употреба.

## Core Features

- Authentication: login/register поток
- Task management: Create, Read, Update, Delete
- Status workflow: `OPEN` / `COMPLETED`
- Overdue indicators за отворени просрочени задачи
- Filters: всички, отворени, завършени
- Deadline sorting: ascending / descending
- Responsive layout за desktop и mobile

## Core User Flow

1. Потребителят се регистрира или влиза
2. Отваря личния dashboard
3. Добавя нови задачи
4. Редактира, завършва или изтрива задачи
5. Използва филтри и сортиране за планиране на работата

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5
- Build Tool: Vite
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Deployment: Netlify (via GitHub Actions)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Run dev server
npm run dev
```

### Deploy to Netlify

**Quick deployment (5 minutes):**

1. See [NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md) for step-by-step guide
2. Use [PRE_DEPLOY_CHECKLIST.md](./PRE_DEPLOY_CHECKLIST.md) to verify setup

**The fix:** GitHub Actions workflow now uses `nwtgck/actions-netlify@v3.0` (v2.0.11 doesn't exist)

## Demo Credentials

- Email: `admin@digiquill.com`
- Password: `pass123`

Other demo users: `svi@gmail.com`, `maria@gmail.com`, `peter@gmail.com` (same password)

## Project Structure

```text
blogDEMO/
├── app.js                     # Main single-page app logic (auth + dashboard + tasks)
├── src/
│   ├── pages/                 # Modular page controllers
│   ├── components/            # Reusable UI components
│   ├── services/              # Data/business logic services
│   ├── utils/                 # Utility helpers
│   └── styles/                # Project styles
├── db/
│   ├── migrations/            # SQL migrations
│   └── seed.sql               # Seed data
├── package.json
└── vite.config.js
```

## Run Locally

```bash
npm install
npm run dev
```

Vite ще покаже локалния адрес в терминала.

## Notes

- Проектът е подходящ за demo, обучение и бързо прототипиране.
- Концепцията може да се разшири с приоритети, роли, екипни бордове, нотификации и cloud sync.

## Documentation

- [README_new.md](./README_new.md)
- [SETUP.md](./SETUP.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [.github/copilot-instructions.md](./.github/copilot-instructions.md)

## License

MIT
