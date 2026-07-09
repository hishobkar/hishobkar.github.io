# Interview Prep — ReactJS (for a .NET Full Stack Developer)

Some of the newer JDs you're targeting explicitly ask for **".NET Full Stack Developer" with a ReactJS front end** rather than Angular/Vue (those are covered in `Interview_Prep_Questions.md` / `Inter_Prep_Answers.md` / `Interview_Prep_Answer1.md`, which map to the older JDs). This file is a standalone, combined Q&A specifically for React — question as a bold sub-heading, answer directly underneath, written to be spoken out loud in an interview.

You have 10 years of backend/full-stack .NET experience, which means interviewers will not spend much time on "what is a component" — but they *will* sometimes open with a fundamentals question just to confirm you're not bluffing about React on your resume, then move quickly into architecture, performance, and integration questions where your seniority is expected to show. This file is structured in progressive tiers for that reason: skim tier 1 to confirm you're solid, then spend real prep time from tier 3 onward, especially the .NET-integration and architecture sections — that's where a senior candidate is actually differentiated. Wherever it helps, answers tie a React concept back to something you already know cold from C#/.NET, both to help it stick and because drawing that parallel out loud in an interview signals cross-stack reasoning, not just "I followed a tutorial."

---

## 1. React Fundamentals (Fresher Level)

**What is React, and what problem does it solve?**
React is a JavaScript library (not a full framework, though the ecosystem around it makes it feel like one) for building user interfaces out of composable, reusable components. Before React, updating the DOM directly (jQuery-style, or manual `document.getElementById`) as application state grew became unmanageable — you had to track by hand which parts of the page needed to change when data changed. React's core idea: describe your UI as a function of state (`UI = f(state)`), and let React figure out the minimal DOM changes needed when that state changes. Conceptually similar to how you don't manually write ADO.NET connection/command code once you adopt EF Core — you describe *what* you want, and the framework figures out the efficient *how*.

**What is JSX?**
JSX is a syntax extension that lets you write HTML-like markup inside JavaScript. It's not valid JS on its own — it's compiled (via Babel or the TypeScript compiler) into plain `React.createElement()` calls.
```jsx
// JSX
const greeting = <h1 className="title">Hello, {userName}</h1>;

// compiles to roughly:
const greeting = React.createElement(
  "h1",
  { className: "title" },
  "Hello, ",
  userName
);
```
Key points interviewers probe: you use `className` instead of `class` (JS reserved word), you can embed any JS expression inside `{}`, and a component must return a single root element (or a Fragment `<>...</>` since React 16 to avoid an unnecessary wrapper `<div>`).

**Function components vs class components — which do you use and why?**
Class components were the only way to have state/lifecycle before React 16.8 (Hooks). Today, function components + Hooks are the standard — less boilerplate, no `this` binding confusion, and logic reuse is much easier via custom hooks than it was via higher-order components/render props with classes.
```jsx
// Class component (legacy style, still seen in older codebases)
class Counter extends React.Component {
  state = { count: 0 };
  increment = () => this.setState({ count: this.state.count + 1 });
  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}

// Function component (modern, what you'd write today)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```
Interview trap: you should still be able to *read* a class component, because plenty of production/legacy React code (and some third-party libraries with error boundaries — see below) still uses them. Don't say "I don't know class components" — say "I write function components with hooks, but I can read and maintain class-based code."

**Props vs state — what's the difference?**
- **Props**: data passed *into* a component from its parent, read-only from the receiving component's perspective — analogous to constructor parameters or method arguments in C#. A component should never mutate its own props.
- **State**: data owned and managed *inside* a component, which can change over time and triggers a re-render when it does — analogous to a private field on a class that changes based on method calls.
```jsx
function Greeting({ name }) {          // name is a prop
  const [clicked, setClicked] = useState(false); // clicked is state
  return (
    <button onClick={() => setClicked(true)}>
      {clicked ? `Hi, ${name}!` : "Click me"}
    </button>
  );
}
```
Follow-up interviewers like to ask: "can a child change a parent's state directly?" — no; the parent passes a callback function down as a prop, and the child calls that callback, which is the React way of achieving what a C# event/delegate does (child "raises an event," parent "handles it").

**What is the virtual DOM, and how does reconciliation work?**
The virtual DOM is a lightweight in-memory JS representation of the actual DOM tree. When state changes, React builds a new virtual DOM tree, **diffs** it against the previous one (the "reconciliation" algorithm), and computes the minimal set of real DOM mutations needed — then applies just those, instead of re-rendering the whole page. This is expensive-operation avoidance, similar in spirit to EF Core's change tracking: EF doesn't re-issue an UPDATE for every column of every tracked entity, it diffs the current values against the original snapshot and only sends what changed.
Two things that make the diff fast rather than a naive O(n³) tree comparison:
1. Elements of different types (e.g. `<div>` → `<span>`) are assumed completely different — React tears down the old subtree and builds a new one, no attempt to diff children.
2. Lists use **keys** (see next question) to match elements across renders instead of comparing by position.

