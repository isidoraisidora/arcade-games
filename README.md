# Pixel Palace

A browser-based, retro-style arcade built with Next.js, React, TypeScript, and PostgreSQL. Five keyboard-friendly games work without an account; guest scores live in the current browser tab. Registering saves scores to the shared leaderboard.

## Get started

Requirements: Node.js 22+, npm, and Docker Desktop (for the included PostgreSQL service).

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET` with a unique secret. Generate one with:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. Start PostgreSQL and create its tables. The quickest option is to let Prisma
   create the tables from its schema:

   ```sh
   docker compose up -d db
   npm ci
   npm run db:generate
   npm run db:push
   ```

   To create the database and tables manually instead, connect to PostgreSQL as
   an administrator, run `CREATE DATABASE arcade;`, connect to the new `arcade`
   database, and execute [`prisma/schema.sql`](./prisma/schema.sql). For `psql`:

   ```sh
   psql -d postgres -c "CREATE DATABASE arcade;"
   psql -d arcade -f prisma/schema.sql
   ```

   The SQL file matches [`prisma/schema.prisma`](./prisma/schema.prisma). Use
   either the Prisma setup or the manual SQL—not both on the same empty database.

3. Start the web app:

   ```sh
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

Guest scores remain in `sessionStorage` for that tab and are never sent to the database. Account passwords are hashed with bcrypt; signed-in scores are validated on the server and stored in PostgreSQL.

## Games

| Game | Controls |
| --- | --- |
| Snake | Arrow keys or WASD |
| Block Party | Left/right to move, up to rotate |
| Breakout | Left/right to move the paddle |
| Pong | Left/right to move your paddle |
| Space Invaders | Left/right to move, Space to fire |
| All games | P to pause |

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the development server |
| `npm run lint` | Lint the application |
| `npm run build` | Create a production build |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Sync the Prisma schema to the configured database |
| `npm run db:migrate` | Create and apply a development migration |
| `npm run db:studio` | Open Prisma Studio |
| `docker compose up -d db` | Start the local PostgreSQL container |
| `docker compose down` | Stop the local PostgreSQL container |

The production `Dockerfile` uses Next.js standalone output. Set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` in the deployment environment. The GitHub Actions workflow runs Prisma generation, lint, and a production build for pushes to `main` and pull requests.
