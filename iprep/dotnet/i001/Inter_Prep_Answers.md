# Interview Prep Answers — Full Stack .NET Developer

Companion answers to `Interview_Prep_Questions.md`. Answers are written to be spoken in an interview — concise, with a concrete example or code snippet where it helps. Adjust "I" statements with your own project examples where marked.

---

## 1. C# Language Fundamentals

**Abstract class vs interface**
- Abstract class: can have implementation, fields, constructors; a class can inherit only one. Use when types share common state/behavior ("is-a" relationship, e.g. `Animal` → `Dog`).
- Interface: pure contract (C# 8+ allows default methods, but no fields/state). A class can implement many. Use when unrelated classes need to guarantee the same capability (e.g. `IDisposable`, `ILogger`).
- Rule of thumb: interface for "can-do", abstract class for "is-a" with shared code.

**Four pillars of OOP**
- **Encapsulation**: hide internal state behind properties/methods (`private` fields, public getters).
- **Abstraction**: expose only what's necessary — an interface like `IPaymentService` hides gateway details.
- **Inheritance**: `class Manager : Employee` reuses base behavior.
- **Polymorphism**: `Shape.Area()` overridden differently in `Circle`/`Square`; called via base reference.

**SOLID principles (have one example ready for each — this is asked everywhere)**
- **S**ingle Responsibility: a class should have one reason to change. E.g., split `OrderService` (business logic) from `OrderRepository` (data access) instead of one god class.
- **O**pen/Closed: open for extension, closed for modification. Use strategy pattern/interfaces so adding a new discount type doesn't require editing existing `if/else` chains.
- **L**iskov Substitution: subclasses must be substitutable for their base type without breaking behavior. Classic broken example: `Square : Rectangle` overriding `Width`/`Height` breaks callers expecting Rectangle semantics.
- **I**nterface Segregation: many small interfaces over one fat one. `IReadRepository`/`IWriteRepository` instead of one `IRepository` forcing read-only consumers to implement writes.
- **D**ependency Inversion: depend on abstractions, not concrete classes. `OrderService` depends on `IEmailSender`, not `SmtpEmailSender` directly — injected via constructor.

**struct vs class**
- `struct` is a value type (stack-allocated when local, copied on assignment), `class` is a reference type (heap-allocated, passed by reference). Use structs for small, immutable data (e.g. `Point`, `Money`) where copy semantics are desired and cheap.

**Value types vs reference types**
- Value types (`int`, `struct`, `enum`) hold data directly; assigning/passing copies the value. Reference types (`class`, `string` is special/immutable) hold a pointer to heap data; assigning/passing copies the reference, so both variables point to the same object.
- Passing to a method: value type changes inside the method don't affect the caller's copy unless passed with `ref`/`out`; reference type mutations (not reassignment) are visible to the caller.

**Boxing/unboxing**
- Boxing: converting a value type to `object` (heap allocation). Unboxing: casting back. Expensive because it allocates on the heap and adds GC pressure — avoid in hot loops (e.g. don't put `int` into a non-generic `ArrayList`; use `List<int>` instead).

**virtual / override / new / sealed**
- `virtual`: base method can be overridden. `override`: provides the derived implementation, uses runtime polymorphism (dynamic dispatch). `new`: hides the base member instead of overriding — the base method is called if you reference through a base-typed variable (this is a common gotcha to mention). `sealed`: prevents further overriding of a virtual member, or prevents inheriting from a class entirely.

**Delegates — Action, Func, Predicate**
- Delegate = type-safe function pointer. `Action<T>` returns void, `Func<T,TResult>` returns a value, `Predicate<T>` is `Func<T,bool>` used mainly by `List<T>.Find`. Example: `Func<int,int,int> add = (a,b) => a+b;`

**Events vs delegates**
- An event is a delegate wrapped with restricted access — only the declaring class can invoke it (`Raise`), subscribers can only `+=`/`-=`. Prevents outside code from calling the delegate directly or clearing other subscribers' handlers. Used for the publisher/subscriber pattern (e.g. `button.Click += Handler`).

**async/await**
- Frees the calling thread while waiting on I/O (DB call, HTTP call) instead of blocking it — improves throughput/scalability of a web server. The compiler builds a state machine; `await` doesn't create a new thread, it just yields control.
- Deadlock scenario: blocking on an async call with `.Result` or `.Wait()` on a UI/ASP.NET (classic) thread that has a synchronization context — the continuation tries to resume on that same captured context which is blocked waiting. Fix: use `ConfigureAwait(false)` in library code (not needed in ASP.NET Core, which has no sync context), or better — `await` all the way up, never block on async code.

**Task vs Thread**
- `Thread` is a raw OS thread — expensive to create, you manage everything manually. `Task` is a higher-level abstraction over the thread pool, supports composition (`Task.WhenAll`), cancellation, and continuations. Use `Task.Run` to offload CPU-bound work to the thread pool; use plain `async`/`await` for I/O-bound work (no thread is occupied while waiting).

**Garbage collection / generations**
- .NET GC is generational: Gen 0 (short-lived objects, collected frequently/cheaply), Gen 1 (buffer between 0 and 2), Gen 2 (long-lived objects, expensive collection). Objects promote to the next generation if they survive a collection. Large objects (>85KB) go to the Large Object Heap, collected with Gen 2.

**IEnumerable vs IQueryable vs ICollection vs IList**
- `IEnumerable<T>`: forward-only iteration, in-memory or streamed (LINQ to Objects), deferred execution.
- `IQueryable<T>`: builds an expression tree, execution is deferred and translated to the data source (e.g. SQL by EF) — filtering happens in the database, not in memory.
- `ICollection<T>`: adds `Count`, `Add`, `Remove` to `IEnumerable`.
- `IList<T>`: adds indexed access (`this[int]`) to `ICollection`.
- Interview trap: filtering an `IQueryable` (`.Where()` before `.ToList()`) pushes the filter to SQL; calling `.ToList()` too early pulls everything into memory first.

**Exception handling best practices**
- Catch specific exceptions, not generic `Exception` (masks bugs). Use custom exceptions (`InsufficientFundsException : Exception`) for domain errors so callers can handle them precisely. Use `finally` (or better, `using`/`IDisposable`) for cleanup that must always run. Don't use exceptions for normal control flow (expensive, unclear intent). Log with context before rethrowing (`throw;` not `throw ex;` — the latter resets the stack trace).

**Extension methods**
```csharp
public static class StringExtensions
{
    public static bool IsNullOrEmptyTrimmed(this string s)
        => string.IsNullOrWhiteSpace(s);
}
// usage: myString.IsNullOrEmptyTrimmed();
```
Static class, static method, first parameter prefixed with `this`. Lets you "add" methods to types you don't own (e.g. `string`, third-party classes) without inheritance.

**Dependency Injection & DI lifetimes**
- DI: instead of a class creating its own dependencies (`new SqlRepository()`), they're supplied from outside (constructor injection), decoupling the class from concrete implementations — enables testing with mocks and swapping implementations.
- **Transient**: new instance every time it's requested. Use for lightweight, stateless services.
- **Scoped**: one instance per HTTP request. Use for things like `DbContext` that shouldn't be shared across concurrent requests.
- **Singleton**: one instance for the app's lifetime. Use for stateless, thread-safe services like configuration or caching — never inject a Scoped/Transient service (like DbContext) into a Singleton (captive dependency bug).

**.NET Framework vs .NET Core/.NET 6+**
- .NET Framework: Windows-only, legacy, no longer getting new features. .NET Core/.NET 5+: cross-platform, open source, faster, modular (NuGet packages instead of one big framework), supports side-by-side versions, better performance, cloud/container-friendly. .NET 5+ unified Core/Framework/Xamarin into one platform going forward.

---

## 2. Design Patterns

**Repository & Unit of Work**
- Repository: abstracts data access behind an interface (`IOrderRepository.GetById()`), so business logic doesn't know/care if data comes from SQL Server, an API, or an in-memory store — makes unit testing possible via mocks.
- Unit of Work: coordinates multiple repositories under one transaction, ensuring all changes commit or roll back together (`SaveChanges()` in EF is effectively a built-in Unit of Work).
- Caveat to mention: EF's `DbContext` already implements both patterns to a large degree, so wrapping it again is sometimes debated/unnecessary — good to show you know the trade-off, not just the definition.

**Singleton — risk in multi-threaded apps**
```csharp
public sealed class ConfigManager
{
    private static readonly Lazy<ConfigManager> _instance =
        new(() => new ConfigManager());
    public static ConfigManager Instance => _instance.Value;
    private ConfigManager() { }
}
```
Risk: naive implementations (check-then-create without locking) can create two instances under concurrent first access, or cause race conditions on shared mutable state inside the singleton. `Lazy<T>` with default thread-safety mode solves the creation race.

**Factory / Abstract Factory**
- Factory Method: a method that creates an object, letting subclasses decide the concrete type (e.g. `NotificationFactory.Create("email")` returns `EmailNotifier`).
- Abstract Factory: a factory of factories — creates families of related objects (e.g. `IUIFactory` producing matching `Button`/`Checkbox` for either Windows or Mac look-and-feel).

**Dependency Inversion Principle vs Dependency Injection**
- DIP is a design **principle**: high-level modules shouldn't depend on low-level modules — both should depend on abstractions. DI is a **technique/pattern** that implements DIP by injecting dependencies (via constructor, property, or method) rather than having a class construct them itself. DI is one way to achieve DIP; you can follow DIP without a DI container.

**Strategy pattern**
- Encapsulates interchangeable algorithms behind a common interface, selected at runtime. Example: `IDiscountStrategy` with `PercentageDiscount`, `FlatDiscount` implementations, injected into `CheckoutService` — avoids long `switch`/`if-else` chains and satisfies Open/Closed.

**Adapter vs Decorator**
- Adapter: makes an incompatible interface compatible (e.g. wrapping a third-party payment SDK to match your `IPaymentGateway` interface) — changes the interface.
- Decorator: adds new behavior to an object dynamically without changing its interface (e.g. wrapping a `Stream` with `GZipStream` to add compression, or wrapping a service call with a logging/caching decorator) — same interface, added responsibility.

---

## 3. ASP.NET Core / MVC / Web API

**MVC request lifecycle**
Request → Routing (matches URL to controller/action) → Model Binding (query/body/route → C# objects) → Filters (Authorization → Resource → Action → Result, in that order) → Action method executes → returns `IActionResult`/View → Result execution (renders view or serializes to JSON) → Response.

**Middleware / pipeline**
- Middleware = components chained in `Program.cs`/`Startup.cs` via `app.Use...()`, each can process the request, pass it to the next (`await next()`), and process the response on the way back out. Order matters: e.g. `UseAuthentication()` must come before `UseAuthorization()`, and `UseRouting()` before both. `UseExceptionHandler` typically goes first to catch everything downstream.

**MVC vs Web API**
- In .NET Framework these were separate frameworks. In ASP.NET Core they're unified: both use the same `Controller` base, same routing, same middleware pipeline, same filters. A controller can mix view-returning actions and JSON-returning API actions; there's no more `ApiController` vs `Controller` split (though `[ApiController]` attribute adds API-specific conveniences like automatic 400 on invalid model state).

**Filters**
- **Authorization filters**: run first, check `[Authorize]`.
- **Resource filters**: run before model binding, good for caching short-circuits.
- **Action filters**: run before/after the action method (`OnActionExecuting`/`Executed`) — logging, validation.
- **Exception filters**: handle unhandled exceptions from action/other filters.
- **Result filters**: run before/after the result is executed (e.g. modifying response headers).

**API versioning**
- Options: URL segment (`/api/v1/orders`), query string (`?api-version=1.0`), header (`X-Api-Version`), or media type. URL segment is most common/discoverable. .NET has the `Asp.Versioning` package for this.

**Model Binding & Validation**
- Model binding maps incoming request data (route values, query string, form body, JSON body) to action method parameters/complex objects automatically. Data Annotations (`[Required]`, `[StringLength]`, `[Range]`) decorate the model; `ModelState.IsValid` (or automatic with `[ApiController]`) checks them before the action runs.

**Routing**
- Conventional routing: defined centrally (`app.MapControllerRoute("default", "{controller}/{action}/{id?}")`) — common in MVC views.
- Attribute routing: `[Route("api/[controller]")]`, `[HttpGet("{id}")]` on the controller/action — more explicit and standard for Web APIs, gives fine-grained control per endpoint.

**Auth (JWT, OAuth, Identity)**
- JWT: a signed token containing claims (user id, roles, expiry), sent in the `Authorization: Bearer` header, validated by middleware (`AddAuthentication().AddJwtBearer(...)`) without a server-side session lookup — stateless, good for APIs/microservices.
- OAuth 2.0: authorization framework (delegated access, e.g. "login with Google") — separates the identity provider from the resource server. OpenID Connect sits on top of OAuth for authentication.
- ASP.NET Identity: built-in framework for user management (registration, password hashing, roles, external logins) backed by EF.

**CORS**
- Cross-Origin Resource Sharing — browsers block JS from calling an API on a different origin unless the server explicitly allows it via response headers. Configure in `Program.cs`: `builder.Services.AddCors(o => o.AddPolicy("AllowFrontend", p => p.WithOrigins("https://myapp.com").AllowAnyHeader().AllowAnyMethod()));` then `app.UseCors("AllowFrontend");`. Avoid `AllowAnyOrigin()` combined with credentials in production.

**REST principles / HTTP verbs / status codes**
- REST: stateless, resource-based URLs (nouns not verbs), uses HTTP verbs semantically, cacheable, uniform interface.
- Verbs: GET (read, safe/idempotent), POST (create), PUT (full update, idempotent), PATCH (partial update), DELETE (remove, idempotent).
- Status codes: 200 OK, 201 Created (with `Location` header), 204 No Content (successful delete/update with no body), 400 Bad Request (validation), 401 Unauthorized (not authenticated), 403 Forbidden (authenticated but not allowed), 404 Not Found, 500 Internal Server Error.

**REST vs SOAP [JD1]**
- SOAP: XML-only, strict contract (WSDL), built-in standards for security/transactions (WS-Security), heavier, protocol-agnostic (can run over more than HTTP). REST: lighter, uses standard HTTP verbs/status codes, typically JSON, easier to consume from JS clients. Still see SOAP in legacy enterprise/banking/government integrations with strict contract requirements.

**Swagger/OpenAPI [JD1]**
- Auto-generates interactive API documentation from your controllers/DTOs (`AddEndpointsApiExplorer()`, `AddSwaggerGen()`); lets you test endpoints directly in the browser and gives frontend teams/consumers a live contract without needing Postman collections shared manually.

**Rate limiting, caching, pagination**
- Rate limiting: .NET 7+ has built-in `Microsoft.AspNetCore.RateLimiting` middleware (fixed window, sliding window, token bucket algorithms) to prevent abuse.
- Caching: response caching (`[ResponseCache]`), in-memory cache (`IMemoryCache`) for single instance, distributed cache (Redis) for multi-instance deployments.
- Pagination: `?page=1&pageSize=20`, return metadata (total count, next link) alongside data — avoids loading huge result sets.

**Microservices [JD3]**
- Independent, individually deployable services, each owning its own data store, communicating over the network (vs a monolith = one deployable unit, one shared database). Benefits: independent scaling/deployment, technology flexibility, fault isolation. Costs: network latency, distributed data consistency, operational complexity (need for service discovery, monitoring, centralized logging).

**Microservice communication / API Gateway [JD3]**
- Synchronous: REST or gRPC (gRPC = faster, binary protocol, good for internal service-to-service calls).
- Asynchronous: message queues/event buses (Azure Service Bus, RabbitMQ) — decouples services, improves resilience.
- API Gateway: single entry point for clients, routes to the right microservice, handles cross-cutting concerns (auth, rate limiting, logging) so individual services don't duplicate that logic.

**Distributed transactions / Saga pattern [JD3]**
- Can't use a single ACID transaction across services with separate databases. Saga pattern: a sequence of local transactions, each publishing an event that triggers the next step; if a step fails, compensating transactions undo prior steps (e.g. cancel payment if inventory reservation fails). Alternative: eventual consistency — accept temporary inconsistency, reconcile via events over time.

---

## 4. LINQ

**LINQ to Objects vs LINQ to SQL vs EF LINQ**
- LINQ to Objects: queries in-memory collections (`List<T>`, arrays) — executes as regular C# using delegates.
- LINQ to SQL: older, SQL-Server-only ORM.
- EF LINQ: queries build an `IQueryable` expression tree that EF translates into SQL for the target database at execution time — provider-agnostic (SQL Server, Postgres, etc).

**Deferred vs immediate execution**
- Deferred: the query isn't run until enumerated (`foreach`, `.ToList()`, `.Count()` — well, `.Count()` executes immediately). `var q = db.Orders.Where(o => o.Total > 100);` doesn't hit the DB yet.
- Immediate: `.ToList()`, `.ToArray()`, `.Count()`, `.First()`, `.Sum()` force execution right away.
- Gotcha to mention: reusing a deferred query variable in a loop re-executes the query each time — a common perf bug.

**Group/join/aggregate example (be ready to write live)**
```csharp
var result = orders
    .Where(o => o.Status == "Completed")
    .GroupBy(o => o.CustomerId)
    .Select(g => new
    {
        CustomerId = g.Key,
        TotalSpent = g.Sum(o => o.Amount),
        OrderCount = g.Count()
    })
    .OrderByDescending(x => x.TotalSpent)
    .ToList();

// join example
var joined = orders.Join(customers,
    o => o.CustomerId,
    c => c.Id,
    (o, c) => new { c.Name, o.Amount });
```

**Select vs SelectMany**
- `Select` projects each element to a new form (one-to-one, can result in nested collections). `SelectMany` flattens a collection of collections into a single sequence — e.g. `orders.SelectMany(o => o.Items)` gives a flat list of all items across all orders, not a list of lists.

**First / FirstOrDefault / Single / SingleOrDefault**
- `First()`: returns first match, throws if none. `FirstOrDefault()`: returns default (`null`/`0`) if none, no throw on empty. `Single()`: expects exactly one match, throws if zero or more than one. `SingleOrDefault()`: returns default if zero, throws if more than one. Use `Single`/`SingleOrDefault` when uniqueness is a business invariant you want enforced (e.g. lookup by primary key).

**N+1 problem**
- Happens when you load a parent list, then lazily load related data per item in a loop — e.g. loop over 100 orders, each triggering a separate query for `order.Items` = 101 queries total. Fix with eager loading: `db.Orders.Include(o => o.Items).ToList()` — one query with a join instead.

---

## 5. Entity Framework (Core)

**Code-first vs Database-first**
- Code-first: define C# entity classes, EF generates the schema via migrations — good for greenfield projects, schema evolves with code, version-controlled.
- Database-first: scaffold entity classes from an existing database (`Scaffold-DbContext`) — good when the DB already exists / is owned by another team/DBA.

**Migrations**
- Track incremental schema changes as code (`Add-Migration`, `Update-Database`). In a team: commit migrations to source control, review them in PRs like any code change, avoid editing an already-applied/shared migration (create a new one instead), and be careful with migrations that need data backfills — write custom SQL inside the migration for those.

**Change tracking & DbContext lifetime**
- `DbContext` tracks entities it has loaded so it knows what changed when `SaveChanges()` is called (compares tracked snapshot vs current state). It's scoped per-request in ASP.NET Core because: it's not thread-safe, it accumulates tracked entities (memory growth) if kept too long, and a request represents one natural unit of work/transaction boundary.

**Optimizing EF queries**
- `AsNoTracking()` for read-only queries (skips change tracking overhead).
- Project only needed columns with `.Select(x => new Dto{...})` instead of pulling full entities.
- Avoid lazy loading in loops (see N+1 above) — use `.Include()` or explicit loading intentionally.
- Use `.AsSplitQuery()` for multiple `Include`s that would otherwise create an expensive cartesian-product join.

**Lazy vs eager vs explicit loading**
- Lazy: related data loaded automatically the first time the navigation property is accessed (requires virtual nav properties + proxies) — convenient but easy to trigger N+1 accidentally.
- Eager: `.Include()` loads related data in the same query up front.
- Explicit: manually trigger loading later when needed: `context.Entry(order).Collection(o => o.Items).Load();`

**Concurrency conflicts (optimistic concurrency)**
- Add a `[Timestamp]`/`RowVersion` column (or a version number). On update, EF includes the original RowVersion in the WHERE clause; if another process updated the row in between, zero rows match and EF throws `DbUpdateConcurrencyException`, letting you handle it (retry, merge, or show a "someone else edited this" message) instead of silently overwriting.

---

## 6. SQL Server / Database

**WHERE vs HAVING**
- `WHERE` filters rows before grouping/aggregation. `HAVING` filters groups after `GROUP BY`/aggregation (e.g. `HAVING COUNT(*) > 5`). You can't use an aggregate function in `WHERE`.

**Types of joins**
- INNER: only matching rows in both tables.
- LEFT (OUTER): all rows from left + matches from right (NULLs where no match).
- RIGHT (OUTER): mirror of left.
- FULL (OUTER): all rows from both, matched where possible.
- CROSS: cartesian product (every row × every row) — rarely intentional.
- SELF: a table joined to itself, useful for hierarchical data (e.g. employee → manager, both in the `Employees` table).

**Clustered vs non-clustered indexes**
- Clustered: defines the physical storage order of the table data — only one per table (usually the primary key). Non-clustered: a separate structure with pointers back to the data rows — can have many per table.
- Reads: indexes speed up lookups/filters/joins/sorts dramatically (avoid full table scan). Writes: every index must also be updated on INSERT/UPDATE/DELETE, so too many indexes slow down writes — it's a trade-off, index the columns actually used in WHERE/JOIN/ORDER BY, not everything.

**Stored procedure vs function**
- Stored procedure: can perform DML (INSERT/UPDATE/DELETE), doesn't have to return a value, can have output parameters, can't be used inline in a SELECT.
- Function: must return a value (scalar or table), generally read-only/no side effects, can be used inline in a query (`SELECT dbo.GetAge(BirthDate) FROM ...`). Choose a function for reusable calculations embedded in queries; a stored proc for encapsulated business operations/transactions.

**Views**
- A saved SELECT query presented as a virtual table — simplifies complex joins for consumers, can restrict column access for security. Limitations: generally not indexable unless "indexed/materialized view", can't take parameters (unlike a function/proc), performance depends entirely on the underlying query, updating through a view has restrictions (single base table, no aggregates, etc).

**CTE vs subquery vs temp table**
- CTE (`WITH x AS (...)`): improves readability, can be recursive (great for hierarchical/tree data), scoped to a single statement, not materialized/indexed.
- Subquery: nested inline, can get unreadable when deeply nested, same scope limitation.
- Temp table (`#temp`): physically materialized, can be indexed, reused across multiple statements in the same session/batch — better for large intermediate result sets reused multiple times.

**Execution plans**
- Shows how SQL Server actually executes a query (index seeks vs scans, join algorithms, estimated vs actual rows). Look for: table/index scans on large tables (missing index), high-cost operators, big discrepancies between estimated and actual row counts (stale statistics), key lookups repeated many times (missing covering index).

**Dynamic SQL & risks**
- SQL built as a string at runtime and executed (`EXEC(@sql)`), often to build flexible search filters. Risk: if user input is concatenated directly into that string, it opens SQL injection — always parameterize even inside dynamic SQL (`sp_executesql` with parameters), never string-concatenate raw user input.

**Preventing SQL Injection (be ready to go deep — explicitly listed in JD1)**
- **Parameterized queries / prepared statements**: never concatenate user input into SQL text; bind it as a parameter so the DB engine treats it strictly as data, not executable SQL.
  ```csharp
  var cmd = new SqlCommand("SELECT * FROM Users WHERE Email = @email", conn);
  cmd.Parameters.AddWithValue("@email", userInput);
  ```
- **ORMs** (EF Core LINQ) parameterize automatically under the hood — another reason to prefer them over raw string SQL.
- **Stored procedures with parameters** (not dynamic SQL built inside them).
- **Least privilege**: the app's DB login shouldn't have rights beyond what it needs (no `sysadmin` for a web app account).
- **Input validation** as defense-in-depth (whitelist expected formats), but it's not a substitute for parameterization.
- **Avoid `sp_executesql`/`EXEC` with concatenated strings**; if dynamic SQL is unavoidable, parameterize within it and validate/whitelist any identifiers (table/column names) since those can't be parameterized.

**XSS (Cross-Site Scripting)**
- Attacker injects malicious script into a page viewed by other users (e.g. via an unescaped comment field). Prevention: encode/escape output based on context (HTML encode, Razor `@` does this automatically), Content Security Policy headers, validate/sanitize input, use `HttpOnly`/`Secure` cookies so scripts can't read session cookies even if XSS occurs.

**CSRF**
- Attacker tricks a logged-in user's browser into submitting a request to your site without their knowledge (using their existing session cookie). Mitigated with anti-forgery tokens (`[ValidateAntiForgeryToken]`, `@Html.AntiForgeryToken()`) — a token tied to the user's session that must be present and match on state-changing requests, which an attacker's cross-site form can't know.

**Transactions & ACID**
- **Atomicity**: all-or-nothing — the whole transaction commits or rolls back.
- **Consistency**: DB moves from one valid state to another (constraints/rules always hold).
- **Isolation**: concurrent transactions don't interfere with each other's intermediate state.
- **Durability**: once committed, changes survive a crash.
- Isolation levels (increasing strictness, decreasing concurrency): Read Uncommitted (dirty reads possible) → Read Committed (SQL Server default, no dirty reads) → Repeatable Read (no dirty/non-repeatable reads, phantom rows possible) → Serializable (fully isolated, most locking/lowest concurrency).

**Triggers — when to avoid**
- Triggers fire automatically on INSERT/UPDATE/DELETE — useful for audit trails or enforcing complex cross-table integrity. Avoid overusing them because they're invisible/implicit (hard to debug, hidden side effects surprise developers), can cause performance issues and cascading trigger chains, and make the data flow hard to reason about. Prefer explicit application logic or stored procedures when the logic can live there instead.

**Optimizing a slow query**
- Check the execution plan first for scans vs seeks. Add appropriate indexes on WHERE/JOIN/ORDER BY columns. Avoid `SELECT *` (fetch only needed columns — enables covering indexes). Avoid cursors/row-by-row processing — use set-based operations. Update statistics (`UPDATE STATISTICS`) if estimates are stale. Avoid non-sargable predicates (e.g. `WHERE YEAR(OrderDate) = 2024` prevents index use — rewrite as a date range).

**DELETE vs TRUNCATE vs DROP**
- `DELETE`: removes rows (optionally filtered by WHERE), logged row-by-row, can be rolled back, triggers fire, doesn't reset identity.
- `TRUNCATE`: removes all rows, minimally logged, faster, resets identity seed, can't use WHERE, can't fire DELETE triggers.
- `DROP`: removes the entire table structure (and data) from the database.

**Normalization**
- 1NF: atomic columns, no repeating groups. 2NF: 1NF + no partial dependency on a composite key (non-key columns depend on the whole key). 3NF: 2NF + no transitive dependency (non-key columns depend only on the key, not on other non-key columns).
- Denormalize for performance when read-heavy reporting needs avoid expensive joins — trade write complexity/data duplication risk for read speed (e.g. a reporting table, or storing a calculated `OrderTotal` instead of recomputing from `OrderItems` every time).

---

## 7. Testing

**Unit vs integration vs end-to-end testing**
- Unit: tests a single unit (method/class) in isolation, dependencies mocked — fast, no external systems.
- Integration: tests multiple components together (e.g. controller + real DB, or service + real repository) — verifies they work together correctly.
- End-to-end: tests the whole system as a user would (UI through to DB) — slowest, most brittle, but highest confidence.

**xUnit/NUnit basics**
- xUnit: `[Fact]` = a single test with no parameters; `[Theory]` + `[InlineData(...)]` = the same test logic run against multiple data sets.
- NUnit: `[Test]` = a single test; `[TestCase(...)]` = parameterized equivalent of Theory.
- xUnit creates a new test class instance per test (no shared state by default, avoids test pollution) — worth mentioning as a design difference from NUnit/MSTest.

**Mocking / Moq**
```csharp
var mockRepo = new Mock<IOrderRepository>();
mockRepo.Setup(r => r.GetById(1)).Returns(new Order { Id = 1, Total = 100 });

var service = new OrderService(mockRepo.Object);
var result = service.GetOrderTotal(1);

Assert.Equal(100, result);
mockRepo.Verify(r => r.GetById(1), Times.Once);
```
Mocking isolates the class under test from its dependencies (DB, external services) so the unit test is fast, deterministic, and doesn't require infrastructure.

**TDD**
- Write a failing test first (Red), write the minimum code to pass it (Green), then clean up the implementation (Refactor) — Red/Green/Refactor. Benefits: forces you to think about the API/contract before implementation, gives a safety net for refactoring, naturally leads to high coverage. If you haven't strictly practiced it, be honest and say you write tests alongside/immediately after implementation and understand the discipline.

**Arrange-Act-Assert**
- Arrange: set up inputs, mocks, initial state. Act: call the method under test. Assert: verify the outcome. Keeps tests readable and each test focused on one behavior.

**Testing private methods**
- Generally avoid it — private methods are implementation detail; testing them directly couples tests to internals and breaks on refactors. Instead, test the public method that uses them (the private method's correctness is proven indirectly). If a private method has complex logic worth testing independently, that's often a sign it should be extracted into its own class/public method.

**Code coverage**
- % of code lines/branches executed by tests. Useful as a signal for untested code, but a limited quality metric — 100% coverage doesn't mean the assertions are meaningful (a test can execute a line without actually verifying its behavior). Don't chase the number; use it to find gaps, not as the goal itself.

**Postman/Swagger for API testing [JD1]**
- Postman: collections of requests grouped by endpoint/flow, environments for switching between dev/staging/prod base URLs and secrets, and test scripts (JS assertions) run after each request (`pm.test(...)`, `pm.expect(...)`) — can be run in a CI pipeline via Newman for automated regression checks.
- Swagger/OpenAPI: auto-generated docs plus a "Try it out" UI for manual exploratory testing directly against the running API.

**JMeter / load testing [JD1]**
- JMeter simulates concurrent virtual users hitting endpoints to measure performance under load. Key metrics: response time (avg/p95/p99), throughput (requests/sec), error rate under load, and how these degrade as concurrent users increase — used to find the breaking point/bottleneck before it happens in production.

---

## 8. Client-Side: JavaScript / jQuery / Frameworks

**var vs let vs const**
- `var`: function-scoped, hoisted (accessible before declaration, as `undefined`), can be redeclared — source of classic bugs.
- `let`: block-scoped, not accessible before declaration ("temporal dead zone"), can be reassigned.
- `const`: block-scoped, must be initialized, can't be reassigned (but object/array contents can still be mutated).
- Default to `const`, use `let` when reassignment is needed, avoid `var`.

**Event loop**
- JS is single-threaded. Synchronous code runs on the call stack immediately. Async operations (timers, network calls, promises) are handed off to the browser/Node APIs; when done, their callbacks go into a queue (microtask queue for Promises, macrotask queue for setTimeout etc.) and the event loop pushes them onto the call stack only when it's empty — this is why `Promise.then` callbacks run before `setTimeout` callbacks even with a 0ms delay. `async/await` is syntactic sugar over Promises, making async code read like sync code.

**Event bubbling / delegation**
- Bubbling: an event fires on the target element, then "bubbles" up through its ancestors. Delegation: attach one listener on a parent instead of many on children, and use `event.target` to check what was actually clicked — jQuery's `.on(event, selector, handler)` uses this so listeners work even for elements added dynamically after page load.

**== vs ===**
- `==` compares with type coercion (`'5' == 5` is true). `===` compares strictly, no coercion (`'5' === 5` is false). Always prefer `===` to avoid surprising coercion bugs.

**AJAX [JD1]**
- Asynchronous JavaScript and XML — lets the browser send/receive data from the server without a full page reload. Under the hood: `XMLHttpRequest` (older) or `fetch()` (modern) opens an HTTP request, and a callback/Promise handles the response when it arrives, updating the DOM in place.

**Kendo UI / third-party JS integration [JD1]**
- Talk about a real challenge if you have one: e.g. version conflicts between Kendo's jQuery dependency and another library, styling/theming clashes with Bootstrap, binding Kendo grid data sources to a Web API endpoint with server-side paging/filtering, or handling Kendo's own event model alongside your app's state.

### Angular [JD3 — v16+]

**Architecture**
- Modules (`NgModule`, though standalone components reduce reliance on these in v16+) group related components/services. Components = UI + logic (template + class). Services = reusable business logic/data access, injected via DI. Directives = attach behavior to DOM elements (`*ngIf`, `*ngFor` are structural directives; `ngClass` is an attribute directive).

**Angular DI vs .NET DI**
- Conceptually identical — a hierarchical injector resolves dependencies via constructor injection, with lifetimes determined by where a provider is registered (root/module/component level ≈ .NET's Singleton/Scoped/Transient equivalents). Angular's injector is hierarchical per component tree, which is the main conceptual difference from ASP.NET Core's single container.

**Data binding**
- Interpolation: `{{ value }}` — one-way, component → view.
- Property binding: `[src]="imageUrl"` — one-way, component → DOM property.
- Event binding: `(click)="onClick()"` — view → component.
- Two-way: `[(ngModel)]="name"` — combines property + event binding, syncs both directions.

**Lifecycle hooks**
- `ngOnInit`: runs once after the component's inputs are set — main place to fetch initial data. `ngOnChanges`: runs whenever an `@Input()` value changes. `ngOnDestroy`: cleanup (unsubscribe from Observables, clear timers) before the component is removed — important to avoid memory leaks.

**Observables (RxJS) vs Promises**
- Promise: resolves once with a single value, eager (starts executing immediately on creation). Observable: can emit multiple values over time, lazy (doesn't run until subscribed), cancellable (`unsubscribe()`), and composable with operators (`map`, `filter`, `switchMap`, `debounceTime`) — much more powerful for things like HTTP calls with cancellation, or live streams of data (websockets, form value changes).

**Recent Angular changes (v16+)**
- Standalone components: components/directives/pipes that don't need to be declared in an `NgModule`, simplifying app structure. Signals (introduced in v16 as developer preview): a new reactive primitive (`signal()`, `computed()`) for fine-grained reactivity/change detection, an alternative to Zone.js-based change detection — moving Angular toward a model closer to what SolidJS/newer frameworks use. Good to at least name-drop these even briefly.

**State management**
- Simple cases: a shared service holding a `BehaviorSubject`, components subscribe to it. Complex apps: NgRx (Redux-pattern — store, actions, reducers, effects) for predictable state, time-travel debugging, and handling complex async flows.

**Route Guards**
- Interfaces (`CanActivate`, `CanDeactivate`, etc.) that control whether navigation to/from a route is allowed — e.g. `AuthGuard implements CanActivate` checks if the user is logged in and redirects to `/login` if not, registered on the route config.

### Vue.js [JD2]

**Reactivity system**
- Vue wraps data objects in a reactive proxy (Vue 3 uses ES6 `Proxy`; Vue 2 used `Object.defineProperty` getters/setters). When a reactive property is read during a component's render, Vue tracks that dependency; when the property changes, Vue knows exactly which components/watchers depend on it and re-renders only those — fine-grained, automatic dependency tracking rather than manual subscription.

**Options API vs Composition API**
- Options API: organize a component by option type (`data()`, `methods`, `computed`, `watch`) — simpler for small components, more structure out of the box.
- Composition API (`setup()` / `<script setup>`): organize by logical concern instead, using functions like `ref()`, `reactive()`, `computed()` — better for reusing logic across components (composables) and for large/complex components where Options API scatters related logic across sections.

**Directives**
- `v-if`/`v-else`: conditionally render (adds/removes from DOM). `v-for`: render a list from an array (`v-for="item in items"`, always pair with `:key`). `v-model`: two-way binding on form inputs. `v-bind` (`:attr`): bind an attribute/prop to a dynamic value.

**Component communication**
- Parent → child: props (`defineProps`). Child → parent: events (`emit('update', value)`, parent listens with `@update`). Distant/unrelated components: `provide`/`inject` for passing data down through the tree without prop-drilling, or a shared store (Pinia) for global state.

**Vuex/Pinia**
- Centralized state management, similar purpose to Redux/NgRx — a single source of truth for state shared across many components, with defined actions to mutate it predictably. Pinia is the modern replacement for Vuex (simpler API, better TypeScript support, no mutations boilerplate — state is changed directly through actions).

**Lifecycle hooks**
- `created`: instance initialized, reactive data set up, but not yet mounted to DOM. `mounted`: DOM is available — good for DOM manipulation or fetching data that populates the view. `updated`: after a reactive data change causes a re-render. `unmounted`: cleanup, similar to Angular's `ngOnDestroy`.

**Single File Components**
- `.vue` files combine `<template>` (HTML), `<script>` (component logic), and `<style>` (scoped or global CSS) in one file — keeps everything related to a component together instead of splitting across separate files.

**Integrating Vue with a .NET Core Web API**
- Configure CORS on the API to allow the Vue dev server's origin. Vue calls the API via `axios`/`fetch`, sending the JWT/auth token in the `Authorization` header (stored in memory or a secure cookie, not localStorage if avoidable due to XSS risk). Typically build Vue to static files and either serve them from `wwwroot` in the same app, or deploy separately with the API purely as a JSON backend (more common in modern setups).

### Node.js [JD1]

**Node in a .NET shop**
- Rarely the runtime app server in a .NET shop — mainly used for front-end tooling: build pipelines (Webpack/Vite bundling JS/CSS), package management (`npm`), running Angular CLI/Vue CLI dev servers, linting/testing JS. Sometimes used for a lightweight BFF (Backend-for-Frontend) layer or small automation/CLI scripts.

**npm / package.json**
- `package.json` lists dependencies (`dependencies` = runtime, `devDependencies` = build/test-only), scripts (`npm run build`, `npm start`), and metadata. `npm install` reads it and pulls packages into `node_modules`, locking exact resolved versions in `package-lock.json` for reproducible builds.

---

## 9. Version Control

**Git branching strategies**
- Git Flow: long-lived `develop` + `main`, feature branches off `develop`, release branches for stabilization, hotfix branches off `main` — heavier process, good for scheduled releases.
- Trunk-based: everyone commits to `main`/short-lived feature branches merged quickly, relies on feature flags for incomplete work — suits continuous deployment.
- Feature branching (GitHub flow): a branch per feature/fix, PR + review, merge to `main`, deploy from `main` — simpler, common with CI/CD.

**merge vs rebase**
- `merge`: combines histories with a merge commit, preserves exact history of both branches (non-destructive).
- `rebase`: replays your commits on top of the target branch, producing a linear history (rewrites commit hashes) — cleaner history but should be avoided on shared/pushed branches since it rewrites history others may depend on.

**Resolving merge conflicts**
- Git marks conflicting sections with `<<<<<<<`/`=======`/`>>>>>>>` markers in the file. Manually decide which changes to keep (or combine both), remove the markers, stage the file (`git add`), then continue the merge/rebase. For non-trivial conflicts, coordinate with whoever wrote the conflicting change rather than guessing intent.

**Centralized vs distributed VCS [JD1]**
- Centralized (SVN/TFS): single central repository, most operations require network access to it, linear/simpler history model. Distributed (Git): every clone is a full repository with complete history, most operations are local (fast, offline-capable), branching/merging is cheap and central to the workflow.

**PR review process**
- Talk through your actual experience: PR opened with a description linking a ticket, CI runs tests/lint automatically, at least one reviewer required before merge, review comments addressed via follow-up commits, squash or merge commit depending on team convention, deleted branch after merge.

---

## 10. Cloud — Azure [JD3]

**Azure App Service**
- PaaS for hosting web apps — you don't manage the underlying VM/OS. Deploy a .NET app via: Visual Studio publish, `az webapp deploy`, GitHub Actions/Azure DevOps pipeline (zip deploy or container), or CI/CD push-to-deploy from a connected repo. Supports deployment slots (staging vs production) for zero-downtime swaps.

**Azure Functions**
- Serverless compute — code runs in response to triggers (HTTP request, timer, queue message, blob upload) without managing a server; the Consumption plan scales automatically and you pay per execution. Function App vs regular Web App: Function Apps are event-driven and can scale to zero (no traffic = no cost, aside from cold-start latency); a Web App is always-on and billed for the reserved instance regardless of traffic. Use Functions for sporadic/event-driven workloads, App Service for always-on APIs with predictable load.

**Azure DevOps**
- Boards: work item tracking (sprints, backlogs, Kanban). Repos: Git hosting (alternative to GitHub). Pipelines: CI/CD (build, test, deploy — YAML or classic editor). Artifacts: package feed for NuGet/npm packages shared across projects.

**CI/CD pipeline**
- Describe a realistic one: commit triggers build stage (restore, build, run unit tests, publish artifact) → test stage (integration tests, maybe against a test DB) → deploy to a dev/staging environment automatically → manual approval gate → deploy to production (often via a deployment slot swap for zero downtime).

**GitHub Actions vs Azure DevOps Pipelines**
- Both are YAML-based CI/CD. GitHub Actions: workflows live in `.github/workflows/*.yml`, tightly integrated with GitHub repos/PRs, huge marketplace of community actions. Azure DevOps Pipelines: `azure-pipelines.yml`, deeper native integration with Azure resources and Azure Boards, historically stronger in enterprise/regulated environments. Functionally similar concepts: jobs, steps, triggers, secrets/variables, environments with approval gates.

**Secrets/config management**
- Azure Key Vault: centralized secure storage for secrets/certificates/keys, apps reference them at runtime (via Managed Identity, no credentials stored in code). Azure App Configuration: centralized app settings/feature flags across environments. Environment variables/App Service Application Settings: simplest option for per-environment config, injected at the platform level rather than baked into the deployed package.

**Scaling**
- Vertical (scale up): bigger VM/App Service Plan (more CPU/RAM) — simple but has a ceiling and usually requires downtime.
- Horizontal (scale out): more instances behind a load balancer — better for handling more concurrent load, no single point of failure. Auto-scale rules: define metrics (CPU %, request queue length, schedule) that automatically add/remove instances within min/max bounds.

**Docker/Kubernetes [Good to Have]**
- Even brief familiarity is fine to mention: Docker packages an app + its dependencies into a portable, consistent container image; Kubernetes orchestrates many containers across a cluster (scaling, self-healing, service discovery, rolling deployments). Azure equivalents: Azure Container Apps/AKS (managed Kubernetes).

**Event-driven / message queues [Good to Have]**
- Azure Service Bus: reliable message queuing/pub-sub for decoupling services (e.g. order service publishes "OrderPlaced", inventory service consumes it independently). Azure Event Grid: lightweight event routing for reactive, event-driven architectures (e.g. trigger a Function when a blob is uploaded). Useful for decoupling microservices and smoothing spiky load (queue absorbs bursts).

---

## 11. AI Productivity [Important for JD3]

**Using GitHub Copilot / AI coding assistants**
- Have one concrete example ready, e.g.: "I use Copilot for boilerplate — DTOs/mapping code, repetitive test setup (Arrange sections), regex patterns, and as a first draft for unit tests which I then review and adjust assertions for. It's also useful for quickly recalling API/syntax for a library I don't use often, saving a doc lookup."

**Risks of AI-generated code**
- Accuracy: can produce plausible-looking but subtly wrong logic (off-by-one, wrong edge case handling) — needs the same scrutiny as any code, arguably more since it "looks confident."
- Security: can suggest outdated/insecure patterns (e.g. string-concatenated SQL, weak crypto) if not explicitly guided — never accept security-sensitive code (auth, crypto, data access) without manual review.
- License/IP: generated code could closely resemble training data with licensing implications — be cautious with large verbatim-feeling blocks, especially in commercial codebases.
- Validation: run it through the same tests, code review, and static analysis as human-written code; never merge AI output you don't understand.

**Prompt engineering basics**
- Be specific about context (language/framework/existing code conventions), give examples of desired input/output, constrain scope (one function vs "build a feature"), iterate — refine the prompt based on what came back rather than accepting the first result, and ask the AI to explain its reasoning/edge cases when the logic is non-trivial.

**LLM/AI integration example**
- Describe the shape even for a small project: call an API (OpenAI/Azure OpenAI) with an HTTP client, send a system prompt + user input, get back a completion, parse/display the response, handle errors/timeouts and rate limits gracefully, and — important to mention — sanitize/validate before using the AI's output if it feeds into anything executable or is shown back to other users (avoid prompt injection risk if user input reaches the LLM and its output is trusted blindly downstream).

**Azure OpenAI vs OpenAI API**
- Same underlying models, but Azure OpenAI runs within your Azure tenant: data residency/compliance guarantees, integrates with Azure AD/RBAC, Private Link/VNet support, and enterprise SLAs — relevant for regulated industries like healthcare (mentioned in JD3) where data can't leave certain boundaries.

**Copilot pattern in your own app**
- Embedding AI as an assistive layer within an existing workflow (e.g. auto-suggesting a support ticket's category and draft response for an agent to approve/edit) rather than a standalone chatbot — keeps a human in the loop, augments rather than replaces the existing process.

---

## 12. Behavioral / Scenario Questions (STAR format)

Prepare 4-5 real stories and map them to these prompts — don't write brand new stories for each bullet, reuse strong ones across multiple questions.

- **Production issue under pressure**: Situation (what broke, impact), Task (your role), Action (how you isolated it — logs, recent deploys, rollback vs forward-fix decision), Result (resolution time, follow-up like a postmortem/monitoring added).
- **Disagreement with a lead/PM**: focus on how you presented your reasoning with data/trade-offs, stayed professional, and what the resolution/compromise was — avoid stories where you were simply "right" and they were "wrong"; show collaboration.
- **Most complex end-to-end feature**: walk client → API → DB, why you made key design choices (e.g. why a stored proc vs LINQ, why a particular caching strategy), and a trade-off you'd reconsider now.
- **Performance improvement**: concrete before/after numbers if you have them (e.g. "query went from 4s to 200ms by adding a covering index and removing a scalar UDF in the WHERE clause").
- **Code review approach**: giving — focus on the code not the person, explain "why" not just "change this", distinguish blocking issues from nitpicks. Receiving — treat it as improving the code, ask clarifying questions rather than getting defensive.
- **Learning a new technology fast**: if you don't know Vue/Angular v16/Azure deeply, tell an honest story of ramping up on something else quickly (approach: docs → small spike/prototype → pairing with someone experienced → shipping something small first).
- **Balancing new features vs production support [JD2]**: talk about triage (severity-based prioritization), time-boxing support vs dedicated feature time, and communicating trade-offs to stakeholders when both compete.
- **Agile/Scrum experience [JD2]**: your concrete role in standups (blockers/progress), sprint planning (estimation approach — story points/hours), retros (an example of a process change that came out of one).
- **Mentoring [JD1]**: a specific junior dev, what they struggled with, how you helped (pairing, code review comments, pointing to resources) without just doing it for them, and the outcome.
- **Security baked into development**: mention things like input validation/parameterized queries by default, dependency scanning, not committing secrets, following least-privilege for service accounts, and treating security issues found in review as blocking not optional.

---

## 13. Questions to Ask Them

Pick 3-4 depending on the role/interviewer, don't ask all of them:
- "What does the current tech stack modernization roadmap look like — are you migrating from .NET Framework to .NET Core/newer, or monolith to microservices?"
- "What's the team's actual split between new feature work and production support day to day?"
- "How is AI tooling like Copilot integrated into the workflow today — is it mandated, encouraged, or ad hoc?"
- "What does the on-call/production-support rotation look like?"
- "What's the deployment cadence and CI/CD maturity — how often do you ship to production?"

---

### Night-Before Priority Order (mirrors the questions file's self-assessment)
1. SOLID + one design pattern example each, out loud, from memory.
2. SQL injection prevention explanation (parameterized queries) + 2-3 query optimization talking points.
3. async/await purpose + the three DI lifetimes with a one-line reason for each.
4. One clear, specific Copilot/AI-in-your-workflow story (weighted heavily for JD3).
5. Pick one frontend framework to go slightly deeper on tonight — Angular (v16+, signals, standalone components) if leaning toward JD3, Vue (Composition API, Pinia) if leaning toward JD2.
6. Skim Azure App Service vs Functions distinction if interviewing for JD3.