**Why do list items need a `key` prop, and what happens if you use the array index as the key?**
Keys let React match elements in the new render to elements in the old render so it can tell "this is the same item, just moved/updated" vs "this is a new item." Without a stable key, React falls back to matching by index, which breaks badly when the list is reordered, filtered, or has items inserted/removed in the middle — you can get stale state or wrong DOM nodes associated with the wrong data (e.g. a text input's value "sticking" to the wrong row after a delete, because React reused the DOM node for what it thinks is "the same" element at that index).
```jsx
// Bad: index as key — breaks on reorder/insert/delete
{items.map((item, i) => <Row key={i} data={item} />)}

// Good: stable, unique identifier from the data itself
{items.map((item) => <Row key={item.id} data={item} />)}
```
Using the index is *acceptable* only when the list is static and never reordered/filtered (rare in practice) — the safe default is always a stable ID from your data, the same way you wouldn't use row position as a primary key in a database table.

**Controlled vs uncontrolled components (forms)**
- **Controlled**: the form input's value is driven by React state — every keystroke updates state via `onChange`, and the input's `value` is always set from that state. React is the "single source of truth."
- **Uncontrolled**: the DOM itself holds the input's value; you read it out on demand via a `ref` instead of tracking every change in state.
```jsx
// Controlled
function ControlledInput() {
  const [value, setValue] = useState("");
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

// Uncontrolled
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleSubmit = () => alert(inputRef.current.value);
  return <input ref={inputRef} defaultValue="" />;
}
```
Controlled is the React-idiomatic default (easier validation, conditional disabling, formatting as-you-type). Uncontrolled is useful for simple forms, integrating with non-React DOM libraries, or file inputs (`<input type="file">` can't be controlled — the browser owns that value for security reasons).

**Conditional rendering — what are the common patterns?**
```jsx
function Status({ isLoggedIn, error }) {
  if (error) return <ErrorBanner message={error} />;   // early return

  return (
    <div>
      {isLoggedIn && <Dashboard />}                      {/* && short-circuit */}
      {isLoggedIn ? <LogoutButton /> : <LoginButton />}  {/* ternary */}
    </div>
  );
}
```
Interview trap: `{count && <Badge count={count} />}` renders a literal `0` on the page if `count` is `0`, because `0` is falsy but React still renders it as text (unlike `false`/`null`/`undefined`, which render nothing). Fix: `{count > 0 && <Badge .../>}` or explicit ternaries.

**How does event handling differ from plain DOM events?**
React wraps native DOM events in a `SyntheticEvent` — a cross-browser wrapper with a consistent API regardless of the underlying browser engine (historically the bigger reason for this; today it's more about React's internal event delegation and batching). Handlers are passed as props (`onClick={handleClick}`), not as string attributes (`onclick="..."`), and you pass the function reference, not the result of calling it (`onClick={handleClick}` not `onClick={handleClick()}` — that trap catches almost everyone once).
```jsx
function Button() {
  const handleClick = (e) => {
    e.preventDefault();
    console.log("clicked", e.target);
  };
  return <button onClick={handleClick}>Save</button>;
}
```
Under the hood (React 17+), React attaches most event listeners once at the root of the app and dispatches to the right component internally — this is event delegation, conceptually similar to how ASP.NET Core's middleware pipeline handles every request through one entry point rather than binding a separate listener per route.

**What is `React.StrictMode` and why would you enable it?**
A development-only wrapper component that doesn't render anything visible but activates extra checks and warnings: it intentionally double-invokes component render functions, state updater functions, and effect setup/cleanup in development to help surface side effects that aren't pure (e.g. an effect that isn't properly idempotent/cleaned up). It also warns about legacy/deprecated APIs. It has zero effect in production builds — it's purely a development safety net, similar in spirit to running your app with nullable reference types and analyzers turned on in C#: it doesn't change runtime behavior for users, it catches bugs for you before they ship.

---

## 2. Hooks (Fresher → Intermediate)

**What are Hooks, and why were they introduced?**
Hooks are functions (starting with `use`) that let function components "hook into" React features — state, lifecycle-equivalent behavior, context, refs — that were previously only available in class components. Introduced in React 16.8 to solve real problems with classes: logic reuse required awkward patterns (higher-order components, render props) that led to "wrapper hell"; related logic was scattered across different lifecycle methods (`componentDidMount` and `componentDidUpdate` often had duplicated logic for the same concern); and `this` binding was a constant source of bugs. Hooks let you colocate related logic and extract/reuse it as a plain function — a custom hook — with no class ceremony at all.

**`useState` — how does it work, and what's the classic "stale closure" trap?**
```jsx
const [count, setCount] = useState(0);
```
`useState` returns the current value and a setter; calling the setter schedules a re-render with the new value. The trap: state updates inside closures (event handlers, timers, effects) capture the state value *as of that render* — they don't automatically see the latest value if you reference the variable directly across multiple queued updates.
```jsx
// Bug: only increments by 1 total, not 3, because each call
// closes over the same stale `count` from this render.
const handleTripleClick = () => {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
};

// Fix: functional updater form gets the latest state, queued correctly.
const handleTripleClick = () => {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
};
```
This is the single most common React interview "gotcha" question — know it cold, and know the fix is the functional updater form whenever the new state depends on the previous state.

**`useEffect` — what is it for, and what does the dependency array actually mean?**
`useEffect` runs a side effect (data fetching, subscriptions, manually touching the DOM, timers) after React commits the render to the DOM. The dependency array controls *when* it re-runs:
```jsx
useEffect(() => { /* runs after every render */ });
useEffect(() => { /* runs once, after the first render */ }, []);
useEffect(() => { /* runs after first render AND whenever userId changes */ }, [userId]);
```
Return a cleanup function to undo the effect before it re-runs or when the component unmounts — this is the direct equivalent of `IDisposable.Dispose()`, and forgetting it is the direct equivalent of a memory/resource leak.
```jsx
useEffect(() => {
  const id = setInterval(() => setTick(t => t + 1), 1000);
  return () => clearInterval(id);   // cleanup — like Dispose()
}, []);
```
**Common pitfalls interviewers probe:**
- Fetching data in `useEffect` without an `AbortController`/ignore-flag causes a "set state on unmounted component" warning/race condition if the component unmounts (or `userId` changes again) before the fetch resolves — the old response can overwrite newer state.
- Missing a dependency (e.g. using `userId` inside the effect but not listing it) is the classic "stale closure" bug — the effect keeps using the `userId` from whenever it was first created. The `eslint-plugin-react-hooks` `exhaustive-deps` rule catches this; don't silence it without understanding why first.
- Objects/arrays/functions created inline as dependencies (`{ id: 1 }` is a new reference every render) cause the effect to re-run every render even though the "value" looks the same — fix with `useMemo`/`useCallback` or restructuring the dependency to a primitive.

**`useRef` — what is it, and how is it different from state?**
`useRef` returns a mutable object (`{ current: value }`) that persists across renders **without** causing a re-render when it changes — unlike `useState`, which always triggers a re-render. Two main uses: (1) holding a reference to a DOM node (`<input ref={inputRef} />` then `inputRef.current.focus()`), and (2) holding any mutable value you want to persist across renders but that shouldn't trigger UI updates (e.g. a previous value for comparison, an interval ID, a render counter for debugging). Mental model for a .NET dev: `useState` is like an observable property that raises `PropertyChanged`; `useRef` is like a plain private field — it holds a value, but nothing "listens" to it changing.

**`useContext` — what problem does it solve, and how does it compare to DI?**
Context lets you pass data through the component tree without manually threading props through every intermediate level ("prop drilling" — see next section). A `Provider` supplies a value at some point in the tree; any descendant calls `useContext(MyContext)` to read it directly, no matter how deep.
```jsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}
function Toolbar() { return <ThemedButton />; }   // doesn't need theme itself
function ThemedButton() {
  const theme = useContext(ThemeContext);          // reads it directly
  return <button className={theme}>Click</button>;
}
```
Comparison to .NET DI: conceptually similar in that both let a consumer get a dependency without the caller-chain manually passing it through every layer. But Context is really more like a scoped/ambient value (closer to `AsyncLocal<T>` or `HttpContext.Current` in spirit) than a full DI container — there's no automatic constructor injection, no lifetime management, and every consumer re-renders when the Context value changes (unless you split contexts carefully), which is a real performance consideration a DI container doesn't have to think about at all.

**`useMemo` vs `useCallback` — what's the difference, and when do you actually need them?**
Both memoize something across renders so it isn't recreated unnecessarily, but they memoize different things:
- `useMemo(fn, deps)` memoizes the **return value** of `fn` — use for expensive computations.
- `useCallback(fn, deps)` memoizes the **function reference itself** — use when passing a callback to a child wrapped in `React.memo`, or as a stable dependency for another hook's dependency array.
```jsx
const sortedList = useMemo(() => expensiveSort(items), [items]);

const handleSave = useCallback(() => {
  saveOrder(orderId);
}, [orderId]);
```
Interview trap: `useCallback(fn, deps)` is literally `useMemo(() => fn, deps)` under the hood — same mechanism, different ergonomics. Bigger trap: **don't reach for these by default.** They have their own overhead (comparing dependency arrays every render) and premature memoization can make code harder to read for no measurable benefit. Use them when you've identified an actual expensive computation or an actual unnecessary re-render of a memoized child — not reflexively on every value.

**Write a custom hook. What's the point of one?**
A custom hook is just a plain JS function whose name starts with `use` and that calls other hooks inside it — it lets you extract and reuse stateful logic across components, the same way you'd extract a repeated method into a shared service/helper class in C#, except the "state" itself (not just the logic) travels with it per call site.
```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => { if (err.name !== "AbortError") setError(err); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// usage — reads like a service call
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <div>{user.name}</div>;
}
```
Each component calling `useFetch` gets its own independent state — hooks are not singletons the way an injected service typically is; they're re-invoked fresh (with fresh state slots managed by React) per component instance.

**What are the Rules of Hooks, and why do they exist?**
1. Only call hooks at the top level — never inside loops, conditions, or nested functions.
2. Only call hooks from React function components or other custom hooks — not plain JS functions.
Why: React tracks hooks **by call order**, not by name — internally each component instance has an ordered linked list of hook "slots," and React matches `useState` call #1 to slot #1, call #2 to slot #2, and so on, across every render. If a hook call is conditionally skipped, every subsequent hook's slot shifts and state gets attached to the wrong hook, silently corrupting behavior. This is exactly why the ESLint `react-hooks/rules-of-hooks` plugin exists and should never be disabled — it's not a style preference, it's preventing a real class of bugs.

---

## 3. Component Design & State Management (Intermediate)

**What is "lifting state up," and when do you do it?**
When two sibling components need to share/synchronize state, you move that state to their closest common ancestor and pass it down via props (with a callback for children to request changes). It's the default first move before reaching for Context or a state library — don't add global state management until you actually have a sharing problem that prop passing can't cleanly solve.
```jsx
function Parent() {
  const [filter, setFilter] = useState("");
  return (
    <>
      <SearchBox filter={filter} onFilterChange={setFilter} />
      <ResultsList filter={filter} />
    </>
  );
}
```

**What is prop drilling, and how do you avoid it?**
Prop drilling is passing a prop through several intermediate components that don't use it themselves, just to get it to a deeply nested child that does. It's not "wrong" for 1-2 levels, but it becomes a maintenance problem at scale — every intermediate component's signature is polluted with props it doesn't care about, and adding a new piece of shared data means touching every layer in between. Common fixes: **Context** for state that's genuinely global/ambient (theme, auth user, locale), **component composition** (pass children/JSX as props instead of drilling data — see below), or a dedicated **state management library** for complex, frequently-updated shared state. Same underlying judgment call as deciding when a value belongs in a shared/singleton service vs being passed explicitly through a method call chain in a C# app — don't globalize something just because threading it through is mildly annoying.

**Context API vs Redux vs lightweight state libraries (Zustand, Jotai) — how do you choose?**
- **Context + `useState`/`useReducer`**: built into React, no extra dependency, fine for state that changes infrequently (theme, auth session, locale) — because *every* consumer of a context re-renders when its value changes, Context is a poor fit for frequently-changing, high-fan-out state (e.g. real-time form state shared across many components) unless you split contexts carefully or memoize aggressively.
- **Redux (with Redux Toolkit today)**: a single global store, state updates via dispatched actions and pure reducer functions, strict unidirectional data flow, excellent devtools (time-travel debugging, action logs), middleware for async (`redux-thunk`/`redux-saga`). Worth it for large apps with complex, frequently-changing shared state and a team that benefits from an enforced, predictable pattern — overkill for a small app.
- **Zustand / Jotai (modern lightweight alternatives)**: much less boilerplate than classic Redux, hook-based API, no `Provider` wrapping required for Zustand, selective re-rendering out of the box (components only re-render when the specific slice of state they read changes) — increasingly the pragmatic default for new projects that need shared state but not the full Redux ceremony.
Framing for the interview: this is the same category of decision as "when do I use a static/singleton service vs a scoped service vs just passing a parameter" in .NET — the answer is "it depends on the update frequency, fan-out, and how much structure the team needs," not "always use X."

**Composition vs inheritance in React**
React explicitly favors composition over inheritance for reusing behavior between components — there's no supported way to have `class Dog extends Animal` share UI logic the way you would in OOP inheritance. Instead, you compose components together, often passing JSX as `children` (or named props) so a wrapper component doesn't need to know the specifics of what it's wrapping.
```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}
// usage
<Card title="Order Summary">
  <OrderTotals order={order} />
</Card>
```
This is closer in spirit to favoring composition/interfaces over deep class hierarchies in C# (the same instinct behind "prefer composition over inheritance" as a general OOP principle) — React just enforces it as the only real option.

**HOCs vs render props vs hooks — the evolution of logic reuse in React**
- **Higher-Order Component (HOC)**: a function that takes a component and returns a new, enhanced component — `withAuth(Dashboard)`. Reuses logic by wrapping.
  ```jsx
  function withLoading(Component) {
    return function Wrapped({ isLoading, ...props }) {
      if (isLoading) return <Spinner />;
      return <Component {...props} />;
    };
  }
  ```
- **Render props**: a component takes a function as a prop (often literally called `render` or passed as `children`) and calls it with internal state, letting the consumer control rendering.
  ```jsx
  <DataFetcher url="/api/orders">
    {(data) => <OrderList orders={data} />}
  </DataFetcher>
  ```
- **Hooks**: the modern replacement for both in the vast majority of cases — a custom hook extracts the same reusable logic without wrapping the component tree at all, avoiding "wrapper hell" (deeply nested trees of HOCs/render props that are hard to debug in DevTools) and prop name collisions between multiple HOCs.
Know this evolution — it's a favorite senior-level question because it tests whether you understand *why* hooks were a genuine improvement, not just that they exist. HOCs still show up in some libraries/legacy code (e.g. older Redux `connect()`, some routing libraries), so you should recognize the pattern even if you wouldn't write a new one today.

**What is `React.memo`, and when does it actually help?**
`React.memo` wraps a component so React skips re-rendering it if its props are shallowly equal to the previous render's props — a performance optimization, not a correctness feature.
```jsx
const ExpensiveRow = React.memo(function ExpensiveRow({ item }) {
  return <tr>{/* expensive rendering */}</tr>;
});
```
Traps: shallow comparison means a new object/array/function reference passed as a prop (even with identical contents) defeats the memoization — this is exactly why `React.memo` on a child is usually paired with `useCallback`/`useMemo` in the parent for any function/object props. And memoizing a cheap component can cost *more* than it saves (the comparison itself isn't free) — profile before reaching for this, don't wrap everything reflexively.

**What is an Error Boundary, and why can't it be a function component (as of React 18)?**
An Error Boundary is a component that catches JavaScript errors thrown anywhere in its child component tree during rendering, and renders a fallback UI instead of crashing the whole app — conceptually the React-UI equivalent of a global exception handler/middleware (`app.UseExceptionHandler()`) catching an unhandled exception so one bad request doesn't take down the whole process.
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logErrorToService(error, info); }
  render() {
    if (this.state.hasError) return <h2>Something went wrong.</h2>;
    return this.props.children;
  }
}
```
It must currently be a class component because the required lifecycle methods (`getDerivedStateFromError`, `componentDidCatch`) have no function-component/hook equivalent yet — this is a good example of "I know class components still matter" to mention if asked. Important trap: error boundaries do **not** catch errors in event handlers (those need a normal `try/catch`), async code, or errors thrown in the boundary itself — only errors during rendering of its children.

---

## 4. Routing & Data Fetching (Intermediate)

**How does React Router work, and how does it compare to ASP.NET routing?**
React Router matches the current URL (client-side, no full page reload) to a component tree, using declarative route definitions.
```jsx
import { createBrowserRouter, RouterProvider, Outlet, useParams, useNavigate } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/orders",
    element: <OrdersLayout />,          // parent renders <Outlet /> for nested routes
    children: [
      { index: true, element: <OrderList /> },
      { path: ":orderId", element: <OrderDetail /> },   // nested/param route
    ],
  },
]);

