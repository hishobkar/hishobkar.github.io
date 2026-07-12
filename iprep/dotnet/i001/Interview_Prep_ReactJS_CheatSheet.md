# ReactJS Cheat Sheet — Quick-Recall Edition
*Condensed from `Interview_Prep_ReactJS.md`. Mnemonics in 🧠, gotchas in ⚠️. .NET-parallel callouts in 🔗.*

---

## 1. Fundamentals

| Concept | Key point |
|---|---|
| React's core idea | `UI = f(state)` — describe *what* you want, React figures out the efficient DOM update. 🔗 Like EF Core vs raw ADO.NET. |
| JSX | Compiles to `React.createElement()` calls. Use `className` not `class`. One root element (or Fragment `<>`). |
| Function vs class components | Function + Hooks = modern standard. Still must be able to *read* class components (legacy code, Error Boundaries still require them). |
| Props vs state | Props = read-only, passed in (🔗 like constructor params). State = owned internally, changing it re-renders (🔗 like a private field). Child can't mutate parent state directly — parent passes a callback down. |
| Virtual DOM / reconciliation | New vDOM tree diffed against old → minimal real DOM mutations applied. 🔗 Like EF Core's change tracking (diffs against snapshot, only sends what changed). |
| ⚠️ Keys | Stable, unique key (not array index) lets React match elements across renders. Index-as-key breaks on reorder/insert/delete — causes state/DOM mismatch (e.g. input value "stuck" on wrong row). |
| Controlled vs uncontrolled inputs | Controlled = React state is source of truth (`value` + `onChange`). Uncontrolled = DOM holds the value, read via `ref`. File inputs *must* be uncontrolled. |
| ⚠️ Falsy rendering trap | `{count && <Badge/>}` renders a literal `0` if count is 0 (falsy but still rendered as text). Fix: `{count > 0 && ...}`. |
| SyntheticEvent | Cross-browser wrapper + internal event delegation/batching. Pass the function reference (`onClick={handleClick}`), never call it (`onClick={handleClick()}`). |
| StrictMode | Dev-only; double-invokes renders/effects to surface impure side effects. Zero effect in production. |

---

## 2. Hooks

| Hook | Purpose | Gotcha |
|---|---|---|
| `useState` | Local state + setter, triggers re-render | 🧠 **Stale closure**: multiple `setCount(count+1)` calls in one handler only apply once — fix with functional form `setCount(c => c+1)` |
| `useEffect` | Side effects after render commits | Dep array: `[]` once, `[x]` on x change, omitted = every render. Return cleanup fn (🔗 = `IDisposable.Dispose()`). ⚠️ Missing dependency = stale closure bug (`exhaustive-deps` lint catches it). ⚠️ Fetch without `AbortController` → race condition on unmount/rapid changes. |
| `useRef` | Mutable value across renders, **no re-render** on change | DOM node access, or any value that shouldn't trigger UI updates. 🔗 Plain private field vs `useState`'s observable property. |
| `useContext` | Avoid prop drilling — read a Provider's value from any depth | 🔗 Closer to `AsyncLocal<T>`/ambient value than a full DI container — no constructor injection, no lifetime mgmt, every consumer re-renders on value change. |
| `useMemo` vs `useCallback` | Memoize a **value** vs memoize a **function reference** | `useCallback(fn,deps)` ≡ `useMemo(()=>fn,deps)` under the hood. ⚠️ Don't reach for these by default — only for measured expensive computation or actual unnecessary re-render. |
| Custom hooks | Extract/reuse stateful logic as a plain function starting with `use` | Each call site gets independent state — not a singleton. |

**🧠 Rules of Hooks:** (1) top level only, never in loops/conditions. (2) only from function components/other hooks. Why: React matches hooks to slots **by call order**, not name — a skipped hook shifts every subsequent slot.

---

## 3. Component Design & State Management

