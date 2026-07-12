# .NET Core Flashcards
*Cover the answer, say it out loud, then check. Condensed from `Inter_Prep_Answers.md`.*

---

## 1. C# Fundamentals

**Q: Abstract class vs interface — when do you use each?**
A: Abstract class for shared state/implementation on an "is-a" hierarchy (one base only). Interface for a pure "can-do" capability contract (many per class).

**Q: The four pillars of OOP?**
A: Encapsulation, Abstraction, Inheritance, Polymorphism (A-PIE).

**Q: Name all five SOLID principles.**
A: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.

**Q: struct vs class — core difference?**
A: struct = value type, copied on assign/pass. class = reference type, copies only the pointer.

**Q: What happens when you pass a `List<int>` to a method and the method does `list.Add(1)` vs `list = new List<int>()`?**
A: `.Add(1)` mutates the shared object — caller sees it. Reassigning the local parameter does not affect the caller's reference (unless passed with `ref`).

**Q: Why is boxing expensive?**
A: It heap-allocates to wrap a value type in `object`, adding GC pressure — generics (`List<T>`) avoid it entirely.

**Q: `new` keyword on a method vs `override` — what's the difference in behavior?**
A: `override` participates in dynamic dispatch (actual object type wins). `new` hides the base member — calling through a base-typed reference still gets the base version.

**Q: What's the deadlock scenario in async code?**
A: Blocking with `.Result`/`.Wait()` on a thread whose captured context the continuation needs back — neither side can proceed. Fix: await all the way up.

**Q: When should you use `Task.Run`?**
A: Only for genuinely CPU-bound work. Never wrap an already-async I/O call in it.

**Q: What are the GC generations, in order?**
A: Gen 0 (short-lived, cheap) → Gen 1 (buffer) → Gen 2 (long-lived, expensive) → Large Object Heap (>85KB, not compacted by default).

**Q: Why is calling `.ToList()` before `.Where()` on an `IQueryable` a performance trap?**
A: It forces the whole table into memory first, then filters in-memory — instead of translating the filter into SQL run at the database.

**Q: `throw;` vs `throw ex;` — why does it matter?**
A: `throw;` preserves the original stack trace. `throw ex;` resets it to the rethrow point, destroying the original failure location.

**Q: The three DI lifetimes and when to use each?**
A: Transient (new every time — stateless services), Scoped (per request — `DbContext`), Singleton (app lifetime — config/cache). Watch for captive dependency: injecting Scoped/Transient into a Singleton.

---

## 2. Design Patterns

**Q: Why might a custom Repository/Unit of Work layer be redundant in EF Core?**
A: `DbSet<T>` is effectively a repository and `SaveChanges()` is effectively a unit of work already.

**Q: How do you make a thread-safe Singleton in modern C#?**
A: `Lazy<T>` — handles the creation race condition for you.

**Q: Factory Method vs Abstract Factory?**
A: Factory Method creates one object type on request. Abstract Factory creates families of related objects that must stay consistent with each other.

**Q: DIP vs DI — how are they different?**
A: DIP is a design principle (depend on abstractions). DI is a technique used to achieve it (supply dependencies from outside).

**Q: Adapter vs Decorator?**
A: Adapter translates an incompatible interface to match what you need. Decorator adds new behavior while keeping the same interface.

---

## 3. ASP.NET Core

**Q: Recite the MVC filter execution order.**
A: Authorization → Resource → Action (wraps action) → Exception (wraps action on failure) → Result.

**Q: Recite correct middleware ordering.**
A: ExceptionHandler → HttpsRedirection → Routing → Authentication → Authorization → CORS → MapControllers.

**Q: What breaks if `UseAuthorization()` is placed before `UseAuthentication()`?**
A: It compiles fine but every request is treated as unauthenticated — auth checks run against an unpopulated `HttpContext.User`.

**Q: Name the four API versioning strategies.**
A: URL segment, query string, custom header, media type/content negotiation.

**Q: What does `[ApiController]` give you automatically?**
A: Auto-400 response on invalid ModelState, binding source inference, requires attribute routing.

**Q: JWT vs OAuth2 vs OIDC — what does each actually do?**
A: JWT = token format carrying signed claims. OAuth2 = delegated authorization framework. OIDC = identity/authentication layer on top of OAuth2.

**Q: What's the dangerous CORS combination?**
A: `AllowAnyOrigin()` + `AllowCredentials()` — browsers block it; always list explicit trusted origins.

**Q: Which HTTP verbs are idempotent?**
A: GET, PUT, DELETE. POST is not.

**Q: 401 vs 403 — what's the difference?**
A: 401 = not authenticated ("who are you"). 403 = authenticated but not allowed.

**Q: What is the Saga pattern for, and what are its two coordination styles?**
A: Handles distributed transactions across services via local transactions + compensating actions on failure. Choreography (event-reactive, no coordinator) vs Orchestration (central coordinator).

---

## 4. LINQ

**Q: Deferred vs immediate execution — give one example of each.**
A: Deferred: `.Where()` (not run until enumerated). Immediate: `.ToList()`, `.Count()`, `.First()`.

**Q: Why is reusing a deferred `IQueryable` in a loop a bug?**
A: Each enumeration re-runs the query against the database — materialize once with `.ToList()` if reused.

**Q: Select vs SelectMany?**
A: Select projects 1:1 (can produce nested collections). SelectMany flattens nested collections into one flat sequence.

**Q: Why prefer `Single()` over `First()` for a primary-key lookup?**
A: `Single()` enforces and surfaces a uniqueness violation immediately; `First()` silently hides a duplicate-row bug.

