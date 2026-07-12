# ReactJS Flashcards
*Cover the answer, say it out loud, then check. Condensed from `Interview_Prep_ReactJS.md`.*

---

## 1. Fundamentals

**Q: What is React's core mental model, in one line?**
A: UI is a function of state — describe what you want, React computes the minimal DOM update.

**Q: What does JSX actually compile to?**
A: Plain `React.createElement()` calls.

**Q: Can a child component change its parent's state directly?**
A: No — the parent passes a callback down as a prop; the child calls it (React's version of an event/delegate).

**Q: What is reconciliation?**
A: React builds a new virtual DOM tree, diffs it against the previous one, and applies only the minimal real DOM mutations needed.

**Q: Why is using the array index as a list `key` risky?**
A: It breaks matching when the list is reordered/filtered/has items inserted or removed — can cause stale state or the wrong DOM node associated with the wrong data.

**Q: Controlled vs uncontrolled input — what's the difference?**
A: Controlled: React state drives the value via `onChange`. Uncontrolled: the DOM holds the value, read via `ref` on demand.

**Q: What does `{count && <Badge/>}` render when `count` is 0, and why?**
A: A literal "0" — because 0 is falsy but still gets rendered as text (unlike `false`/`null`/`undefined`).

**Q: What's wrong with `onClick={handleClick()}`?**
A: It calls the function immediately during render instead of passing the reference — should be `onClick={handleClick}`.

---

## 2. Hooks

**Q: Why does calling `setCount(count+1)` three times in a row only increment by 1?**
A: Each call closes over the same stale `count` value from that render — fix with the functional updater form `setCount(c => c+1)`.

**Q: What does the `useEffect` dependency array control?**
A: When the effect re-runs: `[]` = once after first render, `[x]` = after first render and whenever x changes, omitted = every render.

**Q: What's the React hook equivalent of `IDisposable.Dispose()`?**
A: The cleanup function returned from `useEffect`.

**Q: What bug does an `AbortController` in a data-fetching `useEffect` prevent?**
A: An older, slower request resolving after a newer one and overwriting fresher state (race condition on unmount or rapid re-fetch).

**Q: How is `useRef` different from `useState`?**
A: `useRef` persists a mutable value across renders without triggering a re-render when it changes; `useState` always triggers a re-render.

**Q: `useMemo` vs `useCallback` — what does each memoize?**
A: `useMemo` memoizes a computed return value. `useCallback` memoizes the function reference itself.

**Q: Should you reach for `useMemo`/`useCallback` by default?**
A: No — they have their own comparison overhead; use only for a measured expensive computation or an actual unnecessary re-render.

**Q: State the Rules of Hooks and why they exist.**
A: Only call hooks at the top level (never in loops/conditions), and only from function components/other hooks — because React matches hooks to internal state slots by call order, and a skipped hook shifts every subsequent slot.

---

## 3. Component Design & State

**Q: What is "lifting state up"?**
A: Moving shared state to the closest common ancestor of the components that need it, passed down via props/callbacks.

**Q: When is Context a poor fit for shared state?**
A: For frequently-changing, high-fan-out state — every consumer of a context re-renders when its value changes.

**Q: HOC vs render props vs hooks — what replaced the first two, and why?**
A: Hooks — they extract reusable logic without wrapping the component tree, avoiding "wrapper hell" and prop name collisions.

**Q: What does `React.memo` actually check, and what defeats it?**
A: Shallow equality of props between renders; a new object/array/function reference each render (even with identical contents) defeats it.

**Q: Why must an Error Boundary be a class component?**
A: The required lifecycle methods (`getDerivedStateFromError`, `componentDidCatch`) have no hook/function-component equivalent yet.

**Q: What does an Error Boundary NOT catch?**
A: Errors in event handlers, async code, or errors thrown within the boundary itself — only render-time errors in its children.

---

## 4. Routing & Data Fetching

**Q: What problems does React Query solve that hand-rolled `useEffect`+`fetch` doesn't?**
A: Race conditions, no caching, no request de-duplication, and repetitive manual loading/error state plumbing.

**Q: What must you keep to safely implement an optimistic update?**
A: A snapshot of the previous state to roll back to if the mutation fails, plus reconciliation with the server's real response afterward.

**Q: Should a full-page spinner show during every background refetch?**
A: No — distinguish initial load (spinner) from background refetch (keep stale data, subtle refreshing indicator).

---

## 5. Performance

**Q: Why is React's diffing algorithm O(n) instead of the theoretically correct O(n³)?**
A: Two heuristics: different element types are assumed to produce entirely different trees (no diffing attempted), and keys let React match elements by identity instead of position.

**Q: List the four fixes for unnecessary re-renders, in the order you'd try them.**
A: Push state down → split Context into smaller pieces → `React.memo` + `useCallback`/`useMemo` for genuinely expensive children → pass `children` as JSX instead of recreating content.

**Q: What do `React.lazy` + `Suspense` do together?**
A: `React.lazy` wraps a dynamic import so a component's code loads only when rendered; `Suspense` shows a fallback while that chunk loads.

**Q: When should you virtualize a list?**
A: When rendering thousands of DOM nodes at once — render only the visible rows (+buffer) and recycle nodes on scroll.

**Q: What does the React DevTools Profiler show beyond render time?**
A: *Why* each component rendered (props changed, state changed, parent re-rendered, hook changed).

---

## 6. TypeScript with React

**Q: What's the risk of typing `res.json()` as `Promise<OrderDto>`?**
A: TypeScript trusts the shape at compile time but doesn't verify it at runtime — an API field rename won't be caught until a runtime mismatch surfaces.

**Q: What's the trap when typing a change event handler?**
A: Forgetting the generic parameter (`React.ChangeEvent<HTMLInputElement>`) leaves `e.target` typed too loosely, missing `.value`.

---

## 7. Testing

**Q: What's the core philosophy of React Testing Library?**
A: Test behavior, not implementation — query and interact with the DOM the way a real user would, so tests survive harmless refactors.

**Q: Why is MSW generally preferred over mocking the fetch function directly?**
A: The component's actual fetch/axios code runs unmodified — you're testing closer to the real integration, just with a fake network layer.

**Q: What's the main pitfall of snapshot tests?**
A: They're easy to blindly approve without review, defeating the point of the assertion entirely.

---

## 8. Architecture & Full-Stack Integration

**Q: Feature-based vs type-based folder structure — which scales better and why?**
A: Feature-based (vertical slice) — everything related to one feature lives together, easier to reason about and delete cleanly as the app grows.

**Q: Where should you store the access token vs the refresh token, and why?**
A: Access token in memory (not `localStorage`, which is XSS-readable). Refresh token in an `HttpOnly` cookie (client-side JS can't read it at all).

**Q: Where must `UseCors` sit in the ASP.NET Core middleware pipeline?**
A: After `UseRouting`, before `UseAuthorization`.

**Q: When would you actually reach for Next.js/SSR instead of a plain SPA?**
A: When SEO matters, fast first paint matters more than post-load interactivity speed, or data-fetching should happen close to the data source — not needed for most behind-login enterprise apps.

**Q: Vite vs CRA vs Next.js — the one-line rule?**
A: Vite for a plain SPA against a .NET API, Next.js when SSR/SSG/RSC is genuinely needed, CRA only if inherited.

---

## 9. Modern React

**Q: What changed about batching in React 18?**
A: State updates outside event handlers (inside Promises, setTimeout, native handlers) now batch into a single re-render too, not just updates inside React event handlers.

**Q: What are React Server Components, conceptually?**
A: Components that render entirely on the server, ship zero JS to the client, and can access server-only resources directly without an API layer — a Next.js App Router concept.

**Q: One-line contrast: React vs Angular vs Vue?**
A: React = focused rendering library with ecosystem choice per concern. Angular = full opinionated framework bundling routing/DI/forms. Vue = middle ground, more batteries-included than React, automatic reactivity needing less manual optimization.