| Concept | Key point |
|---|---|
| Lifting state up | Move shared state to closest common ancestor + pass down via props/callback. Default first move before Context/library. |
| Prop drilling | Passing a prop through components that don't use it just to reach a deep child. Fine for 1-2 levels; fix with Context, composition, or a state library beyond that. |
| Context vs Redux vs Zustand/Jotai | Context: built-in, fine for infrequent changes (theme/auth), but *every* consumer re-renders on value change. Redux(Toolkit): unidirectional flow, great devtools, worth it for large/complex apps. Zustand/Jotai: less boilerplate, selective re-rendering, pragmatic default today. 🔗 Same decision category as static/singleton vs scoped service in .NET. |
| Composition over inheritance | React has no supported component inheritance — pass JSX as `children` instead. |
| 🧠 HOC → Render Props → Hooks | Evolution of logic reuse. HOC = wraps component (`withAuth(Dashboard)`). Render props = function-as-prop. Hooks = modern replacement for both, avoids "wrapper hell." |
| `React.memo` | Skips re-render if props are shallowly equal. ⚠️ New object/array/function reference each render defeats it — pair with `useCallback`/`useMemo` in parent. Don't memoize cheap components (comparison isn't free). |
| Error Boundary | Catches render errors in child tree, shows fallback UI. 🔗 = global exception handler middleware. Must be a class component (no hook equivalent for `getDerivedStateFromError`/`componentDidCatch`). ⚠️ Doesn't catch errors in event handlers, async code, or in itself. |

---

## 4. Routing & Data Fetching

| Concept | Key point |
|---|---|
| React Router | Client-side URL → component tree, no server round trip. `<Outlet/>` for nested routes 🔗 ≈ `_Layout.cshtml` + `@RenderBody()`. `useParams` 🔗 ≈ `[FromRoute]`. |
| Why React Query/TanStack Query | Hand-rolled `useEffect`+`fetch` re-solves race conditions, no caching, no dedup, manual loading/error plumbing every time. Query key = cache key; handles caching/refetch/dedup/retries out of the box. 🔗 = front-end analog of `IMemoryCache`/`HttpClientFactory`+Polly. |
| Loading/error state UX | Distinguish initial load (spinner) from background refetch (keep stale data + subtle indicator). Distinguish 401 (redirect login) / 404 (not found) / 500 (retry) — don't collapse into one generic error. |
| Optimistic updates | Apply expected result immediately, roll back on failure. ⚠️ Must keep a snapshot to roll back to, and reconcile with server response afterward — otherwise UI can silently lie to the user. |

---

## 5. Performance & Advanced Patterns

