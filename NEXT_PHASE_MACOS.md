## Next Phase: macOS App (Jarvis for macOS)

Goal: Ship a functional macOS SwiftUI app connected to the API with offline-capable Core Data, focusing on Dashboard, Life Areas, Goals, and Progress. Optimize for daily desktop use.

### Scope (MVP for macOS)
- Authentication
  - Apple Sign In UI → obtain identity token
  - Exchange with backend `POST /api/v1/auth/apple-signin` → store access/refresh
  - Token refresh flow and keychain storage

- Data foundation
  - Networking layer (`JarvisAPI`) with typed models and async/await
  - Authenticated requests via Bearer token, auto-refresh on 401
  - Core Data models mirroring `LifeArea`, `Goal`, `ProgressEntry`
  - Sync manager: pull on app launch/foreground; delta updates by `updated_at`

- Features
  - Dashboard: overview of counts and recent activity (can use `user_dashboard` view or compose client side)
  - Life Areas: list, create, edit, delete
  - Goals: list with filters; create; view details
  - Progress: list for a goal; create entry

- UX
  - SwiftUI NavigationSplitView layout
  - Keyboard-first interactions
  - Pleasant empty states and loading/error banners

### Architecture
- Modules
  - `JarvisCore` (models, mappers, validation, date utils)
  - `JarvisAPI` (endpoints, DTOs, token storage, refresh)
  - `JarvisUI` (shared views/components)
  - macOS app target (feature screens + Core Data stack)

- State management
  - MVVM with ObservableObject view models
  - Background tasks for sync using `Task` and `@MainActor` updates

### Implementation Steps
1) Project setup
   - Wire SPM packages `JarvisCore`, `JarvisAPI`, `JarvisUI` into macOS app
   - Create `AppSecrets.plist` (env base URL) with debug/release configs

2) Auth & token storage
   - Sign in with Apple UI flow
   - API call to backend; store tokens in Keychain
   - Implement refresh on 401 and proactive refresh before expiry

3) Networking & DTOs
   - Define DTOs for `LifeArea`, `Goal`, `ProgressEntry`
   - Endpoints: `/life-areas`, `/goals`, `/goals/:id/progress`, `/progress-entries/:id`
   - Response envelope handling and error mapping

4) Core Data models
   - Entities: `CDLifeArea`, `CDGoal`, `CDProgressEntry`
   - Mappers between DTOs and Core Data
   - Lightweight migrations enabled

5) Sync manager
   - Initial full sync per entity, then incremental by `updated_at`
   - Conflict policy: last-write-wins for MVP
   - Background refresh on app foreground and manual pull-to-refresh

6) UI screens
   - Dashboard with counts and recent items
   - Life Areas list + CRUD
   - Goals list + filters + create
   - Goal details with progress list + add progress

7) Error/empty states and telemetry
   - Toasts/banners for network errors
   - Retry actions and offline mode messaging

8) App polish
   - App icon, accent color, theming
   - Keyboard shortcuts for quick add

### Testing (macOS)
- Unit tests: API client, token refresh, mappers
- Integration tests: end-to-end API calls against local dev server
- UI tests: basic navigation and CRUD flows

### Dependencies & Config
- Requires backend critical fixes (see `FIXES_AND_RISKS.md`): auth coverage, refresh flow, OpenAPI parity
- Dev URLs
  - API base: `http://localhost:3000/api/v1`

### Milestones
- Week 1: Auth + API client + Core Data models
- Week 2: Life Areas + Goals list/CRUD + sync
- Week 3: Progress + Dashboard + polish
- Week 4: Testing, stabilization, and beta


