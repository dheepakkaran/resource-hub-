# 📚 ResourceHub

<div align="center">

![ResourceHub](https://img.shields.io/badge/ResourceHub-Personal%20Resource%20Manager-black?style=for-the-badge&logo=bookmarks&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-black?style=for-the-badge&logo=vercel)](https://resource-hub-roan.vercel.app)
[![API Docs](https://img.shields.io/badge/Backend%20API-Swagger%20Docs-black?style=for-the-badge&logo=fastapi)](https://resource-hub-backend-1vhg.onrender.com/docs)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)

**A smart full-stack bookmark manager that automatically tags your saved links using intelligent metadata scraping.**

[🌐 Live App](https://resource-hub-roan.vercel.app) · [📖 API Docs](https://resource-hub-backend-1vhg.onrender.com/docs) · [🐛 Report Bug](https://github.com/dheepakkaran/resource-hub-/issues)

</div>

---

## ✨ What is ResourceHub?

ResourceHub is a **personal resource manager** built for developers. Paste any URL and it automatically:

- 🔍 **Scrapes the page** — extracts title, description, thumbnail, and favicon
- 🏷️ **Auto-generates tags** — detects tech stack, content type, and domain using a 5-layer tagging engine
- 📂 **Categorizes** — code, article, video, docs, design, research, and more
- ⚡ **Shows live preview** — tags appear in real-time while you are still typing the URL

No more manually tagging every bookmark. Paste → Preview → Save. Done.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔗 URL Saving | Save any web link with auto-scraped metadata |
| 📁 File Upload | Upload PDFs, code files, videos with auto-tagging by extension |
| 🏷️ Smart Auto-Tagging | 5-layer engine: domain map → tech term regex → content type → meta keywords → title extraction |
| ⚡ Real-Time Preview | Tags appear live as you type a URL (debounced 700ms) |
| 🔎 Search | Full-text search across title, description, URL, and tags simultaneously |
| 🗂️ Tag Filtering | Click any tag to filter all resources |
| 🃏 Card View | Visual grid layout for browsing |
| 📋 List View | Compact rows for scanning many items |
| 📅 Calendar View | See resources by the date they were saved |
| 🚩 Priority View | Kanban board — Important / High / Medium / Low / Unset |
| ⭐ Priority Badges | Click to cycle priority inline |
| ✏️ Edit Resources | Update title, tags, category, priority any time |
| 📱 Mobile Responsive | Bottom-sheet modal, horizontal kanban scroll, always-visible actions on touch |
| 🌑 Dark Theme | Full black and grey aesthetic with colorful tags |

---

## 🛠️ Tech Stack

### Frontend
```
React 18        → UI component framework
Vite 5          → Build tool and dev server (HMR)
Tailwind CSS 3  → Utility-first styling
Axios           → HTTP client for API calls
Lucide React    → Icon library
React Hot Toast → Notification toasts
clsx            → Conditional className utility
```

### Backend
```
Python 3.11     → Server language
FastAPI         → Async REST API framework (auto Swagger docs)
SQLAlchemy 2.0  → Async ORM
aiosqlite       → Async SQLite driver
Pydantic 2      → Request and response validation
httpx           → Async HTTP client for URL scraping
BeautifulSoup4  → HTML parsing for metadata extraction
Uvicorn         → ASGI server
```

### Infrastructure
```
Vercel   → Frontend hosting (CDN, auto-deploy on push)
Render   → Backend hosting (Python server)
SQLite   → Database (single file, zero config)
GitHub   → Source control and CI/CD trigger
```

---

## 🏗️ Architecture

```
USER (Browser / Mobile)
        |
        | HTTPS
        v
VERCEL (Frontend CDN)
React + Vite — Static files served globally
VITE_API_URL env var points to Render backend
        |
        | HTTPS API Calls
        v
RENDER (Backend Server)
FastAPI (Python)
  |-- Routers: /resources, /files
  |-- Services: metadata.py (scrapes URLs, generates tags)
  |-- SQLAlchemy ORM
  |-- SQLite Database (resources.db)
```

### Request Flow — Saving a URL
```
1. User types URL in modal
2. Frontend waits 700ms (debounce)
3. POST /api/resources/preview  (no DB write, just scrape)
4. Backend scrapes page metadata (title, description, tags)
5. Frontend shows live tag preview with pop animation
6. User clicks Save → POST /api/resources
7. Backend saves to SQLite, returns resource data
8. Frontend refetches and shows new card
```

---

## 🏷️ Smart Auto-Tagging Engine

The core intelligence in `backend/services/metadata.py` — a 5-layer pipeline:

```
Layer 1 — Domain Map (40+ known domains)
  github.com  → tags: [github, repository]  category: code
  youtube.com → tags: [youtube]             category: video
  medium.com  → tags: [medium, blog]        category: article

Layer 2 — Tech Term Regex Scanner (60+ terms)
  Scans title and description for keywords
  Covers: AI/ML, Languages, Frameworks, Cloud, Databases,
          Security, Blockchain, DevOps, Mobile

Layer 3 — Content Type Detection
  "tutorial"  → tutorial
  "cheatsheet"→ cheatsheet
  "vs"        → comparison
  "interview" → interview

Layer 4 — HTML Meta Keywords
  Reads <meta name="keywords"> from the scraped page

Layer 5 — Title Word Extraction
  Extracts meaningful words from page title
  Filters 350+ stop words (the, and, how, use...)

Output: Deduplicated, capped at 12 tags per resource
```

---

## 📁 Project Structure

```
resource-hub/
├── backend/
│   ├── main.py               # App entry, CORS, middleware
│   ├── database.py           # SQLAlchemy engine + migrate_db()
│   ├── models.py             # Resource ORM model
│   ├── schemas.py            # Pydantic request/response models
│   ├── requirements.txt      # Python dependencies
│   ├── .python-version       # Pins Python 3.11.9 for Render
│   ├── routers/
│   │   ├── resources.py      # CRUD + /preview endpoint
│   │   └── files.py          # Upload + download endpoints
│   └── services/
│       └── metadata.py       # Smart tagger + URL scraper
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js        # Dev proxy: /api → localhost:8000
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                      # Root layout and view switcher
│       ├── index.css                    # Global styles + animations
│       ├── api/index.js                 # Axios API layer (env-aware)
│       ├── hooks/useResources.js        # Data fetching hooks
│       └── components/
│           ├── AddResourceModal.jsx     # Live preview modal
│           ├── EditResourceModal.jsx    # Edit modal
│           ├── ResourceCard.jsx         # Card view item
│           ├── ListView.jsx             # List view
│           ├── CalendarView.jsx         # Monthly calendar
│           ├── PriorityView.jsx         # Kanban board
│           ├── TagsBar.jsx              # Tag filter bar
│           ├── TagBadge.jsx             # Tag chip
│           ├── PriorityBadge.jsx        # Click-to-cycle priority
│           └── CategoryIcon.jsx         # Category icon
│
├── DOCUMENTATION.md          # Full technical documentation
└── README.md
```

---

## ⚙️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone
```bash
git clone https://github.com/dheepakkaran/resource-hub-.git
cd resource-hub-
```

### 2. Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend: http://localhost:8000
Swagger docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

> Vite automatically proxies all `/api` requests to `localhost:8000` — no extra config needed.

### 4. Mobile Access (same WiFi)
```bash
# Find your local IP
ipconfig   # Windows
```
Open `http://YOUR_LOCAL_IP:5173` on your phone.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/resources | List resources with optional filters |
| POST | /api/resources | Create resource from URL |
| POST | /api/resources/preview | Scrape URL metadata without saving |
| GET | /api/resources/tags | All unique tags in database |
| GET | /api/resources/categories | All unique categories |
| GET | /api/resources/{id} | Get single resource |
| PATCH | /api/resources/{id} | Partial update any field |
| DELETE | /api/resources/{id} | Delete resource |
| POST | /api/files | Upload file |
| GET | /api/files/download/{id} | Download file |

### Query Params for GET /api/resources
```
?search=python          full-text search
?tag=tutorial           filter by tag
?category=video         filter by category
?priority=high          filter by priority
?skip=0&limit=50        pagination
```

### Example Request
```bash
curl -X POST https://resource-hub-backend-1vhg.onrender.com/api/resources \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/fastapi/fastapi", "custom_tags": ["reference"]}'
```

---

## 🚀 Deployment Guide

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Login with GitHub
2. Import repo → Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL = https://your-backend.onrender.com
   ```
4. Deploy — auto-redeploys on every `git push`

### Backend → Render

1. Go to [render.com](https://render.com) → Login with GitHub
2. New Web Service → Set:
   ```
   Root Directory : backend
   Build Command  : pip install -r requirements.txt
   Start Command  : python -m uvicorn main:app --host 0.0.0.0 --port $PORT
   Instance Type  : Free
   ```
3. Add environment variable:
   ```
   FRONTEND_URL = https://your-app.vercel.app
   ```

### Environment Variables

| Variable | Where | Value |
|---|---|---|
| VITE_API_URL | Vercel | Your Render backend URL |
| FRONTEND_URL | Render | Your Vercel frontend URL |

---

## 🗄️ Database Schema

```sql
CREATE TABLE resources (
    id            INTEGER PRIMARY KEY,
    title         VARCHAR(500) NOT NULL,
    url           TEXT,
    description   TEXT,
    resource_type VARCHAR(20) DEFAULT 'url',
    file_path     TEXT,
    file_name     VARCHAR(500),
    file_size     INTEGER,
    favicon       TEXT,
    thumbnail     TEXT,
    category      VARCHAR(100),
    priority      VARCHAR(20),
    tags          TEXT DEFAULT '[]',
    created_at    DATETIME,
    updated_at    DATETIME
);
```

Tags are stored as a JSON string `'["python","react","tutorial"]'` — no separate many-to-many table. A Python `@property` handles serialization. Searchable via SQL `ILIKE`.

---

## 📱 Mobile UX

| Feature | Mobile Behavior |
|---|---|
| Add Modal | Slides up as bottom sheet |
| Priority Kanban | Horizontally scrollable columns |
| Action Buttons | Always visible (no hover needed) |
| Tags Bar | Wraps to next line |
| Search | Expands full-width, hides logo |
| Padding | Reduced for small screens |

---

## 🤝 Contributing

```bash
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ by [Dheepakkaran](https://github.com/dheepakkaran)

⭐ **Star this repo if you found it useful!**

</div>
