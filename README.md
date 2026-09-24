# Admin Panel Node API

Backend API that powers **two** websites from a single Express server:

| Site | What the API serves | Base routes |
|---|---|---|
| **Websters Media** (websters.ae) | Blogs + Works (case-study style portfolio) | `/web/*` |
| **Awesome Events** | Case studies, portfolio projects, blog posts | `/admin/*` |
| Shared | Image uploads + static file serving | `/api/uploads`, `/uploads` |

**Stack:** Node.js 18+ (ES modules) · Express 5 · Sequelize 6 · MSSQL (`tedious`) ·
Multer + Sharp (image uploads) · JSON Web Tokens (`jsonwebtoken`) · `cors`, `dotenv`, `uuid`.

> [!WARNING]
> **Security notice (read first):** `middleware/auth.js` is currently a no-op —
> it calls `next()` without verifying any token. That means every route wired with
> `auth` (all `/web/admin/*` and `/admin/*` routes) is **effectively public** right
> now. See [Authentication](#3-authentication--known-gap) before exposing this server.

---

## Table of contents

1. [Project structure](#1-project-structure)
2. [Prerequisites & setup](#2-prerequisites--setup)
3. [Authentication (known gap)](#3-authentication--known-gap)
4. [How it works (request lifecycle)](#4-how-it-works-request-lifecycle)
5. [API reference](#5-api-reference)
   - [5.1 Websters Media — Auth](#51-websters-media--auth)
   - [5.2 Websters Media — Admin Blogs](#52-websters-media--admin-blogs)
   - [5.3 Websters Media — Admin Works](#53-websters-media--admin-works)
   - [5.4 Websters Media — Public Blogs & Works](#54-websters-media--public-blogs--works)
   - [5.5 Awesome Events — Case studies / Portfolio / Blogs](#55-awesome-events--case-studies--portfolio--blogs)
   - [5.6 Image uploads & static files](#56-image-uploads--static-files)
6. [Data models (tables & fields)](#6-data-models-tables--fields)
7. [Image & file handling](#7-image--file-handling)
8. [Error responses](#8-error-responses)
9. [Configuration reference (.env)](#9-configuration-reference-env)
10. [Running locally](#10-running-locally)
11. [Deployment (Windows Server)](#11-deployment-windows-server)
12. [Common tasks for future devs](#12-common-tasks-for-future-devs)
13. [Known limitations & TODOs](#13-known-limitations--todos)

---

## 1. Project structure

```
admin_panel/
├── server.js                  # Entry point: ensures uploads/ exists, connects DB, listens
├── app.js                     # Express app: middleware + route mounting + static + error handlers
├── config/
│   └── database.js            # Single Sequelize instance (MSSQL). Imported by every model
├── models/
│   ├── index.js               # initializeDatabase(): authenticate() + sync() (no migrations)
│   ├── Blog.js                # Websters blogs        → table `blogs`
│   ├── Work.js                # Websters works        → table `works`
│   ├── CaseStudy.js           # Awesome case studies  → table `awes_case_studies`
│   ├── Portfolio.js           # Awesome portfolio     → table `awes_portfolio_projects`
│   └── BlogPost.js            # Awesome blog posts    → table `awes_blog_posts`
├── routes/
│   ├── admin/
│   │   ├── webAuthRoutes.js   # POST /web/admin/auth/login
│   │   ├── webBlogRoutes.js   # /web/admin/blogs
│   │   ├── webWorkRoutes.js   # /web/admin/works
│   │   ├── caseStudyRoutes.js # /admin/cases
│   │   ├── portfolioRoutes.js # /admin/portfolio
│   │   └── blogPostRoutes.js  # /admin/blogs
│   └── public/
│       ├── webBlogRoutes.js   # /web/blogs
│       ├── webWorkRoutes.js   # /web/works
│       └── uploadRoutes.js    # /api/uploads
├── controllers/
│   ├── admin/
│   │   ├── webAuthController.js  # login: env-credential check → JWT
│   │   ├── webBlogController.js  # hand-written CRUD (envelope responses)
│   │   ├── webWorkController.js  # hand-written CRUD (envelope responses)
│   │   ├── caseStudyController.js   # thin: createCrudController(CaseStudy)
│   │   ├── portfolioController.js   # thin: createCrudController(PortfolioProject)
│   │   └── blogPostController.js    # thin: createCrudController(BlogPost)
│   └── public/
│       ├── webBlogController.js  # published-only reads
│       ├── webWorkController.js  # published-only reads
│       └── uploadController.js   # sharp → webp → uploads/<folder>/<uuid>.webp
├── middleware/
│   ├── auth.js          # ⚠️ currently a no-op passthrough (see §3)
│   ├── upload.js        # multer: temp/ staging, image-only, 20 MB cap
│   ├── notFound.js      # 404 { success: false, message: "Route not found" }
│   └── errorHandler.js  # 500 { success: false, message }
├── utils/
│   ├── crudController.js  # Generic getAll/create/update/remove factory (Awesome Events)
│   └── deleteFile.js      # deleteFileIfExists + deleteFileIfExistsWeb (model-hook cleanup)
├── services/            # Empty placeholder — put new reusable business logic here
├── uploads/             # Runtime image store, served at /uploads (gitignored)
├── temp/                # Multer staging dir (gitignored contents; safe to empty)
├── deploy.bat           # Production deploy script (Windows)
└── apn-git-pull.xml     # Windows Scheduled Task definition (runs deploy.bat every 5 min)
```

**Layer rule:** routes only map HTTP method + path → controller; all DB access lives
in controllers/models; reusable logic belongs in `services/` or `utils/`.

---

## 2. Prerequisites & setup

- **Node.js 18+** (ESM, `"type": "module"` — every relative import needs the `.js`
  extension, e.g. `import Blog from "../../models/Blog.js"`).
- **MSSQL Server** reachable from the app host (default `DB_HOST=localhost`).
- Windows build tools if installing `sharp` on Windows.

```bash
npm install          # install dependencies
cp .env.build .env   # then edit credentials (see §9)
npm run dev          # dev server with nodemon (server.js, default port 3300)
npm start            # production start
```

There is no test suite, linter, or formatter config. Sanity-check a file with
`node --check <file>` and verify behaviour by booting against a real MSSQL
instance and hitting the route with curl/Postman.

---

## 3. Authentication — known gap

How login works today:

1. `POST /web/admin/auth/login` with `{ "username", "password" }`.
2. `webAuthController.login` compares both values **in plaintext** against the
   `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars (note: `bcrypt` is installed but
   **not used** anywhere).
3. On match it signs a JWT (`jsonwebtoken`, payload `{ username }`,
   `expiresIn: JWT_EXPIRES_IN || "1d"`) and returns `{ success: true, token, user }`.

The gap: `middleware/auth.js` does **not** verify that token — it just calls
`next()`. All routes that list `auth` as middleware are therefore unprotected.
The fix (when you take it on): verify `Authorization: Bearer <token>` with
`jwt.verify(token, process.env.JWT_SECRET)`, return `401` on missing/invalid
token, and keep the `auth` argument position in every route file unchanged so
wiring stays the same.

---

## 4. How it works (request lifecycle)

1. `server.js` creates `uploads/` if missing, then calls `initializeDatabase()`
   (`models/index.js` → `sequelize.authenticate()` + `sequelize.sync()`).
   **There are no migrations — model changes auto-alter tables on boot.**
2. `app.js` applies `cors()` (fully open), `express.json()`, `express.urlencoded`,
   mounts all routers (see table in the header), serves `uploads/` statically at
   `/uploads`, then falls through to `notFound` (404) and `errorHandler` (500).
3. Admin (write) controllers `create`/`update` rows with `Model.create(req.body)` /
   `instance.update(req.body)` — **no validation layer** beyond Sequelize
   `allowNull`/`unique` constraints, so the frontend must send correct shapes.
4. Public (read) controllers filter Websters content to `status: "published"` only.
5. Image lifecycle: upload endpoint writes the file first, then the frontend stores
   the returned `url` string in the record's `image`/`cover` field. Model hooks
   (`beforeDestroy`/`beforeUpdate`) delete the old file from disk (see §7).

Two response conventions exist — **do not mix them**:

| Area | Shape | Example |
|---|---|---|
| Websters Media (`/web/*`) | `{ success: true, data: ... }` envelope | `{ "success": true, "data": { "id": 1, ... } }` |
| Awesome Events (`/admin/*`) | Raw Sequelize JSON, no envelope | `{ "id": "uuid…", "title": "…" }` (404s are `{ "message": "Not found" }`) |

---

## 5. API reference

Base URL locally: `http://localhost:3300` (or whatever `PORT` is set to).
All request/response bodies are JSON unless noted (`POST /api/uploads` is
`multipart/form-data`). IDs: Websters = integer, Awesome = UUID string.

### 5.1 Websters Media — Auth

#### `POST /web/admin/auth/login`

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | yes | Compared to `ADMIN_USERNAME` |
| `password` | string | yes | Compared to `ADMIN_PASSWORD` (plaintext) |

Success `200`:

```json
{ "success": true, "token": "<jwt>", "user": { "username": "admin" } }
```

Failure `401`: `{ "success": false, "message": "Invalid credentials" }`.

---

### 5.2 Websters Media — Admin Blogs

Admin sees **all** statuses (draft + published), newest first (`createdAt` DESC).
Envelope responses throughout.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/web/admin/blogs` | List all blogs → `{ success, data: [...] }` |
| `GET` | `/web/admin/blogs/:id` | One blog by integer id |
| `POST` | `/web/admin/blogs` | Create blog from JSON body |
| `PUT` | `/web/admin/blogs/:id` | Full/partial update by id |
| `DELETE` | `/web/admin/blogs/:id` | Delete → `{ success: true, message: "Blog deleted successfully" }` |

**Create/update body** (`POST` needs the required fields; `PUT` accepts any subset):

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string(255) | yes | Unique, URL-friendly, e.g. `"dubai-brand-launch"` |
| `title` | string(500) | yes | |
| `excerpt` | string (TEXT) | yes | Short teaser |
| `image` | string(1000) | yes | Main image — upload first via §5.6, store returned `url` |
| `imageAltText` | string(500) | no | Defaults to `""` |
| `cover` | string(1000) | no | Optional second/hero image (`null` allowed) |
| `category` | string(100) | yes | e.g. `"Branding"` |
| `tags` | string (TEXT) | no | **JSON-encoded array string**, e.g. `"[\"branding\",\"dubai\"]"`. Defaults to `"[]"` |
| `author` | string(255) | yes | |
| `publishedAt` | date (ISO string) | yes | e.g. `"2026-09-01T00:00:00.000Z"` |
| `readingMinutes` | integer | yes | e.g. `5` |
| `contentHtml` | string (LONGTEXT) | yes | Full article HTML |
| `status` | string(20) | no | `"draft"` (default) or `"published"` — only `published` appears on public routes |

Example — create:

```bash
curl -X POST http://localhost:3300/web/admin/blogs \
  -H "Content-Type: application/json" -d '{
    "slug": "dubai-brand-launch",
    "title": "Dubai Brand Launch",
    "excerpt": "How we launched…",
    "image": "/uploads/web/blogs/a3f9b220-8e2f-4081-b214-1b8e83e4146a.webp",
    "category": "Branding",
    "tags": "[\"branding\",\"dubai\"]",
    "author": "Jane Doe",
    "publishedAt": "2026-09-01T00:00:00.000Z",
    "readingMinutes": 5,
    "contentHtml": "<p>Hello…</p>",
    "status": "published"
  }'
```

`GET /:id` and `PUT /:id` with an unknown id return
`404 { success: false, message: "Blog not found" }`.

---

### 5.3 Websters Media — Admin Works

Same shape as admin blogs, but for portfolio pieces. Ordered by `createdAt` DESC.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/web/admin/works` | List all works |
| `GET` | `/web/admin/works/:id` | One work by integer id |
| `POST` | `/web/admin/works` | Create work |
| `PUT` | `/web/admin/works/:id` | Update work |
| `DELETE` | `/web/admin/works/:id` | Delete → `{ success: true, message: "Work deleted successfully" }` |

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string(255) | yes | Unique |
| `title` | string(255) | yes | |
| `category` | string(255) | yes | |
| `client` | string(255) | yes | |
| `year` | string(10) | yes | Stored as **string**, e.g. `"2026"` |
| `location` | string(255) | no | Nullable, e.g. `"Dubai, UAE"` |
| `description` | string (TEXT) | yes | |
| `image` | string(1000) | yes | Upload first, store returned `url` |
| `imageAltText` | string(500) | no | Defaults to `""` |
| `status` | string(20) | no | `"draft"` (default) / `"published"` |

Unknown id → `404 { success: false, message: "Work not found" }`.

---

### 5.4 Websters Media — Public Blogs & Works

No auth. **Only `status: "published"` rows are returned.** Blogs sort by
`publishedAt` DESC; works by `createdAt` DESC. Envelope responses.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/web/blogs` | List published blogs |
| `GET` | `/web/blogs/:slug` | One published blog by slug |
| `GET` | `/web/works` | List published works |
| `GET` | `/web/works/:slug` | One published work by slug |

Unknown slug → `404 { success: false, message: "Blog not found" }` (or `"Work not found"`).
Note the lookup key difference: **admin routes use integer `:id`, public routes use `:slug`**.

---

### 5.5 Awesome Events — Case studies / Portfolio / Blogs

All three resources share the generic factory `utils/crudController.js`, so they
behave identically: list ordered by `order` ASC, raw JSON bodies, **no get-by-id
endpoint** (there is no `GET /:id` on these routers).

| Method | `/admin/cases` (CaseStudy) | `/admin/portfolio` (PortfolioProject) | `/admin/blogs` (BlogPost) |
|---|---|---|---|
| `GET /` | list case studies | list portfolio projects | list blog posts |
| `POST /` | create | create | create |
| `PUT /:id` | update by UUID | update by UUID | update by UUID |
| `DELETE /:id` | delete by UUID (returns deleted row) | delete by UUID (returns deleted row) | delete by UUID (returns deleted row) |

Unknown id on update/delete → `404 { "message": "Not found" }` (bare message, no envelope).

**Case study fields** (all nullable; table `awes_case_studies`):

| Field | Type | Notes |
|---|---|---|
| `code` | string(100) | Short code, e.g. `"DXB-001"` |
| `tag` | string(100) | Label/tag |
| `title` | string(500) | |
| `challenge` | TEXT | |
| `solution` | TEXT | |
| `execution` | TEXT | |
| `results` | TEXT | **JSON-encoded string**, defaults to `"[]"` |
| `graphic` | string(50) | Defaults to `"rings"` |
| `order` | integer | Sort key, defaults to `0` |

**Portfolio fields** (table `awes_portfolio_projects`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string(500) | yes | |
| `description` | string(500) | no | Nullable |
| `image` | string(1000) | yes | Upload first, store returned `url` |
| `order` | integer | no | Sort key, defaults to `0` |

> `imageAltText` is commented out in the model — **do not send it** for portfolio
> records; it is not a column.

**Blog post fields** (table `awes_blog_posts`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string(500) | yes | |
| `image` | string(1000) | yes | Upload first, store returned `url` |
| `link` | string(1000) | no | Optional external URL |
| `order` | integer | no | Sort key, defaults to `0` |
| `shortDesc` | TEXT | no | Nullable teaser |
| `content` | TEXT | no | Nullable body |
| `publishedAt` | DATEONLY | no | `"YYYY-MM-DD"`, defaults to today |

Example — create a portfolio item:

```bash
curl -X POST http://localhost:3300/admin/portfolio \
  -H "Content-Type: application/json" -d '{
    "title": "Gala Dinner Stage",
    "description": "Main stage build",
    "image": "/uploads/portfolio/0890a858-f137-4e5c-a5b2-24eb40ae331c.webp",
    "order": 1
  }'
```

---

### 5.6 Image uploads & static files

#### `POST /api/uploads` — `multipart/form-data`

| Part | Type | Required | Notes |
|---|---|---|---|
| `file` | file | yes | Field name must be `file`. JPEG, JPG, PNG, or WebP only; max 20 MB |
| `folder` | text | no | Subfolder under `uploads/`; defaults to `"misc"`. In use: `web/blogs`, `web/works`, `blog`, `portfolio` |

Success `200`:

```json
{ "success": true, "url": "/uploads/web/blogs/a3f9b220-8e2f-4081-b214-1b8e83e4146a.webp" }
```

How it works (`middleware/upload.js` → `controllers/public/uploadController.js`):
multer stages the file in `temp/` with a random name, then Sharp converts it to
WebP (quality 85), saves it as `<uuid>.webp` under `uploads/<folder>/`, and the
temp file is unlinked ~1s later. Missing file → `400 { success: false, message:
"No file uploaded" }`; wrong mimetype → 500 via the error handler
(`"Only image uploads are allowed"`).

Typical frontend flow:

1. `POST /api/uploads` with `file` + `folder` (e.g. `web/blogs`).
2. Take the returned `url` and put it in the record's `image` (or `cover`) field
   via the relevant `POST`/`PUT` endpoint.

#### `GET /uploads/<folder>/<file>` — static serving

`app.js` serves the `uploads/` directory at `/uploads` (plain static files, no
auth). For Websters records the stored value may also be a full URL — the
cleanup hook only cares that its pathname contains `/uploads/web/`.

---

## 6. Data models (tables & fields)

All models are Sequelize definitions importing the shared instance from
`config/database.js`. Timestamps (`createdAt`, `updatedAt`) are enabled on every
table. `sequelize.sync()` creates/updates tables automatically — there are no
migration files.

| Model file | Table | PK |
|---|---|---|
| `models/Blog.js` | `blogs` | integer auto-increment `id` |
| `models/Work.js` | `works` | integer auto-increment `id` |
| `models/CaseStudy.js` | `awes_case_studies` | UUID v4 `id` |
| `models/Portfolio.js` | `awes_portfolio_projects` | UUID v4 `id` |
| `models/BlogPost.js` | `awes_blog_posts` | UUID v4 `id` |

Field details are documented per-endpoint in §5 (the tables there mirror the
model definitions exactly). Two special notes:

- `Blog.tags` and `CaseStudy.results` are stored as **JSON strings** (`TEXT`),
  not native JSON columns — always `JSON.stringify` on write and `JSON.parse` on
  read. Defaults: `"[]"`.
- `Blog.contentHtml` is `TEXT("long")` (MEDIUMTEXT-scale on MSSQL); `cover` is the
  only nullable image column in the Websters models.

---

## 7. Image & file handling

- `utils/deleteFile.js` exports two helpers, used by model hooks:
  - `deleteFileIfExists(path)` (Awesome models) — deletes only paths starting
    with `/uploads/`, silently ignores missing files.
  - `deleteFileIfExistsWeb(urlOrPath)` (Websters models) — accepts a full URL or
    a path, deletes only when the pathname contains `/uploads/web/`.
- Hooks: `beforeDestroy` deletes the record's image; `beforeUpdate` deletes the
  **previous** image when the `image` field changes. (`Blog.cover` changes do not
  trigger cleanup — replacing a cover orphans the old cover file.)
- Consequence for new fields: any new image column must store values inside the
  `uploads/` tree (and inside `uploads/web/` for Websters models) and should get
  matching `beforeDestroy`/`beforeUpdate` hooks, or orphan files will accumulate.
- `temp/` may contain orphans if the process crashes between multer staging and
  the delayed unlink — safe to delete `temp/*` at any time.

---

## 8. Error responses

| Situation | Status | Body |
|---|---|---|
| Unknown route (`middleware/notFound.js`) | 404 | `{ "success": false, "message": "Route not found" }` |
| Unhandled error (`middleware/errorHandler.js`, logged to console) | 500 | `{ "success": false, "message": "<err.message \| \"Server Error\">" }` |
| Websters admin id not found | 404 | `{ "success": false, "message": "Blog not found" }` / `"Work not found"` |
| Public slug not found | 404 | `{ "success": false, "message": "Blog not found" }` / `"Work not found"` |
| Awesome update/delete id not found | 404 | `{ "message": "Not found" }` (no `success` flag) |
| Bad login | 401 | `{ "success": false, "message": "Invalid credentials" }` |
| Upload without file | 400 | `{ "success": false, "message": "No file uploaded" }` |
| Sequelize validation (e.g. missing required field, duplicate slug) | 500 | `{ "success": false, "message": "<sequelize message>" }` via error handler |

---

## 9. Configuration reference (.env)

Copy `.env.build` to `.env` for local dev. Both files are gitignored — never
commit them.

| Var | Required | Default | Purpose |
|---|---|---|---|
| `DB_NAME` | yes | — | MSSQL database name |
| `DB_USER` | yes | — | MSSQL username |
| `DB_PASSWORD` | yes | — | MSSQL password |
| `DB_HOST` | yes | — | MSSQL host (`localhost` for local SQL Server) |
| `PORT` | no | `3300` | HTTP listen port |
| `ADMIN_USERNAME` | yes | — | Single admin login name |
| `ADMIN_PASSWORD` | yes | — | Single admin password (plaintext compare) |
| `JWT_SECRET` | yes | — | Signs login JWTs |
| `JWT_EXPIRES_IN` | no | `"1d"` | JWT lifetime (e.g. `"1d"`, `"12h"`) |

`config/database.js` uses dialect `mssql` with `encrypt: false` and `logging:
false`. `encrypt: false` is correct for a local/unencrypted SQL Server but must
be revisited (along with host/certs) for any hosted/encrypted instance.

---

## 10. Running locally

```bash
npm install
cp .env.build .env   # edit DB_* + ADMIN_* + JWT_SECRET
npm run dev          # → "Running on 3300" + "Database connected"
```

Verify with:

```bash
curl http://localhost:3300/web/blogs        # public blogs (envelope)
curl http://localhost:3300/admin/portfolio  # portfolio list (raw JSON)
curl -X POST http://localhost:3300/web/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"…"}'
```

If the DB is unreachable you will see the error from `initializeDatabase()` in
the console but the HTTP server still starts; DB-backed routes will then 500.

---

## 11. Deployment (Windows Server)

Production is a Windows box serving `C:\inetpub\wwwroot\websters.ae\httpdocs\admin-panel-node`
via the `admin-panel-node` service managed by **nssm**:

- `deploy.bat`: `git pull` (both `websters` and `origin` remotes, `main`) →
  `npm i --no-audit --no-fund` → `nssm restart admin-panel-node`.
- `apn-git-pull.xml`: Windows Scheduled Task definition that runs `deploy.bat`
  **every 5 minutes** (`PT5M` repetition). To reinstall, import it into Task
  Scheduler on the server.
- All paths in both files are hardcoded to the production directory — update them
  if the install path ever moves.

---

## 12. Common tasks for future devs

- **Add a Websters field** (e.g. to blogs): add the column in `models/Blog.js`,
  restart once against a dev DB so `sync()` alters the table, document the field
  in §5.2, and check whether it needs a cleanup hook (only `image` has one).
- **Add an Awesome resource**: create `models/<Name>.js` (UUID PK, `order`
  column, table `awes_*`, file hooks if it has images), wire
  `controllers/admin/<name>Controller.js` via `createCrudController(Model)`,
  add `routes/admin/<name>Routes.js` in the same 4-route pattern
  (`GET /`, `POST /`, `PUT /:id`, `DELETE /:id`), mount it in `app.js`.
- **Put reusable logic in `services/`** (currently empty) instead of duplicating
  it across controllers.
- **Keep the two response styles separate**: Websters = `{ success, data }`
  envelope, Awesome = raw JSON. Frontend code depends on this.
- **Remember the auth gap** (§3): anything mounted behind `auth` still needs a
  real JWT check before this API holds private data.

## 13. Known limitations & TODOs

1. `middleware/auth.js` is a no-op — admin routes are public (biggest issue).
2. Admin credentials are plaintext env compare; `bcrypt` is installed but unused.
3. No migrations — schema is managed by `sequelize.sync()` on boot.
4. No validation layer — Sequelize constraints only; malformed bodies surface as 500s.
5. Awesome routers have no `GET /:id`; Websters public routes have no pagination.
6. `Blog.cover` replacement does not delete the old cover file.
7. `cors()` is fully open; `encrypt: false` assumes an unencrypted SQL Server.
8. Upload temp-file cleanup is fire-and-forget (`setTimeout` 1s) — crashes leave
   orphans in `temp/` (safe to delete manually).
