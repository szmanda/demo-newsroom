# PAP Newsroom Wire React Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a high-performance, modern React Single Page Application (SPA) in `frontend/` for the PAP Newsroom Wire System that provides real-time agency wire reading and rapid dispatch publishing, integrated with Drupal 10.

**Architecture:** A decoupled Vite + React 19 + TypeScript + Tailwind CSS application using TanStack Query for background live feed polling and optimistic mutations. Backed by a new secure `POST /api/v1/wire/create` endpoint and CORS support in Drupal's `newsroom_api` module.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query v5, Lucide React, Drupal 10, PHP 8.3, Varnish 6.0.

---

### Task 1: Backend Endpoint & CORS Support in `newsroom_api`

**Files:**
- Modify: `web/modules/custom/newsroom_api/newsroom_api.routing.yml`
- Modify: `web/modules/custom/newsroom_api/src/Controller/WireApiController.php`
- Modify: `web/modules/custom/newsroom_api/src/EventSubscriber/WireApiResponseSubscriber.php`

**Step 1: Update routing in `newsroom_api.routing.yml`**
Add `newsroom_api.create` for `POST /api/v1/wire/create`.

**Step 2: Implement `create` action in `WireApiController.php`**
Validate `X-Newsroom-Api-Key` or `Authorization: Bearer <key>`. Validate required fields (`title`). Create node of type `wire_dispatch`, set moderation state to `published`, populate `field_urgency_level`, `field_category`, `field_lead`, `body`, `field_author_signature`, `field_embargo_until`. Save node and invalidate `node_list:wire_dispatch` cache tag. Return normalized wire dispatch with HTTP 201.

**Step 3: Add CORS support in `WireApiResponseSubscriber.php`**
Ensure preflight `OPTIONS` and standard responses include `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers` (`Content-Type, X-Newsroom-Api-Key, Authorization`), and `Access-Control-Allow-Methods` (`GET, POST, OPTIONS`).

**Step 4: Verify backend endpoint**
Run curl request against local DDEV backend to publish a test dispatch and verify HTTP 201 response.

**Step 5: Commit**
```bash
git add web/modules/custom/newsroom_api/
git commit -m "feat(api): add wire dispatch creation endpoint and CORS support"
```

---

### Task 2: Frontend Scaffolding & Configuration

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`
- Create: `frontend/src/types/wire.ts`

**Step 1: Initialize Vite React TypeScript project in `frontend/`**
Install React, React DOM, Vite, TypeScript, Tailwind CSS, `@tanstack/react-query`, `lucide-react`, `clsx`, `tailwind-merge`.

**Step 2: Configure `vite.config.ts`**
Configure Vite proxy for `/api` pointing to `http://127.0.0.1:32779` (or `http://demo-newsroom.ddev.site`).

**Step 3: Define TypeScript types in `frontend/src/types/wire.ts`**
Create interfaces for `WireDispatch`, `WireCategory`, `WireListResponse`, `CreateWirePayload`, `ProblemDetails`.

**Step 4: Verify build setup**
Run `npm run build` in `frontend/` to confirm zero compilation errors.

**Step 5: Commit**
```bash
git add frontend/
git commit -m "feat(frontend): scaffold React Vite project with Tailwind and types"
```

---

### Task 3: API Client & Query Hooks

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/wire.ts`
- Create: `frontend/src/hooks/useWireDispatches.ts`
- Create: `frontend/src/hooks/usePublishDispatch.ts`

**Step 1: Implement `client.ts`**
Configure reusable fetch wrapper with base URL, standard JSON headers, error unwrapping for RFC 7807 problem details, and `X-Newsroom-Api-Key` authentication header.

**Step 2: Implement `wire.ts`**
Export functions:
- `fetchLatestDispatches(params)`
- `fetchDispatchById(id)`
- `createDispatch(payload)`

**Step 3: Implement `useWireDispatches` and `usePublishDispatch` hooks**
- `useWireDispatches`: Wraps `useQuery` with 5s background polling interval, toggleable `enabled` state.
- `usePublishDispatch`: Wraps `useMutation` with optimistic update inserting the new dispatch at top of feed cache immediately.

**Step 4: Commit**
```bash
git add frontend/src/api/ frontend/src/hooks/
git commit -m "feat(frontend): implement API client and TanStack Query hooks"
```

---

### Task 4: UI Components - Header, Status, Filter Bar

**Files:**
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/FilterBar.tsx`
- Create: `frontend/src/components/FlashAlertTicker.tsx`

