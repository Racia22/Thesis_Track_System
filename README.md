# ThesisTrack

Thesis supervision tracking for AUCA: students register a thesis and book prototype reviews,
coordinators assign supervisors, supervisors and students share messages and documents, and
admins see programme-wide analytics.

- `Backend/` — Spring Boot 3 (Java 21), PostgreSQL, Flyway, JWT auth
- `Frontend/` — React 19, Vite, Tailwind CSS 4

## Running locally

Prerequisites: Java 21, Maven, Node 20+, PostgreSQL with a `thesistrack` database and a
`thesistrack_app` role (see `Backend/.env.example`).

```bash
# Backend — http://localhost:8080
cd Backend
mvn spring-boot:run                    # activates the `dev` profile automatically
SEED_ENABLED=true SEED_RESET=true mvn spring-boot:run   # wipe and load demo data

# Frontend — http://localhost:5173
cd Frontend
npm install
npm run dev
```

Running the backend from an IDE instead of Maven? Set `SPRING_PROFILES_ACTIVE=dev`.

## Configuration and secrets

Outside the `dev` profile, `DB_USERNAME`, `DB_PASSWORD` and `JWT_SECRET` have **no defaults** —
the app refuses to start until they are provided. Never enable `dev` in production.
`Backend/.env.example` lists every variable.

## Tests

```bash
cd Backend && mvn test        # service, analytics, stage-time and JWT unit tests
cd Frontend && npm run lint && npm run build
```

## Stage history

Every thesis status change is recorded in `thesis_stage_history` (one row per stage visit), and
`theses.stage_entered_at` tracks when the current stage began. Rows created before this table
existed are back-filled at startup from the older timestamp columns and tagged
`source = 'INFERRED'`. The analytics wait-time endpoint reports both the current backlog and
historical per-stage averages.