function OrderDetail() {
  const { orderId } = useParams();       // like [FromRoute] in ASP.NET
  const navigate = useNavigate();        // like RedirectToAction, but client-side
  return <button onClick={() => navigate(-1)}>Back</button>;
}
```
Comparison: ASP.NET routing maps a URL to a **controller action that returns a response**, resolved server-side per request. React Router maps a URL to a **component tree that renders in the browser**, with no server round-trip for navigation — it intercepts link clicks and manipulates the History API directly. Nested routes with `<Outlet />` are conceptually similar to areas/layouts in MVC (`_Layout.cshtml` rendering `@RenderBody()`) — a shared parent shell with a variable inner region per child route.

**What are common data-fetching pitfalls with plain `useEffect` + `fetch`, and why do libraries like React Query/TanStack Query exist?**
Hand-rolled fetching in `useEffect` re-solves the same problems in every component: race conditions (an older, slower request resolving after a newer one and overwriting fresher data), no caching (navigating away and back re-fetches from scratch every time), no request de-duplication (two components fetching the same URL both hit the network), and manual, repetitive loading/error state plumbing.
React Query / TanStack Query solves this by treating server data as a cache with a **key**, not local component state:
```jsx
function OrderDetail({ orderId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`).then(r => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <OrderView order={data} />;
}
```
It handles caching, background refetching, de-duplication, retries, and stale-while-revalidate behavior out of the box. Framing for a .NET dev: this is the front-end analog of what a well-configured `IMemoryCache`/`IDistributedCache` + `HttpClientFactory` combo (plus something like Polly for retries) gives you server-side — you stop hand-writing the same caching/retry boilerplate per call site and instead configure policy once.

**How do you handle loading and error states well (not just a spinner)?**
- Distinguish **initial load** (nothing to show yet — skeleton/spinner) from **background refetch** (stale data still shown, a subtle "refreshing" indicator) — showing a full-page spinner on every refetch is a common UX regression libraries like React Query specifically help avoid via `isFetching` vs `isLoading`.
- Distinguish error types where it matters to the user: a 401 should redirect to login, a 404 should show "not found," a 500/network failure should offer a retry — don't collapse everything into one generic "Something went wrong."
- Combine with an Error Boundary for truly unexpected render-time errors, but handle *expected* request failures (4xx/5xx) explicitly in the component/hook, since those aren't "unexpected" and deserve specific UI, not a boundary fallback.

**What is an optimistic update, and how do you implement one safely?**
An optimistic update immediately applies the expected result of a mutation to the UI *before* the server confirms it, then rolls back if the server call fails — used to make actions like "like a post" or "check off a to-do" feel instant instead of waiting a round trip.
```jsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) =>
      old.map(t => t.id === newTodo.id ? newTodo : t)
    );
    return { previous };                     // context for rollback
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previous);   // rollback
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
});
```
The trap interviewers listen for: you must keep a snapshot to roll back to, and you must reconcile with the server's actual response afterward (`onSettled`/refetch) — optimistic updates without a rollback path just mean your UI can silently lie to the user when a request actually fails.

---

## 5. Performance & Advanced Patterns (Advanced)

**Walk through the reconciliation/diffing algorithm in more depth.**
React's diffing is a heuristic O(n) algorithm, not the theoretically "correct" O(n³) tree-diff — it trades some precision for speed, based on two assumptions that hold true for the vast majority of UI trees: (1) elements of different types produce different trees (no attempt to diff a `<div>` against a `<span>` — the whole subtree is torn down and rebuilt), and (2) developers can hint which child elements are stable across renders using **keys**. Within a single component, React compares the element type: if it's the same type, React keeps the underlying DOM node and updates only the changed attributes/children; if it's a different type, the old subtree (and all its state, including any children's state) is destroyed and a fresh one mounted. This is why, for example, conditionally rendering `<LoginForm />` vs `<SignupForm />` at the same position resets any internal state either had — they're different component types, so React doesn't try to preserve anything between them.

**Why do keys matter for performance specifically, beyond correctness?**
Beyond avoiding the correctness bugs covered earlier, correct keys let React do less work: matching by stable identity means an item that moved position in a list is recognized as "the same DOM node, just relocated" (a cheap move) rather than "everything after the insertion point looks different" (expensive teardown/rebuild of every subsequent node, since positional matching treats index as identity). This matters a lot for large, frequently-reordered lists (drag-and-drop lists, live-updating feeds) — good keys turn an O(n) DOM rebuild into a handful of cheap moves.

**What causes unnecessary re-renders, and how do you avoid them?**
Common causes: a parent re-rendering re-renders all its non-memoized children by default (even if their props didn't change) — this is React's default, not a bug. Passing new object/array/function literals as props every render (defeats `React.memo` shallow comparison). Overly broad Context values causing every consumer to re-render on any change to any field in that context, even fields a particular consumer doesn't use. Fixes, roughly in order of what to try first:
1. Push state down closer to where it's used instead of holding it high in the tree unnecessarily.
2. Split Context into smaller, more targeted contexts (e.g. separate `UserContext` and `ThemeContext` instead of one giant `AppContext`).
3. `React.memo` for genuinely expensive children, paired with `useCallback`/`useMemo` for the props passed to them.
4. Use the composition pattern — passing `children` as JSX means the parent re-rendering doesn't force the children's *content* to re-render, since that JSX was already created and passed down, not recreated by the re-rendering parent.
Always profile before optimizing (see Profiler below) — this is the same discipline as not adding a database index speculatively without checking the execution plan first; premature `useMemo`/`useCallback` everywhere adds real cognitive overhead for maybe-zero benefit.

**What is code-splitting, and how do `React.lazy` + `Suspense` work?**
Code-splitting breaks your JS bundle into smaller chunks loaded on demand instead of one giant bundle downloaded up front — directly analogous to lazy-loading a rarely-used module/assembly instead of eagerly loading everything at startup.
```jsx
const AdminPanel = React.lazy(() => import("./AdminPanel"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      {isAdmin && <AdminPanel />}
    </Suspense>
  );
}
```
`React.lazy` wraps a dynamic `import()` so the component's code is fetched only when it's actually rendered; `Suspense` provides the fallback UI to show while that chunk is loading. Route-based code-splitting (lazy-loading each page/route) is the most common and highest-value place to apply this — a user visiting the login page shouldn't have to download the admin dashboard's JS.

**What memoization strategies exist beyond `useMemo`/`useCallback`/`React.memo`?**
- Memoizing selectors when reading from a global store (e.g. `reselect` with Redux, or built-in selective subscriptions in Zustand) so components only re-render when the specific slice they read actually changes.
- Memoizing expensive derived data at the data layer (e.g. server-side/query-layer aggregation) rather than recomputing client-side on every render — sometimes the right fix is moving the computation, not memoizing it in place.
- Structural sharing in state updates (immutable update patterns, or libraries like Immer) so unchanged parts of a large state object keep the same reference, letting shallow-comparison-based memoization downstream actually work.

**When and why would you virtualize a long list?**
Rendering thousands of DOM nodes at once (a table with 10,000 rows) is expensive regardless of how well-optimized the React-level rendering is — the browser still has to lay out, paint, and hold all those real DOM nodes in memory. List virtualization (libraries like `react-window` or `react-virtualized`, or TanStack Virtual) renders only the rows currently visible in the viewport (plus a small buffer), recycling DOM nodes as the user scrolls — turning "render 10,000 rows" into "render ~20 rows at a time." This is the same trade-off as server-side paging on a SQL query instead of pulling every row into memory — don't materialize what the user can't currently see.

**How do you profile a slow-rendering React app?**
React DevTools has a **Profiler** tab: record an interaction, and it shows a flame graph of every component that rendered during that commit, how long each took, and — critically — *why* it rendered (props changed, state changed, parent re-rendered, hook changed). Look for: components rendering that shouldn't have (unnecessary re-renders per the causes above), components taking disproportionately long (candidate for memoization or virtualization), and rapid repeated re-renders from something like an unstable dependency in a `useEffect`. Pair this with the browser's own Performance tab for anything below the React level (layout thrashing, expensive CSS, long tasks blocking the main thread). Always profile a production build (or at least profiling mode) — dev builds have extra instrumentation overhead that skews absolute numbers, though relative comparisons (before/after a fix) are still useful in dev.

---

## 6. TypeScript with React (Advanced)

**Why does TypeScript pair especially well with a background like yours?**
Coming from C#, you're already used to the compiler catching type mismatches before runtime, IntelliSense driven by real type information, and interfaces as contracts between layers — TypeScript brings essentially that same discipline to a language (JavaScript) that doesn't have it natively. In React specifically, TS catches a large class of bugs that are otherwise easy to ship silently: passing the wrong shape of props, forgetting a required prop, misspelling an event handler's parameter type, or handling an API response whose shape drifted from what the code assumes. It's a strong selling point to mention explicitly in an interview — most .NET-background React developers reach for TypeScript by default rather than plain JS for exactly this reason, and interviewers view it favorably as it signals you'll write maintainable front-end code, not just working code.

**How do you type props, state, and function components?**
```tsx
interface UserCardProps {
  name: string;
  age?: number;                       // optional prop
  onSelect: (userId: string) => void; // typed callback, like a typed delegate
}

function UserCard({ name, age, onSelect }: UserCardProps) {
  const [expanded, setExpanded] = useState<boolean>(false); // explicit generic
  return (
    <div onClick={() => onSelect(name)}>
      {name}{age !== undefined ? ` (${age})` : ""}
    </div>
  );
}
```
Note `useState<boolean>(false)` — TS can usually infer this from the initial value, so the explicit generic is mainly needed when the initial value doesn't fully describe the type (e.g. `useState<User | null>(null)`, since `null` alone would infer as just `null`).

**How do generics work in React components, and when would you use one?**
Just like a generic class/method in C#, a generic component lets you write one reusable component whose prop/data types are parameterized rather than hardcoded — useful for things like a generic `<Table<T>>` or `<Select<T>>` that works with any data shape.
```tsx
interface SelectProps<T> {
  items: T[];
  getLabel: (item: T) => string;
  onChange: (item: T) => void;
}

function Select<T>({ items, getLabel, onChange }: SelectProps<T>) {
  return (
    <select onChange={(e) => onChange(items[Number(e.target.value)])}>
      {items.map((item, i) => (
        <option key={i} value={i}>{getLabel(item)}</option>
      ))}
    </select>
  );
}

// usage — T is inferred as Product
<Select items={products} getLabel={p => p.name} onChange={p => setSelected(p)} />
```

**How do you type event handlers?**
TypeScript ships React's own event types (`React.ChangeEvent`, `React.MouseEvent`, `React.FormEvent`, etc.), parameterized by the target element type:
```tsx
function SearchBox() {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);   // e.target correctly typed as HTMLInputElement
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={handleChange} />
    </form>
  );
}
```
Interview trap: forgetting the generic parameter (`React.ChangeEvent` with no `<HTMLInputElement>`) leaves `e.target` typed too loosely (or as `EventTarget`, missing `.value` entirely) — always parameterize with the actual element type.

**How do you type API responses and keep the front end honest about the backend contract?**
```tsx
interface OrderDto {
  id: string;
  total: number;
  status: "Pending" | "Shipped" | "Delivered";  // maps to a C# enum
}

async function fetchOrder(id: string): Promise<OrderDto> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.status}`);
  return res.json();  // note: this is a type assertion, not runtime validation
}
```
Worth mentioning as a senior-level nuance: `res.json()` typed as `Promise<OrderDto>` is TypeScript *trusting* you, not *verifying* the actual response shape — if the .NET API changes a field name, TS won't catch it at compile time, only a runtime mismatch will surface it. For a genuinely type-safe contract end-to-end, teams either generate TS types directly from the API's OpenAPI/Swagger spec (`openapi-typescript`, NSwag) or validate responses at runtime with a schema library (Zod) — both are strong things to bring up if asked "how do you keep the front end and .NET API in sync."

---

## 7. Testing React Apps (Advanced)

**What's the philosophy behind React Testing Library (RTL), and why "test behavior, not implementation"?**
RTL deliberately makes it awkward to reach into a component's internal state or implementation details — its APIs are built around querying the DOM the way a real user would (`getByRole`, `getByLabelText`, `getByText`) and interacting with it the same way (`userEvent.click`, `userEvent.type`), rather than calling internal methods or inspecting component instance state directly (which was possible, and commonly done, with the older Enzyme library's shallow rendering). The philosophy: tests should give you confidence the app works for actual users, and should keep passing across a refactor as long as user-facing behavior didn't change — testing implementation details makes tests brittle, breaking on harmless internal refactors (renaming a piece of state, switching from a class to a function component) even though nothing observable changed. This maps closely to a principle you already apply in .NET: test the public contract/behavior of a class, not its private methods.
```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submits the search query on button click", async () => {
  render(<SearchBox onSearch={mockOnSearch} />);

  await userEvent.type(screen.getByLabelText(/search/i), "react hooks");
  await userEvent.click(screen.getByRole("button", { name: /search/i }));

  expect(mockOnSearch).toHaveBeenCalledWith("react hooks");
});
```

**How do you mock API calls in tests?**
Two common approaches: mock the fetching function/module directly (`jest.mock`), or intercept at the network level with **MSW (Mock Service Worker)**, which is generally preferred today because it lets your component's actual `fetch`/`axios` code run unmodified — you're testing closer to the real integration, just with a fake network layer, similar to spinning up an in-memory/test server for an integration test in ASP.NET Core rather than mocking `HttpClient` calls piecemeal.
```jsx
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("/api/orders/:id", () =>
    HttpResponse.json({ id: "1", total: 99.99, status: "Shipped" })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders order details from the API", async () => {
  render(<OrderDetail orderId="1" />);
  expect(await screen.findByText(/shipped/i)).toBeInTheDocument();
});
```

**What are snapshot tests, and what are their pitfalls?**
A snapshot test renders a component and saves its output (usually serialized JSX/DOM) to a file; subsequent test runs compare against that saved snapshot and fail if it changed. Pitfalls: they're easy to approve blindly (`jest --ci -u` or a developer habitually clicking "update snapshot" without actually reviewing the diff) which defeats the entire purpose — they become a checkbox, not a real assertion. Large snapshots are also hard to review meaningfully in a PR diff, and they're brittle to totally unrelated changes (a shared component's className changing breaks every snapshot that renders it, generating review noise). Best practice: keep snapshots small and targeted (a specific subtree, not a whole page), or often prefer explicit assertions (`expect(screen.getByText(...)).toBeInTheDocument()`) which document *intent* rather than just "whatever the output happened to be last time."

**Component testing vs end-to-end testing (Cypress/Playwright) — where's the line?**
- **Component/unit tests (Jest + RTL)**: fast, run in a simulated DOM (jsdom), test one component's behavior in isolation with dependencies mocked — the bulk of your test suite should live here for the same reason a healthy .NET test pyramid is mostly unit tests.
- **E2E tests (Cypress/Playwright)**: run against a real (or close to real) browser and a real running app (often against a real or realistically-mocked backend), testing full user flows across multiple pages (login → add to cart → checkout) — slower, more brittle to unrelated changes, but catch integration issues unit tests structurally can't (real routing, real network timing, real browser quirks, actual cross-page state). Use E2E sparingly, for your critical user journeys, not as a replacement for component-level coverage — same "test pyramid" reasoning as unit vs integration vs full end-to-end tests in a .NET API.

---

## 8. Architecture & Full-Stack Integration (Advanced/Senior)

**How do you structure a React project at scale?**
Two common philosophies, and most large codebases end up as a hybrid:
- **Type-based** (`components/`, `hooks/`, `services/`, `pages/`) — simple to start with, but as the app grows, working on one feature means jumping across many top-level folders.
- **Feature-based / "vertical slice"** (`features/orders/{components,hooks,api,types}`, `features/users/{...}`) — everything related to one feature lives together, easier to reason about, easier to delete a whole feature cleanly, and scales much better on a large team. This is the front-end equivalent of organizing a .NET solution by feature/module (vertical slice architecture) rather than by technical layer (`Controllers/`, `Services/`, `Repositories/` folders spanning every feature) — the same architectural instinct applies on both sides of the stack, and it's a strong thing to say explicitly in an interview to show you're not just pattern-matching React folder conventions from a tutorial.
A `shared/` or `common/` folder holds genuinely cross-feature primitives (design-system components, generic hooks, API client setup) — the discipline is keeping that folder small and resisting the urge to dump everything reusable-*sounding* into it.

**How do you consume a .NET Web API from React, including auth?**
```tsx
// api/client.ts — a thin wrapper, analogous to a typed HttpClient/service in .NET
const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken();  // refresh-token flow
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient.request(error.config);         // retry original request
    }
    return Promise.reject(error);
  }
);
```
Axios interceptors here play the same role as a `DelegatingHandler` in a typed `HttpClient` in .NET — cross-cutting concerns (attaching auth headers, handling 401s uniformly) applied once instead of scattered across every call site. For the JWT flow specifically: the React app gets an access token (short-lived) and a refresh token (longer-lived) from ASP.NET Core Identity/your auth endpoint at login; the access token rides in the `Authorization: Bearer` header on every API call; when a call returns 401 (expired token), the interceptor silently calls a refresh endpoint to get a new access token and retries — the user never notices unless the refresh token itself has also expired, at which point you redirect to login. Store the access token in memory (a JS variable/React state) rather than `localStorage` where possible — `localStorage` is readable by any JS on the page, so an XSS vulnerability anywhere in your app or its dependencies can exfiltrate it; a memory-only access token limits exposure to the current tab session, and the refresh token is typically kept in an `HttpOnly` cookie set by the server so client-side JS can't read it at all.

**How do you configure CORS on the .NET side for a React app?**
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
        policy.WithOrigins("https://myapp.com", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());   // needed if using cookies for the refresh token
});
// ...
app.UseCors("ReactApp");
```
Key traps to mention: `UseCors` must be positioned correctly in the middleware pipeline (after `UseRouting`, before `UseAuthorization`), `AllowCredentials()` cannot be combined with `AllowAnyOrigin()` (the spec explicitly forbids wildcard origin + credentials for security reasons — you must list explicit origins), and in dev you typically need both your Vite/CRA dev server origin and your deployed origin listed, or use environment-specific CORS policies.

