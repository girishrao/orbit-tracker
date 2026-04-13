---
name: Next.js 16 Notes
description: Next.js 16.1.6 specific patterns — Turbopack default, App Router, async params in route handlers
type: reference
---

- Next.js 16.1.6 with Turbopack (default bundler)
- App Router with `"use client"` components
- Route handler params are `Promise` — must `await params` (e.g., `{ params }: { params: Promise<{ id: string }> }`)
- Dynamic imports with `ssr: false` required for browser-only libs (CesiumJS, satellite.js)