**Step 1: Implement `Header.tsx`**
Agency terminal header with PAP Newsroom logo, live connection pulsing heartbeat badge, auto-refresh toggle, keyboard shortcuts indicator (`?` or quick hotkeys badge), and prominent "+ Nowa depesza (N)" button.

**Step 2: Implement `FilterBar.tsx`**
Search input with instant headline/lead search, urgency toggle pills (`WSZYSTKIE`, `FLASH`, `PILNE / URGENT`, `ROUTYNA`), and category selector dropdown.

**Step 3: Implement `FlashAlertTicker.tsx`**
High-priority breaking news ticker banner across the top showing the latest `FLASH` dispatch with timestamp.

**Step 4: Commit**
```bash
git add frontend/src/components/
git commit -m "feat(frontend): add Header, FilterBar, and FlashAlertTicker components"
```

---

### Task 5: UI Components - Wire Feed & Reading Inspector

**Files:**
- Create: `frontend/src/components/WireCard.tsx`
- Create: `frontend/src/components/WireFeed.tsx`
- Create: `frontend/src/components/DispatchDetail.tsx`

**Step 1: Implement `WireCard.tsx`**
Compact, high-density wire item showing:
- Urgency badge (`FLASH` in pulsating red, `URGENT` in amber, `ROUTINE` in slate)
- Category badge (e.g. *Polityka*, *Gospodarka*, *Świat*)
- Relative timestamp ("przed chwilą", "4 min temu")
- Headline & lead summary
- Author signature pill (e.g. `(PAP) mkr/ agz`)
- Selection indicator state

**Step 2: Implement `WireFeed.tsx`**
Scrollable list of cards with smooth keyboard navigation support (`J`/`K`), count indicator, loading skeletons, and empty state.

**Step 3: Implement `DispatchDetail.tsx`**
Split-screen reading pane showing:
- Large headline and metadata badges
- Embargo warning banner if embargoed
- Formatted lead and full body text
- Cryptographic audit status verification badge
- Quick actions: Copy text to clipboard, Print/Export, permalink

**Step 4: Commit**
```bash
git add frontend/src/components/
git commit -m "feat(frontend): add WireCard, WireFeed, and DispatchDetail inspector"
```

---

### Task 6: Rapid Dispatch Publishing Dock & Modal

**Files:**
- Create: `frontend/src/components/PublishModal.tsx`
- Create: `frontend/src/hooks/useKeyboardShortcuts.ts`
- Modify: `frontend/src/App.tsx`

**Step 1: Implement `PublishModal.tsx`**
High-speed news agency composer:
- Urgency selector (`FLASH`, `URGENT`, `ROUTINE`) with color indicators
- Category select (`Polityka`, `Gospodarka`, `Świat`, `Sport`, `Bezpieczeństwo`)
- Headline input with character counter
- Lead summary input
- Body textarea
- Author signature input (defaulting to saved journalist signature)
- Live preview preview tab
- Submit button with `Ctrl + Enter` badge
- Error alert handling RFC 7807 problem details

**Step 2: Implement `useKeyboardShortcuts.ts`**
Global shortcuts listener for:
- `N` or `Ctrl+K`: Open dispatch composer
- `Escape`: Close composer or unselect dispatch
- `J` / `K` or `ArrowDown` / `ArrowUp`: Next / previous dispatch in feed
- `Space`: Toggle auto-refresh ticker

**Step 3: Connect everything in `App.tsx`**
Assemble Header, FlashAlertTicker, FilterBar, WireFeed, DispatchDetail, and PublishModal.

**Step 4: Commit**
```bash
git add frontend/src/components/PublishModal.tsx frontend/src/hooks/useKeyboardShortcuts.ts frontend/src/App.tsx
git commit -m "feat(frontend): implement rapid publishing modal and keyboard navigation"
```

---

### Task 7: Integration, Testing & Verification

**Files:**
- Verify full build: `npm run build` in `frontend/`
- Test API integration: End-to-end dispatch creation and real-time feed updates
- Update `README.md` with instructions on running the React frontend

**Step 1: Run frontend production build**
Ensure TypeScript compiler and Vite bundle with zero errors or warnings.

**Step 2: Verify live dispatch publishing**
Publish a dispatch with urgency `FLASH` via the React frontend UI and verify:
1. Optimistic entry appears in the feed immediately.
2. Server confirms HTTP 201 and stores the node.
3. Cryptographic audit log and syndication events are triggered.
4. Detail pane renders the dispatch with audit verification badge.

**Step 3: Update `README.md`**
Document how to run the frontend (`cd frontend && npm install && npm run dev`) alongside DDEV.

**Step 4: Commit**
```bash
git add README.md
git commit -m "docs: add frontend instructions to README"
```
