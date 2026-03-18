# ResourceHub — Full Project Documentation

## 1. Project Overview

ResourceHub is a full-stack personal resource management web application. Users can save, organize, search, and prioritize web links and files. It works like a smart bookmark manager with intelligent auto-tagging, 4 view modes, and priority tracking.

**Live URLs:**
- Frontend: https://resource-hub-roan.vercel.app
- Backend API: https://resource-hub-backend-1vhg.onrender.com/docs
- GitHub: https://github.com/dheepakkaran/resource-hub-

---

## 2. Tech Stack

**Frontend:**
- React 18 — UI framework
- Vite 5 — build tool and dev server
- Tailwind CSS 3 — utility-first styling
- Axios — HTTP client for API calls
- Lucide React — icon library
- React Hot Toast — notification toasts
- clsx — conditional CSS class utility

**Backend:**
- Python 3.11
- FastAPI 0.115.5 — async web framework
- SQLAlchemy 2.0.36 — ORM
- aiosqlite 0.20.0 — async SQLite driver
- Pydantic 2.10.3 — data validation
- httpx 0.28.0 — async HTTP client for scraping
- BeautifulSoup4 4.12.3 — HTML parsing
- Uvicorn 0.32.1 — ASGI server

**Database:** SQLite (single-file, zero-config)

**Deployment:**
- Vercel — React frontend (Free)
- Render — FastAPI backend + SQLite (Free)
- GitHub — source code

---

## 3. System Architecture

```
USER (Browser / Mobile)
        |
        | HTTPS
        v
VERCEL (CDN)
React + Vite Frontend
- Static HTML/CSS/JS served globally
- Calls backend via VITE_API_URL env var
        |
        | HTTPS API Calls
        v
RENDER (Cloud Server)
FastAPI Backend (Python)
  |-- Routers (/resources, /files)
  |-- Services (metadata.py — scrapes URLs, generates tags)
  |-- SQLAlchemy ORM
  |-- SQLite Database (resources.db)
  |-- External websites (scraped for metadata)
```

**Request Flow:**
User types URL → Frontend debounces 700ms → POST /api/resources/preview → Backend scrapes URL → Returns title + tags → Frontend shows live preview → User clicks Save → POST /api/resources → Saved to SQLite

---

## 4. Folder Structure

```
resource-hub/
  backend/
    main.py              # FastAPI app, CORS, middleware
    database.py          # SQLAlchemy engine, session, migrations
    models.py            # Resource database model
    schemas.py           # Pydantic request/response models
    requirements.txt     # Python dependencies
    .python-version      # Pins Python 3.11.9 for Render
    routers/
      resources.py       # CRUD endpoints
      files.py           # File upload/download endpoints
    services/
      metadata.py        # Smart auto-tagger + URL scraper

  frontend/
    index.html
    vite.config.js       # Vite config, dev proxy
    tailwind.config.js
    package.json
    src/
      App.jsx            # Root component, layout, header, views
      main.jsx           # React DOM render entry
      index.css          # Global styles, animations
      api/
        index.js         # All API calls (axios)
      hooks/
        useResources.js  # Custom hooks for data fetching
      components/
        AddResourceModal.jsx   # Add URL/file modal with live preview
        EditResourceModal.jsx  # Edit resource modal
        ResourceCard.jsx       # Card view item
        ListView.jsx           # List view
        CalendarView.jsx       # Calendar view (monthly grid)
        PriorityView.jsx       # Kanban priority board
        TagsBar.jsx            # Tags filter bar
        TagBadge.jsx           # Individual tag chip
        PriorityBadge.jsx      # Priority indicator + click-to-cycle
        CategoryIcon.jsx       # Icon based on resource category
```

---

## 5. Backend Deep Dive

### 5.1 main.py — App Entry Point

FastAPI app with lifespan context manager runs init_db() and migrate_db() on startup. CORS middleware allows requests from localhost (dev) and Vercel URL (production). The FRONTEND_URL environment variable controls which origin is allowed.

Why FastAPI? It is async-native, meaning it can handle multiple URL scraping requests simultaneously without blocking. It also auto-generates Swagger docs at /docs.

### 5.2 database.py — Database Layer

