# .NET Core Cheat Sheet — Quick-Recall Edition
*Condensed from `Inter_Prep_Answers.md`. Mnemonics in 🧠, gotchas in ⚠️.*

---

## 1. C# Fundamentals

| Concept | One-liner |
|---|---|
| Abstract class vs Interface | Abstract = shared state + partial implementation, single inheritance. Interface = pure contract, multiple implementation. Use abstract for "is-a" + shared code; interface for "can-do" capability. |
| 🧠 4 Pillars of OOP | **A-PIE**: **A**bstraction (hide mechanism), **P**olymorphism (one call, many behaviors), **I**nheritance (reuse/specialize), **E**ncapsulation (guard state) |
| 🧠 SOLID | **S**ingle responsibility · **O**pen/closed · **L**iskov substitution · **I**nterface segregation · **D**ependency inversion |
| struct vs class | struct = value type (stack/copy), class = reference type (heap/pointer). Structs good for small immutable data (`Point`, `Money`); large/mutable structs hurt perf via copying. |
| Value vs reference pass | Value type param = copy (changes don't propagate). Reference type param = copy of pointer (mutations visible, reassignment isn't) unless `ref`. |
| Boxing/unboxing | Value type → `object` = heap allocation + GC pressure. Generics (`List<T>`) avoid it; `ArrayList` doesn't. |
| virtual/override/new/sealed | `virtual`+`override` = real polymorphism (dynamic dispatch). `new` = hides base member, no dispatch (classic gotcha: base-typed ref calls base version). `sealed` = stops further override/inheritance. |
| Delegates | Type-safe function pointers. `Action<T>` = void return. `Func<T,TResult>` = returns value. `Predicate<T>` ≈ `Func<T,bool>`. |
| Events | Restricted delegate: outsiders can only `+=`/`-=`, not invoke or clear. Always `?.Invoke(...)`. |
| async/await | Frees thread during I/O wait instead of blocking it. Deadlock = blocking (`.Result`/`.Wait()`) on a thread the continuation needs back. Fix: async all the way up. |
| Task vs Thread | `Thread` = raw OS thread (expensive). `Task` = pooled, composable. `Task.Run` for CPU-bound work only — never wrap already-async I/O in it. |
| 🧠 GC Generations | Objects "die young" → **Gen 0** (frequent/cheap) → **Gen 1** (buffer) → **Gen 2** (long-lived, expensive) → LOH (>85KB, not compacted by default) |
| IEnumerable vs IQueryable vs ICollection vs IList | `IEnumerable` = in-memory iteration. `IQueryable` = expression tree, executes as SQL at the DB. `ICollection` adds Count/Add/Remove. `IList` adds indexing. ⚠️ Calling `.ToList()` too early pulls whole table into memory before filtering. |
| Exception handling | Catch specific types, not bare `Exception` (except at boundaries). Custom exceptions for domain errors. `throw;` not `throw ex;` (preserves stack trace). Never use exceptions for normal control flow. |
| Extension methods | `static` method, `this` on first param — adds methods to types you don't own (how LINQ is built). |
| 🧠 DI Lifetimes | **Transient** = new every request (stateless, e.g. validator) · **Scoped** = one per HTTP request (e.g. `DbContext`) · **Singleton** = one for app life (e.g. config). ⚠️ Captive dependency = Scoped/Transient injected into Singleton → stuck forever. |
| .NET Framework vs .NET Core/5+ | Framework = Windows-only, maintenance mode. Core/5+ = cross-platform, modular, faster, unified since .NET 5. |

---

## 2. Design Patterns

