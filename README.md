# The Brain - Intelligent Web Scraping API

This project implements "The Brain", an intelligent API service designed to automate web data extraction using LLMs and a modular toolset.

See `docs/` for project documentation (PRD, Development Plan, etc.).

---

## Disaster Recovery & Restore

If you ever lose your local environment, you can restore and run this project from scratch using only the code and containers:

1. **Clone the repository:**
   ```sh
   git clone <YOUR_REPO_URL>
   cd <YOUR_PROJECT_DIR>
   ```
2. **Build all containers:**
   ```sh
   docker-compose build
   ```
3. **Start all services:**
   ```sh
   docker-compose up -d
   ```
4. **Run tests inside the app container:**
   ```sh
   docker-compose exec app npx vitest run
   ```

- Make sure to provide any required environment variables (see `.env.example`).
- All persistent data will be stored in Docker volumes as defined in `docker-compose.yml`.

---

