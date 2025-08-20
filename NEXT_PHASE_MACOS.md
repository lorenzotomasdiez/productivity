## Next Phase: macOS App (Jarvis for macOS)

Goal: Ship a functional macOS SwiftUI app connected to the API with offline-capable Core Data, focusing on Dashboard, Life Areas, Goals, and Progress. Optimize for daily desktop use.

### Current Status Review (as of current session)

#### ✅ What's Already Built:
- **Basic SwiftUI App Structure** - Main app with NavigationSplitView
- **UI Components** - Dashboard, Life Areas, Goals, Progress, Chat views (all placeholder/mock data)
- **Testing Framework** - Using the new `Testing` framework (not XCTest) with basic UI component tests
- **Core Data Setup** - Basic persistence controller with generic `Item` entity
- **Project Structure** - Proper Xcode project with test targets

#### ❌ What's Missing (The Good Shit):
- **Real Data Models** - Only generic `Item` with timestamp, no proper entities
- **API Integration** - No networking layer, no authentication
- **Core Data Models** - No `LifeArea`, `Goal`, `ProgressEntry` entities
- **Business Logic** - No view models, no real data flow
- **Authentication** - No Apple Sign In, no token management
- **Sync Manager** - No offline-first capabilities
- **Proper TDD Structure** - Tests are basic UI tests, no business logic coverage

#### 🔧 Current Architecture Issues:
- Using `Testing` framework instead of standard XCTest (might cause issues)
- `Persistence.swift` has placeholder `Item` entity instead of proper models
- All views are static with hardcoded data
- No proper MVVM structure or dependency injection

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

### TDD Implementation Plan

#### Phase 1: Foundation & Core Data (Week 1)
1. **Fix Testing Framework** - Convert to standard XCTest for better Xcode integration
2. **Core Data Models** - Create proper entities: `LifeArea`, `Goal`, `ProgressEntry`
3. **Model Tests** - Test entity creation, validation, relationships
4. **Persistence Tests** - Test CRUD operations, error handling

#### Phase 2: Business Logic & View Models (Week 1-2)
5. **View Models** - Create ObservableObject classes for each feature
6. **Business Logic Tests** - Test goal creation, progress tracking, life area management
7. **Data Validation** - Test input validation, business rules

#### Phase 3: API Integration (Week 2)
8. **API Client** - Create networking layer with async/await
9. **Authentication** - Implement Apple Sign In + token management
10. **API Tests** - Test endpoints, error handling, token refresh

#### Phase 4: Sync & Offline (Week 3)
11. **Sync Manager** - Implement offline-first with API sync
12. **Conflict Resolution** - Test sync conflicts and resolution
13. **Performance Tests** - Test sync performance, memory usage

#### Phase 5: UI Integration & Polish (Week 4)
14. **UI Tests** - Test complete user flows
15. **Error Handling** - Test error states, retry mechanisms
16. **Performance & Accessibility** - Test app performance, VoiceOver support

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

### Next Immediate Steps
1. **Fix the testing framework** - Convert to XCTest
2. **Start with Core Data models** - Create proper entities
3. **Write tests first** - Follow TDD red-green-refactor cycle
4. **Build incrementally** - One feature at a time with full test coverage

### TDD Workflow
- **Red**: Write failing test first
- **Green**: Implement minimal code to make test pass
- **Refactor**: Clean up code while keeping tests green
- **Repeat**: Move to next feature/requirement

### Current App Status
The current app is basically a beautiful shell with no guts. We need to build the fucking engine that makes this productivity app actually useful!