| Pattern | Purpose | Watch-out |
|---|---|---|
| Repository + Unit of Work | Abstract data access + coordinate multi-repo transactions | EF Core's `DbContext`/`DbSet` already does this — extra layer can be pure ceremony on simple CRUD |
| Singleton | One instance, global access (`Lazy<T>` for thread safety) | Naive check-then-create = race condition; mutable state inside still needs its own locking |
| Factory / Abstract Factory | Factory = create one object type by request. Abstract Factory = create *families* of related objects that must stay consistent | Just a fancy switch statement if construction is trivial — value shows up once creation gets complex |
| DIP vs DI | DIP = **principle** (depend on abstractions). DI = **technique** to achieve it (supply deps from outside) | Principle vs mechanism — different layers |
| Strategy | Swap interchangeable algorithms at runtime (e.g. discount calculation) | For a single method, a `Func<>` delegate can be lighter than a full interface |
| Adapter vs Decorator | Adapter = translates incompatible interface. Decorator = adds behavior, same interface | Built-in .NET example: `Stream` wrapped by `GZipStream`/`CryptoStream` = Decorator |

---

## 3. ASP.NET Core / Web API

**MVC request lifecycle:** Routing → Model Binding → Filters (**Auth → Resource → Action → Result**, with Exception filters wrapping action execution) → Action executes → Result executes → Response.

**Middleware order (memorize this order):**
```
UseExceptionHandler → UseHttpsRedirection → UseRouting → UseAuthentication → UseAuthorization → UseCors → MapControllers
```
⚠️ AuthN before AuthZ always — swapping them compiles but silently treats every request as unauthenticated.

| Topic | Key facts |
|---|---|
| MVC vs Web API | Unified in Core: one `Controller` base, one pipeline. `ControllerBase` (no views) for pure APIs; `Controller` when views also needed. `[ApiController]` = auto 400 on invalid ModelState. |
| Filters | Authorization (first, can short-circuit) → Resource → Action (wraps action) → Exception (catches unhandled) → Result (wraps result execution) |
| API versioning | URL segment (most common) · query string · header · media type |
| Model binding/validation | Binds route/query/body → params. Data Annotations populate `ModelState`. `[ApiController]` auto-400s invalid state. |
| Routing | Conventional (`{controller}/{action}/{id?}`, template-based) vs Attribute (`[Route]`/`[HttpGet]`, per-endpoint, standard for Web APIs) |
| Auth | JWT = stateless, signed claims in `Authorization: Bearer`. OAuth2 = delegated authorization. OIDC = identity layer on OAuth2. Identity = built-in user mgmt. |
| CORS | Browser-only mechanism. ⚠️ Never combine `AllowAnyOrigin()` + `AllowCredentials()` — browsers block it, list explicit origins. |
| 🧠 REST verbs/idempotency | GET (safe, idempotent) · POST (create, **not** idempotent) · PUT (replace, idempotent) · PATCH (partial) · DELETE (remove, idempotent) |
| Status codes | 200 OK · 201 Created (+Location header) · 204 No Content · 400 Bad Request · 401 Unauthorized ("who are you") · 403 Forbidden ("not allowed") · 404 · 409 Conflict · 500 |
| REST vs SOAP | REST = lightweight, HTTP verbs, JSON. SOAP = strict XML, WSDL contract, WS-Security/transactions — still in legacy banking/insurance/gov. |
| Rate limiting/caching/pagination | Fixed window / sliding window / token bucket / concurrency limiter. `IMemoryCache` (per-instance) vs Redis `IDistributedCache` (shared across instances). Paginate with metadata (total count, next page). |
| Microservices | Independent deploy + own DB, network communication. Trade-off: org scaling vs network/consistency complexity. Modular monolith often better for small teams. |
| Service comms | Sync: REST / gRPC. Async: message queues/event bus. API Gateway centralizes auth/rate-limit/routing — is itself a SPOF, so run redundant. |
| Distributed transactions | No cross-service ACID. **Saga pattern**: sequence of local transactions + compensating transactions on failure. Choreography (event-reactive, no coordinator) vs Orchestration (central coordinator). |

---

## 4. LINQ