**State synchronization between React and the server — what patterns do you use?**
- Treat server data as a cache (React Query/SWR, covered earlier) rather than copying it into ad hoc local `useState` scattered around — a single source of truth per query key, automatically kept fresh/invalidated, instead of manually re-fetching and re-syncing local copies everywhere a piece of server data is used.
- For real-time sync (multiple users editing shared data), SignalR (which you likely already know from the .NET side) has a first-class JS client — the React app subscribes to a hub connection and updates its local query cache directly when a server-pushed event arrives (e.g. invalidate/update the React Query cache entry for `["order", orderId]` when a `OrderUpdated` SignalR event fires), avoiding a naive polling approach.
- Optimistic updates (covered in section 4) for the "feels instant" cases, with the query cache as the reconciliation point once the server confirms.

**Give a one-paragraph overview of SSR/Next.js — when would you actually reach for it?**
Server-Side Rendering (SSR) renders the initial HTML on the server (or at build time — Static Site Generation) instead of shipping an empty `<div id="root">` and letting the browser build the whole UI via JS after the fact (client-side rendering, what a typical Vite/CRA SPA does by default). Next.js is the dominant React framework that layers SSR, SSG, file-based routing, and — since Next 13+ — React Server Components on top of React itself. You'd reach for it when SEO matters (crawlers seeing fully-rendered HTML rather than an empty shell), when fast first-paint/perceived load time matters more than raw interactivity speed after load (content sites, marketing pages, e-commerce catalogs), or when you want data-fetching to happen closer to your data source instead of round-tripping from the browser. For a typical internal line-of-business app sitting behind a login wall and driven by a .NET API — which is a lot of what enterprise .NET full-stack work looks like — a plain SPA (Vite + React Router, served as static files) is often the simpler, entirely sufficient choice; SEO and first-paint-before-JS usually don't matter behind auth. Know both options and be ready to justify picking the simpler one when it's genuinely the right call — that judgment call itself is a senior-level signal.