Uses aiosqlite driver so all database calls are non-blocking (async). init_db() creates tables on first run. migrate_db() runs ALTER TABLE to add new columns to existing databases without losing data.

Why SQLite? For personal use, SQLite is perfect — no server needed, single file, zero configuration.

### 5.3 models.py — Database Model

Resource model columns: id, title, url, description, resource_type, file_path, file_name, file_size, favicon, thumbnail, category, priority, _tags (JSON string), created_at, updated_at.

Key design decision — Tags stored as JSON string instead of a separate many-to-many table:

```python
_tags column stores: '["python", "fastapi", "tutorial"]'

@property
def tags(self) -> list[str]:
    return json.loads(self._tags or "[]")

@tags.setter
def tags(self, value: list[str]):
    self._tags = json.dumps(value)
```

A Python property getter/setter handles serialization. Keeps schema simple while still being searchable with SQL ILIKE queries.

### 5.4 schemas.py — Data Validation

- URLCreateRequest — validates incoming URL + optional custom title/tags
- ResourceUpdate — all fields optional (partial update support)
- ResourceOut — shapes what the API returns to frontend

ResourceOut.from_orm_resource() reads the tags property (not _tags raw column) when serializing.

### 5.5 routers/resources.py — API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| /api/resources | GET | List with optional filters |
| /api/resources | POST | Create from URL |
| /api/resources/preview | POST | Scrape without saving |
| /api/resources/tags | GET | All unique tags |
| /api/resources/categories | GET | All unique categories |
| /api/resources/{id} | PATCH | Partial update |
| /api/resources/{id} | DELETE | Delete resource |

The /preview endpoint scrapes a URL and returns metadata without saving to DB. The frontend calls this while the user types (debounced 700ms), enabling real-time tag preview.

Search uses SQL ILIKE across title, description, URL, and tags simultaneously.

---

## 6. Frontend Deep Dive

### 6.1 App.jsx — Root Component

State managed here: view (card/list/calendar/priority), search + searchOpen, activeTag, showAdd. Uses no external state management (no Redux/Zustand) — React useState is sufficient.

Custom hooks:
- useResources(queryFilters) — fetches resources, refetches when filters change
- useTags() — fetches all unique tags for TagsBar

### 6.2 api/index.js — API Layer

```javascript
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'
```

In development: uses /api which Vite proxies to localhost:8000
In production: uses VITE_API_URL (Render backend URL)

One line handles both environments without NODE_ENV checks.

### 6.3 AddResourceModal.jsx — Live Preview System

Flow:
1. User types URL
2. useEffect watches url state
3. After 700ms debounce, calls POST /api/resources/preview
4. Shows skeleton shimmer animation while fetching
5. Tags pop in with staggered CSS animation
6. Auto-fills title field if empty

Why 700ms debounce? Too short = too many API calls. Too long = feels slow. 700ms fires after the user finishes typing a word.

### 6.4 View Components

Card View: Flat design, hover reveals actions, shows icon + title + tags + priority + date. On mobile actions always visible.

List View: Compact rows for scanning many items. Tags visible on tablet+, date on large screens only.

Calendar View: Monthly grid with priority-colored dots. Click date to see saved resources.

Priority View (Kanban): 5 columns — Important / High / Medium / Low / Unset. Mobile: horizontally scrollable. Desktop: grid layout.

### 6.5 PriorityBadge — Click-to-Cycle

Priority cycles: null → urgent → high → medium → low → null

Each click sends PATCH /api/resources/{id} with only {priority: newValue}. Backend uses model_dump(exclude_unset=True) so only the changed field updates.

---

## 7. Smart Auto-Tagging Engine

metadata.py contains a 5-layer tagging system:

### Layer 1 — Domain Map
40+ known domains mapped to category and base tags:
- github.com → category: code, tags: [github, repository]
- youtube.com → category: video, tags: [youtube]
- medium.com → category: article, tags: [medium, blog]

### Layer 2 — Tech Term Regex Scanner
60+ technology terms detected via regex word-boundary matching in title + description. Covers: AI/ML (claude, chatgpt, langchain, pytorch), Languages (python, typescript, rust, golang), Frameworks (react, fastapi, django, nextjs), Cloud (aws, gcp, firebase, vercel), Databases (postgresql, mongodb, redis, sqlite), Security, Blockchain, Data Science.