| Concept | Key point |
|---|---|
| LINQ to Objects vs EF LINQ | Objects = in-memory, delegates. EF Core = builds expression tree → translated to SQL by provider. ⚠️ Untranslatable methods throw `InvalidOperationException` in modern EF (used to silently run client-side). |
| Deferred vs immediate execution | Deferred: `.Where()` etc. — not run until enumerated. Immediate: `.ToList()`, `.Count()`, `.First()`, `.Sum()`. ⚠️ Reusing a deferred query in a loop re-runs the query every time. |
| Select vs SelectMany | `Select` = 1:1 projection (can nest). `SelectMany` = flattens nested collections into one sequence. |
| First/FirstOrDefault/Single/SingleOrDefault | First = throws if empty. FirstOrDefault = default if empty. Single = throws unless exactly one match (enforces uniqueness). SingleOrDefault = default if 0, throws if >1. |
| N+1 problem | Loop triggers 1 query per item (lazy loading) instead of 1 query total. Fix: `.Include()` for eager loading. Detect via EF logging/profiler. |

---

## 5. Entity Framework Core

| Concept | Key point |
|---|---|
| Code-first vs DB-first | Code-first = app owns schema via migrations (greenfield). DB-first = scaffold from existing DB (DBA-owned/shared DB). |
| Migrations | `Add-Migration` → `Update-Database`. Never edit an applied migration — add a new one. NOT NULL column on populated table needs a data backfill inside the migration. |
| DbContext lifetime | Registered **Scoped** (per request): not thread-safe, accumulates tracked entities, request = natural unit of work. Singleton DbContext → concurrent corruption. |
| Query optimization | `AsNoTracking()` for read-only · project only needed columns · `.Include()` instead of lazy loading in loops · `.AsSplitQuery()` to avoid cartesian explosion on multiple collection includes |
| Loading strategies | Lazy (auto on access, invisible N+1 risk) · Eager (`.Include()`, explicit) · Explicit (`.Load()` on demand) |
| Optimistic concurrency | `[Timestamp]`/RowVersion column; UPDATE's WHERE includes original RowVersion; mismatch → `DbUpdateConcurrencyException`. Pessimistic locking (`WITH (UPDLOCK)`) for high-contention resources instead. |

---

## 6. SQL Server / Database

| Concept | Key point |
|---|---|
| WHERE vs HAVING | WHERE filters rows before grouping. HAVING filters groups after `GROUP BY`. Push filtering into WHERE for performance. |
| 🧠 Joins | INNER (match both) · LEFT (all left + matches) · RIGHT (mirror) · FULL (all both sides) · CROSS (cartesian, rarely intentional) · SELF (table to itself, e.g. employee→manager) |
| Clustered vs non-clustered index | Clustered = physical row order, one per table. Non-clustered = separate structure + pointer back, many per table. More indexes = faster reads, slower writes. Covering index = `INCLUDE` columns so no key lookup needed. |
| Stored procedure vs function | Procedure: DML allowed, side effects OK, can't be used inline in SELECT. Function: must return value, side-effect-free, inline-usable. ⚠️ Scalar functions in WHERE on large tables kill index usage. |
| Views | Saved SELECT as virtual table. Not materialized/indexed by default (unless indexed view). Can't take parameters. Updatable only if single base table, no aggregates/DISTINCT/GROUP BY. |
| CTE vs subquery vs temp table | CTE = named, scoped to one statement, supports recursion, re-evaluated each reference (not cached). Subquery = inline, gets messy nested. Temp table = physically materialized, indexable, reusable across statements. |
| Execution plans | Look for: scan where seek expected (missing index) · big estimated-vs-actual row gap (stale stats) · repeated key lookups (non-covering index). |
| Dynamic SQL / SQLi | Parameterize values even inside dynamic SQL (`sp_executesql`). Table/column names can't be parameterized — whitelist only. |
| SQL Injection prevention | Parameterized queries · ORMs (auto-parameterize) · least-privilege DB login · input validation as defense-in-depth (not a substitute) |
| XSS | Stored (saved malicious script) / Reflected (in the request itself) / DOM-based (client-JS only). Prevent: encode output by default, CSP headers, sanitize input via allowlist, `HttpOnly`+`Secure` cookies. |
| CSRF | Browser auto-attaches cookies to forged requests. Mitigate: anti-forgery tokens (`[ValidateAntiForgeryToken]`). Mostly a cookie-auth problem — less relevant to header-based JWT APIs. |
| 🧠 ACID | **A**tomicity (all or nothing) · **C**onsistency (valid state to valid state) · **I**solation (no visibility of uncommitted work) · **D**urability (survives crash after commit) |
| 🧠 Isolation levels (increasing strictness) | Read Uncommitted (dirty reads) → Read Committed (SQL Server default) → Repeatable Read (no non-repeatable reads, phantoms possible) → Serializable (fully isolated, most locking) |
| Triggers | Fire automatically on INSERT/UPDATE/DELETE. Avoid overuse — invisible/implicit side effects, hard to debug, can cascade. Good use: audit trails. |
| Optimizing slow queries | Check execution plan → add indexes on WHERE/JOIN/ORDER BY columns → avoid `SELECT *` → avoid non-sargable predicates (e.g. `WHERE YEAR(date)=2024` → rewrite as range) → update stale statistics |
| DELETE vs TRUNCATE vs DROP | DELETE = row-by-row, logged, WHERE allowed, fires triggers. TRUNCATE = all rows, minimally logged, fast, resets identity, no WHERE, no triggers, fails if FK-referenced. DROP = removes table entirely. |
| Normalization | 1NF = atomic columns, no repeating groups. 2NF = no partial dependency on composite key. 3NF = no transitive dependency. Denormalize deliberately for read-heavy reporting (accept redundancy/staleness risk). |

