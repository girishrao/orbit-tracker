---
name: Prisma 7 Patterns
description: Prisma 7 breaking changes — LibSQL adapter required, generated client at app/generated/prisma/client.ts
type: reference
---

- Constructor requires a driver adapter — `new PrismaClient()` alone is invalid
- Use `@prisma/adapter-libsql` + `PrismaLibSql({ url })` for SQLite
- Generated client entry point is `client.ts` not `index.ts` — import from `@/app/generated/prisma/client`
- `prisma.config.ts` handles datasource URL (reads from `process.env.DATABASE_URL`)
- `DATABASE_URL="file:./prisma/dev.db"` — db lives in `prisma/dev.db`
- After fresh npm install, must run `npx prisma generate` to regenerate the client
