# Podman Container for The Brain App

This guide describes how to build, run, and develop The Brain App using Podman (with seamless Docker compatibility).

---

## Prerequisites
- Podman v5+ installed (already present on your system)
- Node.js 20+ (for local development)
- (Optional) Docker, if you want to use Docker interchangeably

---

## Building the Container

```
podman build -t the-brain-app .
```

## Running the Container

```
podman run --rm -it -p 3000:3000 the-brain-app
```

- The app will be available at [http://localhost:3000](http://localhost:3000) by default (change the port if needed).
- You can view and manage the container in Podman Desktop for macOS.

## Using Docker Instead

If you wish to use Docker, the same commands apply:

```
docker build -t the-brain-app .
docker run --rm -it -p 3000:3000 the-brain-app
```

## Notes for Developers
- The Dockerfile is compatible with both Podman and Docker.
- Use relative volume mounts for cross-platform compatibility.
- If you use Compose, prefer simple features supported by both `docker-compose` and `podman-compose`.
- For advanced Podman features, consult [Podman Docs](https://podman.io/docs).

## Troubleshooting
- If you see errors about missing dependencies, run `npm install` inside the container or on your host.
- For permission issues with volume mounts, use relative paths and avoid running containers as root unless necessary.

---

## References
- [Podman Documentation](https://podman.io/docs)
- [Docker Documentation](https://docs.docker.com/)



---

## Database Migration: SQLite → PostgreSQL

**The Brain App** now uses **PostgreSQL** instead of SQLite for all environments. This change enables:

- Full Prisma compatibility in containers (Podman, Docker)
- Advanced JSON (jsonb) support
- Future vector search with `pgvector`

### Why PostgreSQL?

- No binary issues in ARM64 containers
- Powerful JSON and relational features
- Production-ready and scalable

---

## Running with Podman or Docker Compose

1. **Ensure Podman or Docker is installed**

2. **Start the stack:**

   ```sh
   podman-compose up --build
   # or
   docker-compose up --build
   ```

   This launches both the app and a PostgreSQL database.

3. **Environment Variables**

   - `DATABASE_URL` is set to: `postgresql://postgres:postgres@db:5432/brain_db?schema=public`
   - Set your `OPENAI_API_KEY` and `API_KEY` in `.env` (these are passed into the container).

4. **Prisma Migrations**

   - On first run, or after schema changes, run:

     ```sh
     podman-compose exec app npx prisma migrate deploy
     podman-compose exec app npx prisma generate
     ```

---

## Prisma Configuration for PostgreSQL

- See `prisma/schema.prisma` for datasource config:

  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

- All JSON fields now use `Json?` (stored as `jsonb` in Postgres).

---

## Future: Vector Database Integration

- PostgreSQL can be extended with the `pgvector` extension for vector search (AI/LLM features).
- This will allow storing and querying embeddings for semantic search.
- To enable later:
  1. Add `pgvector` to your Postgres instance.
  2. Add `vector` columns to your Prisma schema.
  3. Use Prisma or SQL for similarity search.

---

## Troubleshooting

- If you see connection errors, ensure the `db` service is healthy.
- Prisma errors about missing tables? Run the migration commands above.
- For ARM64/Apple Silicon, PostgreSQL works out-of-the-box (unlike SQLite).

---

## Cleaning Up Old SQLite Files

- All SQLite files and references have been removed from the codebase.
- If you see any `dev.db` or `sqlite` references, please report them.

---

## Useful Commands

- Start stack: `podman-compose up --build`
- Stop stack: `podman-compose down`
- Run migrations: `podman-compose exec app npx prisma migrate deploy`
- Open Postgres shell: `podman-compose exec db psql -U postgres`