**Vite vs Create React App vs Next.js — how do you choose build tooling?**
- **Create React App (CRA)**: the historical default, now officially deprecated/unmaintained by the React team as of the last couple of years — you shouldn't start a new project with it, but you'll still encounter it in older codebases.
- **Vite**: the current default for a plain SPA — uses native ES modules in dev for near-instant startup/HMR (no full bundling needed during development) and Rollup for optimized production builds. This is what you'd reach for building a standard React SPA against a .NET Web API today.
- **Next.js**: the choice when you specifically need SSR/SSG/Server Components/file-based routing as described above — it's a fuller framework, not just a build tool.
The practical framing for an interview: "for a SPA consuming a .NET API, Vite; for something that needs SSR/SEO, Next.js; CRA only if I've inherited it."

**How do you manage environment configuration across dev/staging/prod?**
Vite (and CRA before it) support `.env` files per mode (`.env.development`, `.env.production`, `.env.staging` with `--mode staging`), exposing variables prefixed `VITE_` (or `REACT_APP_` for CRA) to client code at build time — note the "build time" part: unlike a .NET `appsettings.{Environment}.json` read at runtime, these are baked into the static bundle when it's built, so you need a separate build per environment (or a small runtime-config JSON fetched on load, if you need one build artifact promoted unchanged across environments — often the better pattern for a proper build-once-deploy-many pipeline). Never put real secrets in front-end env vars regardless of the approach — anything shipped to the browser is visible to any user who opens DevTools; the front end should only hold public config (API base URL, public keys), with actual secrets staying server-side.