**Q: What is the N+1 query problem, and the fix?**
A: Loading a list then triggering one query per item for related data inside a loop. Fix: eager-load with `.Include()`.

---

## 5. Entity Framework Core

**Q: Why is `DbContext` registered as Scoped rather than Singleton?**
A: It's not thread-safe, accumulates tracked entities over time, and a request is a natural unit-of-work boundary.

**Q: What does `AsNoTracking()` do, and when should you avoid it?**
A: Skips change-tracking overhead for read-only queries. Avoid it if you intend to modify and `SaveChanges()` the same entity.

**Q: Lazy vs Eager vs Explicit loading?**
A: Lazy = auto-loads on access (invisible N+1 risk). Eager = `.Include()` up front (visible in code). Explicit = `.Load()` triggered manually when needed.

**Q: How does EF detect an optimistic concurrency conflict?**
A: A `[Timestamp]`/RowVersion column is included in the UPDATE's WHERE clause; a mismatch means 0 rows affected, throwing `DbUpdateConcurrencyException`.

---

## 6. SQL Server

**Q: WHERE vs HAVING?**
A: WHERE filters rows before grouping; HAVING filters groups after `GROUP BY`.

**Q: Clustered vs non-clustered index?**
A: Clustered defines physical row order (one per table). Non-clustered is a separate structure with a pointer back to the row (many per table).

**Q: What's a covering index?**
A: A non-clustered index that `INCLUDE`s all columns a query needs, avoiding a key lookup back to the base table.

**Q: Stored procedure vs function — key distinguishing rule?**
A: Procedures can do DML/side effects but can't be used inline in a SELECT. Functions must return a value, must be side-effect-free, and can be used inline.

**Q: CTE vs temp table — when would you pick a temp table instead?**
A: When you need to reuse a large intermediate result multiple times — CTEs re-evaluate on each reference; temp tables are physically materialized and indexable.

**Q: Recite the four ACID properties.**
A: Atomicity, Consistency, Isolation, Durability.

**Q: Order the SQL isolation levels from loosest to strictest.**
A: Read Uncommitted → Read Committed → Repeatable Read → Serializable.

**Q: Why avoid overusing triggers?**
A: They're invisible/implicit side effects that make debugging hard and can cascade into performance problems.

**Q: What makes a WHERE predicate "non-sargable," and how do you fix it?**
A: Wrapping the column in a function (`WHERE YEAR(OrderDate)=2024`) prevents index seeks. Fix: rewrite as a range (`OrderDate >= ... AND < ...`).

**Q: DELETE vs TRUNCATE vs DROP?**
A: DELETE = selective, logged, fires triggers. TRUNCATE = all rows, minimally logged, resets identity, no triggers, fails on FK reference. DROP = removes the table entirely.

**Q: 1NF vs 2NF vs 3NF, in one line each?**
A: 1NF = atomic columns. 2NF = 1NF + no partial dependency on a composite key. 3NF = 2NF + no transitive dependency on non-key columns.

**Q: How do parameterized queries prevent SQL injection?**
A: The DB engine treats the bound value strictly as data, never as executable SQL syntax — regardless of its content.

**Q: Stored vs Reflected vs DOM-based XSS?**
A: Stored = saved in DB, served to every viewer. Reflected = echoed back from the current request. DOM-based = entirely client-side JS manipulation, never touches the server.

**Q: How do anti-forgery tokens stop CSRF?**
A: A token tied to the user's session must be present and match on state-changing requests; a forged cross-site form has no way to know or include it.

---

## 7. Testing

**Q: Describe the testing pyramid and why it's shaped that way.**
A: Many fast unit tests, fewer integration tests, very few E2E tests — because an E2E-heavy suite is too slow/flaky, while a unit-only suite can pass while the system is broken end-to-end.

**Q: `[Fact]` vs `[Theory]` in xUnit?**
A: `[Fact]` = single non-parameterized test. `[Theory]` + `[InlineData]` = same test logic run against multiple data sets.

**Q: Mock vs Stub vs Fake?**
A: Stub returns canned data only. Mock also lets you verify interactions occurred. Fake is a simplified but working implementation (e.g. in-memory repo).

**Q: TDD cycle?**
A: Red (write failing test) → Green (minimum code to pass) → Refactor (clean up, keep tests green).

**Q: Why avoid testing private methods directly?**
A: It couples tests to implementation details that can change during a harmless refactor — test through the public API instead.

**Q: What's the limitation of code coverage as a quality metric?**
A: A line can be "covered" without being meaningfully asserted on — 100% coverage doesn't guarantee correctness.

---

## 8. JavaScript / Angular

**Q: var vs let vs const — scoping and hoisting?**
A: `var` = function-scoped, hoisted to `undefined`. `let`/`const` = block-scoped, temporal dead zone (ReferenceError if accessed early). `const` can't be reassigned (contents still mutable).

**Q: Why does `Promise.resolve().then()` run before `setTimeout(fn, 0)`?**
A: Microtasks (Promises) fully drain before the next macrotask (setTimeout) — the event loop prioritizes them.

**Q: What is event delegation, and why does it work for dynamically added elements?**
A: One listener on a stable parent, checking `event.target` inside — works because events bubble up from any descendant, including ones added later.

**Q: == vs ===, and the one accepted exception?**
A: `==` coerces types before comparing (surprising edge cases). `===` doesn't. Accepted exception: `x == null` to catch both `null` and `undefined`.

**Q: Structural vs attribute directives in Angular?**
A: Structural (`*ngIf`, `*ngFor`) add/remove elements from the DOM. Attribute (`ngClass`, `ngStyle`) change an existing element's appearance/behavior.
