# Design Document: PAP Newsroom Wire System React Frontend

**Date:** 2026-09-22  
**Status:** Approved  
**Author:** Pair Programming Session  

---

## 1. Overview & Objectives

Build a decoupled, modern React Single Page Application (SPA) located in `frontend/` that interfaces with the high-throughput headless Drupal 10 backend for the **PAP Newsroom Wire System**.

The application serves two distinct news agency functions within a unified high-density workspace:
1. **Live Wire Feed & Reading Pane**: Real-time ticker/stream of incoming Polish agency dispatches with urgency categorization (`FLASH`, `URGENT`, `ROUTINE`), filter chips, search, and reading pane.
2. **Rapid Dispatch Publishing Dock**: Quick news flash and wire dispatch authoring interface with keyboard shortcuts (`Ctrl+Enter`), optimistic UI updates, and instant validation.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (frontend/)                    │
│  - Vite + React 19 + TypeScript + Tailwind CSS               │
│  - TanStack Query (Background Polling & Optimistic Updates)  │
│  - Lucide Icons + Agency Terminal Dark/Light Theme          │
└──────────────────────────▲──────────────────────────────────┘
                           │
             REST API Calls (/api/v1/wire/*)
             Auth: X-Newsroom-Api-Key
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                 Drupal 10 Headless Backend                  │
│  - GET  /api/v1/wire/latest (Varnish Cached Edge Hit)        │
│  - GET  /api/v1/wire/{id}   (Single Dispatch)                │
│  - POST /api/v1/wire/create (New: Editorial Publish Endpoint)│
│  - Audit Log Chaining & Syndication Queue Triggered         │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Backend Extension (`web/modules/custom/newsroom_api`)
- **Route**: `POST /api/v1/wire/create`
- **Controller**: `WireApiController::create(Request $request)`
- **Authentication**: Validates request header `X-Newsroom-Api-Key` or `Authorization: Bearer <key>`. Defaults to `secret-pap-editorial-key` for local development.
- **Payload Schema**:
  - `title` (string, required)
  - `lead` (string, optional)
  - `body` (string, optional)
  - `urgency_level` (enum: `FLASH`, `URGENT`, `ROUTINE`, default `ROUTINE`)
  - `category` (string or integer ID, references `wire_category` taxonomy)
  - `author_signature` (string, optional, e.g. `(PAP) mkr/ agz`)
  - `embargo_until` (ISO 8601 string, optional)
- **Lifecycle**:
  - Creates node of bundle `wire_dispatch`.
  - Sets moderation state to `published`.
  - Invokes cryptographic audit logger (`newsroom_security`) and syndication dispatcher (`newsroom_syndication`).
  - Invalidates cache tag `node_list:wire_dispatch` so Varnish and Redis edge caches immediately serve the new dispatch.
  - Returns normalized dispatch representation with HTTP 201.
- **CORS Support**: Implements an event subscriber or headers to allow `http://localhost:5173` origins with `Content-Type` and `X-Newsroom-Api-Key`.

### 2.2 Frontend SPA (`frontend/`)
- **Scaffold**: Vite + React 19 + TypeScript + Tailwind CSS.
- **Dev Server Proxy**: Vite proxies `/api` to DDEV web server (port 32779 or Traefik router).
- **State Management & Data Layer**:
  - TanStack Query (`@tanstack/react-query`) with 5-second polling interval for `GET /api/v1/wire/latest`.
  - Mutation with optimistic updates for `POST /api/v1/wire/create`.
- **Keyboard Shortcuts**:
  - `N` or `Ctrl+K`: Open dispatch composer.
  - `Ctrl+Enter`: Publish dispatch immediately.
  - `Escape`: Close modal or clear selection.
  - `J` / `K`: Move down / up the wire dispatch stream.

---

## 3. UI/UX Specifications

### 3.1 Color & Visual Hierarchy
- **Terminal Theme**: Slate/Zinc high-contrast dark theme with clean borders and subtle gradients.
- **Urgency Signals**:
  - `FLASH`: High-visibility Crimson Red badge (`#EF4444`) with flashing beacon animation and prominent card border.
  - `URGENT`: Amber/Orange badge (`#F59E0B`).
  - `ROUTINE`: Slate/Cyan subtle badge (`#64748B`).
- **Live Status Heartbeat**: Pulsing emerald green dot indicating live connection to the PAP wire API, with toggle to pause/resume auto-polling.

### 3.2 Layout Structure
- **Header**: PAP Newsroom logo/wordmark, active ticker stats, live pulse toggle, and "+ New Dispatch" action button.
- **Filter & Search Bar**: Search input with instant client-side filtering, urgency pill toggles (`ALL`, `FLASH`, `URGENT`, `ROUTINE`), category dropdown.
- **Main Workspace (Split View)**:
  - **Left Pane (40-45%)**: Chronological wire list. Each card displays urgency badge, category, publication timestamp ("3m ago"), headline, and lead snippet.
  - **Right Pane (55-60%)**: Full dispatch reading inspector. Displays full metadata, author signature, full body text, and cryptographic audit hash badge.
- **Publish Modal / Drawer**:
  - Minimalist, high-speed input form.
  - Urgency radio selector with keyboard shortcuts.
  - Live preview tab.
  - Sticky dispatch button with `Ctrl+Enter` badge.
