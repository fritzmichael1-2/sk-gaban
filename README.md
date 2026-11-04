# SK Barangay Gaban — Full-Stack Website (Supabase Edition)

A responsive public information portal and administration system built with Node.js, Express, EJS, Bootstrap 5, and **Supabase PostgreSQL**.

## Included features

### Public portal
- Home page with latest announcements, projects, and upcoming events
- About page and SK officials directory
- Announcement listing and individual announcement pages
- Programs and projects; events; transparency reports
- Youth service request form and contact form

### Admin portal
- Secure login with bcrypt password hashes and PostgreSQL-backed sessions
- Dashboard statistics
- Create, publish/draft, and delete announcements, projects, events, and transparency reports
- Upload images for announcements, projects, events, and officials
- Manage SK officials directory
- Review youth requests and update their status
- View messages and mark them as read

## Requirements
- Node.js 20 or newer (Node 20 or 22 recommended)
- A Supabase project with PostgreSQL enabled

## 1. Configure Supabase

1. Open your Supabase project dashboard.
2. Select **Connect** and copy the PostgreSQL connection string. Use the Session pooler if your hosting environment requires IPv4 connectivity.
3. In Supabase, open **SQL Editor → New query**.
4. Paste the complete contents of `database/schema.sql` and run it.
5. Keep the database password private. Never put it in browser-side JavaScript or commit it to GitHub.

Alternatively, after setting `DATABASE_URL` locally, run `npm run db:init` to create the tables and initial admin account.

## 2. Run locally

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Supabase PostgreSQL connection string.
3. Set a strong `SESSION_SECRET` and `INITIAL_ADMIN_PASSWORD`.
4. Install packages: `npm install`.
5. Initialize the schema and first admin: `npm run db:init`.
6. Start the app: `npm run dev`.
7. Open `http://localhost:3000`.

Initial admin username defaults to `admin`. The password is the value of `INITIAL_ADMIN_PASSWORD` at the time the account is first created; if omitted, it defaults to `ChangeMe123!`. Change it immediately. The initializer does not overwrite an existing admin account.

## 3. Deploy to Render

Create or open the Render Web Service connected to this GitHub repository. Use:
- Build command: `npm install`
- Start command: `npm start`
- Environment: `NODE_ENV=production`
- `DATABASE_URL`: Supabase PostgreSQL connection string
- `SESSION_SECRET`: long random secret (32+ characters)
- `PGSSLMODE=require`
- `DB_POOL_MAX=5`

Do not configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, or `DB_NAME` for this PostgreSQL version. The app reads `DATABASE_URL`.

After the schema is created in Supabase, push the updated source to GitHub and let Render deploy the new commit.

## Upload storage warning

The current upload middleware saves images to `public/uploads` on the application filesystem. Render's default filesystem is ephemeral, so uploaded images can disappear on redeploy/restart. Before relying on admin image uploads in production, migrate uploads to Supabase Storage or another persistent object-storage service.

## Production and privacy checklist
- Set a unique, strong `SESSION_SECRET` in Render.
- Set `INITIAL_ADMIN_PASSWORD` before first initialization; change the admin password immediately after first login.
- Keep Supabase database credentials server-side only. Never expose the service-role key in the browser.
- Configure Supabase backups appropriate to your plan and export important records regularly.
- Add CSRF protection, audit logs, password change/reset, and stricter role-based permissions before handling sensitive personal information at scale.
- Publish a privacy notice and data-retention policy before collecting youth personal information.
- Use Supabase Row Level Security for any tables accessed directly from a browser client. This server-side Express app currently connects using the PostgreSQL connection string, so keep that connection string private.

This is a starter implementation. Replace placeholder copy and add verified official names, contact details, logos, photos, and approved reports before publication. Do not publish fabricated financial figures or personal information.