### Layer 3 — Content Type Keywords
Detects content format: tutorial, cheatsheet, interview, guide, roadmap, crash-course, comparison, announcement, release, open-source, etc.

### Layer 4 — Meta Keywords
Reads HTML meta name="keywords" tag from the page if present.

### Layer 5 — Title Word Extraction
Extracts meaningful non-stop-words from the page title. Has 350+ word stop-word list filtering common words like "the", "and", "how".

Final output: Deduplicated, capped at 12 tags per resource.

---

## 8. Data Flow — Saving a URL

```
1. User types "https://youtube.com/watch?v=abc" in modal

2. useEffect → 700ms debounce starts

3. POST /api/resources/preview { url: "..." }

4. Backend metadata.py:
   - httpx fetches YouTube page HTML
   - BeautifulSoup parses og:title, og:description, og:image
   - Domain map: youtube.com → category=video, tags=[youtube]
   - Tech scan: "Python Tutorial" → tags += [python, tutorial]
   - Returns: { title, description, favicon, thumbnail, tags, category }

5. Frontend:
   - Fills title input with auto-detected title
   - Animates new tags with tag-pop CSS keyframe
   - Stores autoTags in state

6. User clicks Save → POST /api/resources { url, custom_title, custom_tags }

7. Backend create_url_resource():
   - Calls fetch_url_metadata() for final tags
   - Merges auto-tags + custom_tags (deduped)
   - db.add() → db.commit() → db.refresh()
   - Returns ResourceOut

8. Frontend: onAdded() → refetch() → UI shows new card
```

---

## 9. Key Features Explained

**Real-Time Tag Preview:** /preview endpoint called while user is still in modal before saving. Gives instant feedback. Most bookmark managers only show tags after saving.

**4 View Modes:** Card (visual grid), List (dense rows), Calendar (saving habits over time), Priority (kanban focus board).

**Priority System:** 5 levels — Important/High/Medium/Low/None. Stored as string in DB. Click to cycle through priorities inline with no edit modal needed.

**Mobile-First Design:**
- Search bar expands full-width on mobile
- Add modal slides up as bottom sheet (vs centered on desktop)
- Priority kanban scrolls horizontally on mobile
- Action buttons always visible on touch devices
- Tags wrap to next line (no horizontal scroll)

**File Upload:** Drag-and-drop or click. Extension-based auto-tagging (.py → [code, python]). Files stored on server, downloadable via /api/files/download/{id}.

---

## 10. API Reference

GET /api/resources
Query params: search, tag, category, resource_type, priority, skip, limit

Response example:
```json
{
  "id": 1,
  "title": "Build a REST API with FastAPI",
  "url": "https://...",
  "category": "docs",
  "priority": "high",
  "tags": ["fastapi", "python", "rest-api", "tutorial"],
  "created_at": "2024-01-15T10:30:00"
}
```

POST /api/resources
```json
{ "url": "https://github.com/...", "custom_title": "Optional", "custom_tags": ["bookmark"] }
```

PATCH /api/resources/{id} — send only changed fields:
```json
{ "priority": "urgent" }
```

---

## 11. Deployment Architecture

**Frontend — Vercel:**
- Detects frontend/ as Vite/React project
- Runs npm run build → static files
- Served globally via CDN
- VITE_API_URL injected at build time
- Auto-deploys on git push to main

**Backend — Render:**
- Runs pip install -r requirements.txt (build)
- Runs python -m uvicorn main:app --host 0.0.0.0 --port $PORT
- SQLite file lives on Render disk
- FRONTEND_URL env var controls CORS
- .python-version pins Python 3.11.9 for pre-built pydantic-core wheels

**Environment Variables:**
- VITE_API_URL (Vercel): https://resource-hub-backend-1vhg.onrender.com
- FRONTEND_URL (Render): https://resource-hub-roan.vercel.app

---

## 12. How to Run Locally

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
API: http://localhost:8000
Swagger docs: http://localhost:8000/docs

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

Vite proxies /api and /uploads to localhost:8000 automatically.

**Mobile Access (same WiFi):**
Find PC IP (e.g. 192.168.0.198) and open http://192.168.0.198:5173 on phone.

---

*ResourceHub v1.0 — Full-stack personal resource manager*
