# AGENTS.md — admin_panel (admin-panel-node)

Backend API serving two frontends: **Websters Media** (`/web/*`: blogs + works) and
**Awesome Events** (`/admin/*`: case studies, portfolio, blog posts), plus a shared
image-upload endpoint (`/api/uploads`). Express 5 + Sequelize 6 + MSSQL (tedious).

## Quick commands

- `npm install` — install deps (Node 18+; `sharp` needs build tools on Windows)
- `npm run dev` — dev server with nodemon (`server.js`, default port 3300)
- `npm start` — production start (used by the `nssm` service on Windows Server)
- `node --check <file>` — syntax check a single ESM file (no test suite exists)

No linter, formatter config, or tests are committed. Verify changes by booting the
server against a reachable MSSQL instance and hitting the route with curl/Postman.

## Environment

Copy `.env.build` to `.env` locally and adjust. Required vars:

| Var | Purpose |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` | MSSQL connection (Sequelize, `config/database.js`) |
| `PORT` | HTTP port (default `3300`) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Single admin login (plaintext compare in `webAuthController.js`) |
| `JWT_SECRET` | Signs login JWTs |
| `JWT_EXPIRES_IN` | Optional, defaults to `"1d"` |

`.env` / `.env.build` / `uploads/` / `temp/*` are gitignored — never commit them.

## Architecture & conventions

- ESM only (`"type": "module"`). **All relative imports must include the `.js`
  extension** (e.g. `import Blog from "../../models/Blog.js"`).
- Entry: `server.js` (creates `uploads/`, runs `initializeDatabase()`, listens) →
  `app.js` (middleware + route mounting, no DB logic).
- Layers: `routes/` → `controllers/` → `models/` (+ `utils/`, `middleware/`).
  Keep DB queries in controllers/models; routes only wire method + path.
- `services/` exists but is **empty** — put new reusable business logic there
  rather than in controllers.
- `config/database.js` is the single Sequelize instance; every model imports it.
  DB init is `sequelize.authenticate()` + `sequelize.sync()` (**auto-sync, no
  migrations** — changing a model alters the table on boot).

## Two API styles — do not mix them

| Area | Routes | Response shape | IDs | Ordering |
|---|---|---|---|---|
| Websters Media | `/web/admin/*`, `/web/blogs`, `/web/works` | `{ success: true, data: ... }` envelope | integer, auto-increment | `createdAt`/`publishedAt` DESC |
| Awesome Events | `/admin/cases`, `/admin/portfolio`, `/admin/blogs` | **raw** model JSON (no envelope) | UUID v4 | `order` ASC |

Awesome Events controllers share the generic factory in
`utils/crudController.js` (`getAll`/`create`/`update`/`remove`). Websters Media
controllers are hand-written per resource. When adding a resource, follow the
style of its area.

## Auth — known gap

`middleware/auth.js` is currently a **no-op** (`next()` unconditionally), so every
route that lists `auth` — i.e. all `/web/admin/*` and `/admin/*` routes — is
**effectively public**. `POST /web/admin/auth/login` does issue a real JWT
(`jsonwebtoken`, payload `{ username }`), but nothing verifies it. If you touch
auth, implement real JWT verification in `middleware/auth.js` (read
`Authorization: Bearer <token>`, `jwt.verify` with `JWT_SECRET`, 401 on failure)
and keep the `auth` argument position in the routes unchanged. Also note
`bcrypt` is installed but unused — admin credentials are plaintext env compare.

## Models (Sequelize, MSSQL)

- `models/Blog.js` → table `blogs` (Websters blog). Notable: `slug` unique,
  `tags` is a JSON **string** defaulting to `"[]"`, `status` defaults to
  `"draft"`, `cover` nullable second image, `contentHtml` is `TEXT("long")`.
- `models/Work.js` → table `works`. `slug` unique, `year` is `STRING(10)`,
  `location` nullable, `status` default `"draft"`.
- `models/CaseStudy.js` → table `awes_case_studies`. All fields nullable;
  `results` is a JSON string default `"[]"`, `graphic` default `"rings"`.
- `models/Portfolio.js` → table `awes_portfolio_projects`. `title` + `image`
  required; `imageAltText` is commented out — do not send it.
- `models/BlogPost.js` → table `awes_blog_posts`. `publishedAt` is `DATEONLY`,
  defaults to now.
- File cleanup lives in model hooks (`beforeDestroy`/`beforeUpdate`): Websters
  models use `deleteFileIfExistsWeb` (only deletes paths containing
  `/uploads/web/`), Awesome models use `deleteFileIfExists` (only deletes paths
  starting with `/uploads/`). Both silently ignore missing files — keep new image
  fields inside the same `uploads/` tree or orphans will accumulate.

## Uploads (`POST /api/uploads`)

- Multipart field name is `file`; optional text field `folder` (defaults to
  `"misc"`). Folders in use: `web/blogs`, `web/works`, `blog`, `portfolio`.
- `middleware/upload.js` (multer): JPEG/PNG/WebP only, 20 MB limit, lands in
  `temp/` first. `uploadController.js` converts to WebP (`sharp`, quality 85),
  saves as `<uuid>.webp` under `uploads/<folder>/`, returns `{ success, url }`
  where `url` is `/uploads/<folder>/<uuid>.webp`, then deletes the temp file
  after ~1s (a crash can leave orphans in `temp/` — safe to delete).
- `uploads/` is served statically at `/uploads` (`app.js`). The string stored in
  `image`/`cover` columns should be either that `/uploads/...` path (Awesome) or
  a full URL whose pathname contains `/uploads/web/...` (Websters), matching what
  the delete hooks expect.

## Errors & misc

- Unknown routes → `middleware/notFound.js` (`404 { success: false, message }`).
  Thrown errors → `middleware/errorHandler.js` (500, logs to console). Awesome
  CRUD `update`/`remove` return bare `{ message: "Not found" }` 404s.
- `express.json()` + `urlencoded` are global; `cors()` is fully open.
- MSSQL dialect uses `encrypt: false` — fine for local SQL Server, must be
  revisited for hosted/encrypted instances.
- Deployment is Windows-only: `deploy.bat` (git pull → `npm i` → `nssm restart
  admin-panel-node`) runs every 5 min via the scheduled task in
  `apn-git-pull.xml`. Paths are hardcoded to
  `C:\inetpub\wwwroot\websters.ae\httpdocs\admin-panel-node`.
