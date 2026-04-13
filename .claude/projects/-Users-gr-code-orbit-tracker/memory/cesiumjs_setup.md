---
name: CesiumJS Setup
description: CesiumJS integration with Next.js 16 Turbopack — postinstall copy, CESIUM_BASE_URL, dynamic import with SSR disabled
type: reference
---

- Turbopack is the default in Next.js 16 — webpack plugins don't work
- CesiumJS static assets copied to `public/cesium/` via `scripts/copy-cesium.js` (runs as `postinstall`)
- `CESIUM_BASE_URL` set to `/cesium/` on `window` before dynamic import in `Globe.tsx`
- `next/dynamic` with `ssr: false` used for Globe and all components that import cesium/satellite.js
- Scene properties (skyBox, sun, moon, fog) may be undefined — use optional chaining
- Viewer destroyed on unmount via cleanup function