| Concept | Key point |
|---|---|
| Diffing algorithm | Heuristic O(n), not O(n³): (1) different element types → whole subtree torn down/rebuilt, no diffing attempted. (2) keys let React match by identity instead of position. |
| Why keys matter for perf | Stable keys turn "reorder = rebuild everything after the change" into "cheap DOM node moves." |
| Causes of unnecessary re-renders | Parent re-render cascades to non-memoized children by default · new object/array/function literal props each render · overly broad Context. **Fix order:** push state down → split Context → `React.memo`+`useCallback`/`useMemo` → pass `children` as JSX (already-created, doesn't re-create on parent re-render). |
| Code-splitting | `React.lazy(() => import(...))` + `<Suspense fallback>` — loads a chunk only when rendered. Route-based splitting = highest value. |
| List virtualization | Render only visible rows (+buffer), recycle DOM nodes on scroll (`react-window`/TanStack Virtual). 🔗 = server-side paging instead of loading every row. |
| Profiling | React DevTools **Profiler** tab shows flame graph + *why* each component rendered. Always profile production/profiling build — dev builds skew absolute numbers. |

---

## 6. TypeScript with React

| Concept | Key point |
|---|---|
| Why it fits a .NET background | Same discipline as C#: compile-time type checking, IntelliSense, interfaces as contracts. Catches wrong prop shapes, missing required props, API response shape drift. |
| Typing events | `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>` — ⚠️ forgetting the generic parameter leaves `e.target` typed too loosely. |
| Typing API responses | `res.json()` typed as `Promise<Dto>` is TS **trusting** you, not verifying at runtime. For real end-to-end safety: generate types from OpenAPI/Swagger (`openapi-typescript`, NSwag) or validate at runtime (Zod). |

---

## 7. Testing React Apps

| Concept | Key point |
|---|---|
| React Testing Library philosophy | "Test behavior, not implementation" — query/interact the way a real user would (`getByRole`, `userEvent.click`). Keeps tests passing across harmless refactors. 🔗 = test the public contract, not private methods. |
| Mocking API calls | MSW (Mock Service Worker) intercepts at the network level — component's real fetch code runs unmodified. Preferred over `jest.mock`-ing the fetch function directly. |
| Snapshot test pitfalls | Easy to blindly approve (defeats the purpose), hard to review in a large diff, brittle to unrelated shared-component changes. Prefer small targeted snapshots or explicit assertions. |
| Component vs E2E tests | Component (Jest+RTL): fast, jsdom, isolated — bulk of the suite. E2E (Cypress/Playwright): real browser, full user flows, slower/more brittle — use sparingly for critical journeys. |

---

## 8. Architecture & Full-Stack Integration

| Concept | Key point |
|---|---|
| Project structure | Feature-based/vertical-slice (`features/orders/{components,hooks,api,types}`) scales better than type-based (`components/`,`hooks/`) at scale. 🔗 = vertical slice architecture in a .NET solution. |
| Consuming a .NET API + auth | Axios interceptors attach `Authorization: Bearer` + handle silent 401 refresh-and-retry. 🔗 = `DelegatingHandler` on a typed `HttpClient`. Store access token in memory (not `localStorage` — XSS-readable); refresh token in `HttpOnly` cookie. |
| CORS on .NET side | `UseCors` after `UseRouting`, before `UseAuthorization`. ⚠️ `AllowCredentials()` can't combine with `AllowAnyOrigin()`. |
| Server state sync | Treat server data as a query cache (React Query/SWR), not ad hoc `useState` copies. SignalR JS client can invalidate/update the cache on a pushed event. |
| SSR/Next.js — when to reach for it | SEO matters, fast first paint matters, or data-fetching should happen near the data source. Behind-a-login-wall internal LOB apps (common in enterprise .NET) often don't need it — plain SPA is simpler and sufficient. |
| Vite vs CRA vs Next.js | CRA = deprecated, legacy only. Vite = current default for a plain SPA (fast HMR). Next.js = when SSR/SSG/RSC/file routing genuinely needed. |
| Env config | Vite `.env.*` vars are baked in at **build time** (unlike `appsettings.{Env}.json` read at runtime) — need a build per environment, or a runtime-config JSON for build-once-deploy-many. Never put secrets in front-end env vars. |
| Deployment: `wwwroot` vs separate static host | Combined (`wwwroot`): simpler ops, same-origin (no CORS), but couples release cadence. Separate host (Static Web Apps/CDN): independent deploy+scale, CDN edge speed, but needs CORS + two pipelines. Most modern teams prefer separate. |

---

## 9. Modern React & Ecosystem Awareness

| Feature (React 18/19) | What it does |
|---|---|
| Automatic batching | Multiple state updates outside event handlers (Promise/setTimeout callbacks) now batch into one re-render, not several. |
| Concurrent rendering | React can pause/resume/abandon a render without blocking the main thread — underlies `useTransition`/`useDeferredValue`. |
| Suspense for data fetching | Same `<Suspense>` mechanism as code-splitting, extended to data — component "suspends" while loading. |
| React Server Components (RSC) | Render entirely server-side, ship zero JS for that component, direct server-resource access — a Next.js App Router concept, not plain Vite SPA. |
| `use` hook (React 19) | Reads a Promise or Context conditionally (unlike other hooks) — pairs with Suspense/RSC. |

**React vs Angular vs Vue:** React = focused rendering library, ecosystem choice per concern, biggest hiring pool. Angular = full opinionated framework (routing/DI/HTTP/forms bundled). Vue = middle ground, more batteries-included than React, gentler API, automatic reactivity (less manual `useMemo`/`useCallback` tuning).

---

## 10. Night-Before Priority Order
1. `useState`/`useEffect` pitfalls (stale closure, missing dependency, cleanup/`AbortController`).
2. Keys and reconciliation — why they matter, what breaks with index-as-key.
3. State management decision tree (lifting state → Context → Redux/Zustand) + justify the call.
4. .NET integration story: JWT+refresh flow, CORS config, why not `localStorage` for tokens.
5. `React.memo`/`useMemo`/`useCallback` — what each memoizes + "profile first" discipline.
6. One crisp React-vs-Angular paragraph ready to say out loud.
7. Rehearse the performance-optimization and auth-end-to-end behavioral stories.