**How do you deploy a React app served alongside ASP.NET Core vs as a separate static host — trade-offs?**
- **Served from `wwwroot` inside the ASP.NET Core app** (build React, copy output into `wwwroot`, one deployable unit): simpler ops (one deployment, no separate CORS config needed since same-origin), but couples front-end and back-end release cadence together, and every front-end-only change requires a full app redeploy.
- **Separate static host** (Azure Static Web Apps, an Azure Storage static site + CDN, Netlify/Vercel), API as a pure JSON backend: front end and back end deploy and scale independently, front-end assets are served from a CDN edge (faster global load times) instead of your app server, but you now need CORS configured properly and have two deployment pipelines to maintain instead of one.
Most modern teams doing "real" full-stack React + .NET prefer the separate-host approach for the independent-deployability and CDN benefits, reserving the combined-`wwwroot` approach for simpler internal tools where operational simplicity outweighs those benefits — be ready to state a preference and justify it rather than just listing both.

---

## 9. Modern React & Ecosystem Awareness (Senior)

**What's new in React 18/19 that you should be able to speak to?**
- **Automatic batching**: React 18 batches multiple state updates into a single re-render even outside event handlers (e.g. inside a `Promise.then`, `setTimeout`, or a native event handler) — before 18, only updates inside React event handlers were batched, so an async callback calling `setState` twice caused two separate re-renders. Now it's consistently one, improving performance without you doing anything.
- **Concurrent rendering**: React can start rendering an update, pause it, and come back to it (or abandon it) without blocking the main thread — the underlying mechanism that features like `useTransition` (mark a state update as low-priority/"can be interrupted," e.g. a search-results re-render while the input itself stays instantly responsive) and `useDeferredValue` build on.
- **Suspense for data fetching**: originally Suspense was for code-splitting (`React.lazy`); React 18+ extends the same `<Suspense fallback={...}>` mechanism to data fetching, letting a component "suspend" while data loads and showing a fallback declaratively, instead of manually threading `isLoading` booleans everywhere — frameworks like Next.js (App Router) and libraries like React Query lean into this.
- **React Server Components (RSC)** — conceptual level: components that render entirely on the server, ship zero JS to the client for that component, and can directly access server-only resources (a database, the filesystem) without an API layer in between — a genuinely new category alongside "client" and (historically) "server-rendered-then-hydrated" components. This is a Next.js App Router concept primarily, not something you'd hand-roll in a plain Vite SPA — know it exists and roughly what problem it solves (shipping less JS, colocating data access with the component that needs it) even if you haven't used it hands-on.
- **The `use` hook (React 19)**: lets you read the value of a Promise or Context conditionally, inside conditionals/loops (unlike other hooks) — primarily meant to be used with Suspense for cleaner data-fetching ergonomics, and with RSC-style architectures.
Honest framing if you haven't used RSC/the `use` hook hands-on: "I've worked mainly with the SPA + Web API model, so my hands-on depth is strongest there; I understand Server Components conceptually — less client JS, server-side data access without a separate API round trip — but haven't shipped them in production yet." That's a perfectly fine senior-level answer; overclaiming hands-on depth you don't have is the bigger risk.