---

## 7. Testing

| Concept | Key point |
|---|---|
| 🧠 Testing pyramid | Unit (many, fast, isolated) → Integration (fewer, real components together) → E2E (very few, full system, slow/brittle) |
| xUnit | `[Fact]` = single test. `[Theory]`+`[InlineData]` = parameterized. New class instance per test method = no shared state by default. |
| Mocking | Stub = canned data, no verification. Mock = canned data + verify interactions (`Verify()`). Fake = simplified working implementation (e.g. in-memory repo). |
| TDD | Red (failing test) → Green (minimum code to pass) → Refactor (clean up, tests stay green). Weak fit for exploratory/spike work. |
| AAA structure | Arrange (setup) → Act (invoke) → Assert (verify). One behavior per test. |
| Testing private methods | Avoid — test through public API. Complex private logic worth testing independently = extract to its own class. |
| Code coverage | Signal for untested gaps, not a quality metric — high coverage with weak assertions gives false confidence. |
| Postman/JMeter | Postman: collections + environments + `pm.test()` scripts, runnable headlessly via Newman in CI. JMeter: load/perf testing, watch p95/p99 latency, throughput, error rate under increasing concurrency. |

---

## 8. JavaScript / Angular

| Concept | Key point |
|---|---|
| var/let/const | `var` = function-scoped, hoisted to `undefined`, redeclarable. `let` = block-scoped, temporal dead zone, reassignable. `const` = block-scoped, can't reassign binding (contents still mutable). Default to `const`. |
| Event loop | Single thread. Call stack → when empty, pull from queue. **Microtasks (Promises) drain fully before next macrotask (setTimeout)**. `async/await` = sugar over Promises. |
| Event bubbling/delegation | Events bubble up the DOM tree. Delegation = one listener on a stable parent, check `event.target` — works for dynamically added children. jQuery `.on(event, selector, handler)`. |
| == vs === | `==` coerces types first (surprising edge cases). `===` no coercion — always prefer, except the accepted `x == null` shortcut. |
| AJAX | `fetch()` (Promise-based, doesn't reject on 4xx/5xx — check `response.ok`) vs older `XMLHttpRequest`. |
| Angular building blocks | Modules (`NgModule`, being replaced by standalone components) → Components (template+class) → Services (shared logic via DI) → Directives: structural (`*ngIf`/`*ngFor`, add/remove DOM) vs attribute (`ngClass`/`ngStyle`, modify existing element). |