**How would you contrast React with Angular/Vue if asked "why React over Angular" (useful given your other prep covers Angular/Vue)?**
React is a focused rendering **library** — it owns the view layer and lets you (or your team's conventions) pick routing, state management, and form handling from the ecosystem, whereas Angular is a full, opinionated **framework** — routing, DI, HTTP client, forms, and testing utilities all ship together and are expected to be used as designed, which means less decision fatigue but less flexibility. Vue sits between the two: more batteries-included than React out of the box (official router and state library maintained alongside core), but with a gentler, more approachable API surface than Angular and a reactivity model (automatic dependency tracking) that requires less manual optimization than React's explicit `useMemo`/`useCallback`/`React.memo` toolkit. In practice: React's flexibility is a strength for teams that want to choose best-in-class tools per concern (and it has by far the largest ecosystem/hiring pool), but it does mean two React codebases can look quite different depending on the choices a team made — worth acknowledging as a real trade-off, not just a selling point, if an interviewer pushes on it.

**When would you *not* choose React?**
Worth having a genuine answer ready, since "when would you NOT use X" tests whether you're reasoning or just advocating: a very small, mostly-static site (marketing page, brochure site) doesn't need a component framework at all — plain HTML/CSS or a lightweight static site generator ships less JS and is simpler to maintain. A team already standardized on Angular with deep Angular expertise and no strong reason to switch shouldn't introduce a second front-end paradigm just because React is popular — consistency across a codebase/org has real value. And for something requiring extremely fine-grained, high-frequency reactivity with minimal overhead (certain real-time/graphics-heavy use cases), some teams reach for frameworks with a different reactivity model (SolidJS, Svelte) that avoid virtual-DOM diffing overhead entirely — a niche case, but worth knowing it exists if pushed on "is React always the right choice."

---

## 10. Behavioral / Scenario Questions (STAR format, senior full-stack framing)

Prepare 3-4 real stories from actual projects and map them to these prompts — reuse strong stories across multiple questions rather than inventing a new one for each bullet.

- **"Tell me about a time you had to optimize a slow-rendering React app."** — Situation/Task: what was slow and how you noticed (user complaint, a metric, or you profiling proactively). Action: walk through actually using the React DevTools Profiler to find the offending component(s), what the root cause turned out to be (unnecessary re-renders from unstable prop references, a missing key causing full list rebuilds, an unmemoized expensive computation, a giant unvirtualized list), and the specific fix. Result: a concrete before/after if you have one (render count, time-to-interactive, or just "eliminated visible jank on typing").
- **"How do you structure state in a large React app with a .NET backend?"** — Lead with the layered mental model: server data lives in a query cache (React Query/SWR) keyed by query, not duplicated into ad hoc component state; genuinely global/ambient client-only state (auth session, theme, feature flags) lives in Context or a lightweight store; everything else defaults to local component state until there's a real sharing need, then gets lifted only as far up the tree as necessary. Tie back to not over-engineering — the same judgment call as not making every service a singleton in a .NET app just because it's convenient.
- **"How do you handle authentication end-to-end between React and ASP.NET Core Identity/JWT?"** — Walk the full flow you described in section 8: login endpoint issues access + refresh tokens, access token in memory / `Authorization` header per request via an interceptor, refresh token in an `HttpOnly` cookie, a 401 response triggers a silent refresh-and-retry, full refresh failure redirects to login. Mention route guarding on the front end (a wrapper component/route loader checking auth state before rendering protected routes) as the client-side complement to `[Authorize]` on the API — and be clear that the *front-end* check is a UX nicety, not a security boundary; the API's own authorization is the actual enforcement point.
- **"How do you approach code review for frontend PRs?"** — Similar principles to backend review (focus on the "why," distinguish blocking issues from nitpicks, explain reasoning rather than just dictating changes) with React-specific things you actually check: are hooks' dependency arrays correct/complete, is there unnecessary re-rendering being introduced, are keys stable and correct in any new lists, is loading/error state handled (not just the happy path), is there a11y basics (semantic elements, labels on inputs, keyboard navigability) — and for a team with mixed React experience levels, calling out anti-patterns like fetching in `useEffect` without cleanup as a teaching moment, not just a blocking comment.
- **"How would you ramp up on React if your background is mostly server-side .NET?"** — Be honest and concrete about your actual ramp path if you're relatively new to React specifically (even with years of general full-stack experience): official React docs (the new react.dev docs are excellent and hooks-first), building one real small project end-to-end rather than just tutorials (e.g. a small CRUD app against a real API — ties directly into your existing .NET Web API skills, so you're only learning the front-end half, not both sides at once), then pairing/code review with a React-experienced teammate to catch idiom mistakes tutorials don't teach (stale closures, missing dependency arrays, prop drilling you should've avoided). Frame it as "I ramp fast on new tech by shipping something real quickly and getting review, not by reading indefinitely before writing code" — a stronger answer than just listing resources.

---

### Night-Before Priority Order
Given limited prep time, review in this order:
1. `useState`/`useEffect` pitfalls cold — the stale closure trap, the missing-dependency trap, and the cleanup-function/`AbortController` pattern. These come up in some form in almost every React interview regardless of seniority.
2. Keys and reconciliation — why keys matter, what breaks with index-as-key, one clean sentence on how the diffing algorithm works.
3. State management decision tree — lifting state up → Context → Redux/Zustand, and be ready to justify the call rather than just naming the options.
4. The .NET-integration story: JWT + refresh token flow between React and ASP.NET Core Identity, CORS configuration, and why access tokens shouldn't sit in `localStorage`. This is where your seniority is supposed to show relative to a generic React candidate.
5. `React.memo`/`useMemo`/`useCallback` — what each actually memoizes, and the discipline of "profile first, don't memoize reflexively."
6. Have one crisp React-vs-Angular contrasting paragraph ready out loud, since your other prep files cover Angular/Vue and an interviewer may ask "why React" directly.
7. One or two of the behavioral answers above rehearsed out loud, especially the performance-optimization story and the auth end-to-end story — these are the two most likely to actually get asked for a senior full-stack React role.
