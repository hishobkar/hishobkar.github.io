# Interview Prep Guide — Full Stack .NET Developer (3 JDs Combined)

This covers all three JDs. Core .NET/SQL/testing questions apply to all three; sections are marked **[JD1]**, **[JD2]**, **[JD3]** where a topic is specific to one role.

---

## 1. C# Language Fundamentals (All JDs)
- What is the difference between `abstract class` and `interface`? When would you use each?
- What are the four pillars of OOP? Give a C# example of each.
- Explain SOLID principles with real examples from code you've written. **[JD3 - explicitly listed]**
- What's the difference between `struct` and `class`?
- Explain value types vs reference types. What happens when you pass each to a method?
- What is boxing/unboxing? Why is it expensive?
- Explain `virtual`, `override`, `new`, and `sealed` keywords.
- What are delegates? What's the difference between `Action`, `Func`, and `Predicate`?
- What are events, and how do they differ from delegates?
- Explain `async`/`await`. What problem does it solve? What is a deadlock in async code and how do you avoid it (e.g., `ConfigureAwait(false)`)?
- Difference between `Task` and `Thread`. When do you use `Task.Run` vs `async` I/O?
- What is garbage collection in .NET? What are generations (Gen 0/1/2)?
- What's the difference between `IEnumerable`, `IQueryable`, `ICollection`, and `IList`?
- Explain exception handling best practices — custom exceptions, `finally`, when NOT to catch generic `Exception`.
- What are extension methods? Write one.
- What is dependency injection? What are the three DI lifetimes in .NET Core (Transient, Scoped, Singleton) and when do you use each?
- Explain the difference between `.NET Framework` and `.NET Core` / `.NET 6+`.

## 2. Design Patterns (All JDs, esp. **[JD3]**)
- Explain Repository pattern and Unit of Work — why use them?
- Explain Singleton pattern — how is it implemented and why is it risky in multi-threaded apps?
- Explain Factory / Abstract Factory pattern.
- What is the Dependency Inversion Principle vs Dependency Injection (they're different things — know the distinction)?
- Explain the Strategy pattern and where you might use it in a real app.
- What's the difference between Adapter and Decorator patterns?

## 3. ASP.NET Core / MVC / Web API (All JDs)
- Explain the MVC request lifecycle.
- What is Middleware? Explain the request pipeline and `app.Use...` ordering.
- Difference between MVC and Web API (in modern .NET Core they're unified — explain how).
- What are Filters (Action, Authorization, Exception, Result filters)?
- How do you version a Web API?
- What is Model Binding and Model Validation? How do Data Annotations work?
- Explain routing — attribute routing vs conventional routing.
- How do you implement authentication/authorization (JWT, OAuth, Identity)?
- What is CORS and how do you configure it?
- REST principles — what makes an API RESTful? HTTP verbs and correct status codes (200, 201, 204, 400, 401, 403, 404, 500).
- Difference between REST and SOAP; when would you still use SOAP? **[JD1]**
- What is Swagger/OpenAPI and how have you used it for documentation/testing? **[JD1]**
- How do you handle API rate limiting, caching, and pagination?
- What is a Microservice? How does it differ from a monolith? **[JD3]**
- How do microservices communicate (REST, gRPC, message queues)? What is the concept of an API Gateway? **[JD3]**
- How do you handle distributed transactions / data consistency across microservices (Saga pattern, eventual consistency)? **[JD3]**

## 4. LINQ (All JDs)
- Difference between LINQ to Objects, LINQ to SQL, and Entity Framework LINQ.
- Explain deferred execution vs immediate execution (`.ToList()`, `.Count()`, etc.).
- Write a LINQ query to group, join, and aggregate data (be ready to write on a whiteboard/shared editor).
- Difference between `Select` and `SelectMany`.
- Difference between `First()`, `FirstOrDefault()`, `Single()`, `SingleOrDefault()`.
- What is the N+1 query problem and how do you avoid it in EF (`.Include()`)?

## 5. Entity Framework (Core) **[JD2, JD3]**
- Code-first vs Database-first approach — pros/cons.
- What are migrations? How do you handle them in a team environment?
- Explain change tracking and `DbContext` lifetime — why is `DbContext` typically scoped per request?
- How do you optimize EF queries (AsNoTracking, projection, avoiding lazy loading pitfalls)?
- Explain lazy loading vs eager loading vs explicit loading.
- How do you handle concurrency conflicts in EF (optimistic concurrency)?

## 6. SQL Server / Database (All JDs — heavy focus **[JD1]**)
- Difference between `WHERE` and `HAVING`.
- Explain the types of SQL joins (INNER, LEFT, RIGHT, FULL, CROSS, SELF).
- Difference between clustered and non-clustered indexes. How do indexes affect read vs write performance?
- What is a stored procedure vs a function? When would you choose one over the other?
- What are views, and what are their limitations?
- What is a CTE (Common Table Expression)? When would you use it vs a subquery vs a temp table?
- Explain query execution plans — how do you read one and identify a bottleneck?
- What is dynamic SQL, and what are the risks of using it? (leads into SQL injection)
- How do you prevent SQL Injection? (parameterized queries, stored procs, ORM, input validation) — **be ready to explain in detail, it's explicitly listed**
- What is Cross-Site Scripting (XSS)? How do you prevent it on the client and server side?
- What is CSRF and how is it mitigated (anti-forgery tokens)?
- Explain transactions and ACID properties. What are isolation levels (Read Committed, Repeatable Read, Serializable)?
- What are triggers and when should you avoid them?
- How do you optimize a slow-running query (indexing, avoiding SELECT *, avoiding cursors, statistics)?
- Difference between `DELETE`, `TRUNCATE`, and `DROP`.
- What is normalization? Explain 1NF/2NF/3NF and when you might denormalize for performance.

## 7. Testing (All JDs)
- Difference between unit testing, integration testing, and end-to-end testing.
- Explain xUnit/NUnit basics — `[Fact]` vs `[Theory]` (xUnit), `[Test]`/`[TestCase]` (NUnit).
- What is mocking? How have you used Moq — mocking a repository or service dependency?
- What is Test-Driven Development (TDD)? Have you practiced it?
- How do you structure a good unit test (Arrange-Act-Assert)?
- How do you test private methods, or do you avoid it and why?
- What is code coverage, and what are its limitations as a quality metric?
- How have you used Postman/Swagger to test APIs — collections, environments, automated test scripts? **[JD1]**
- Have you used JMeter or similar for load/performance testing? What metrics did you look at? **[JD1]**

## 8. Client-Side: JavaScript / jQuery / Frameworks (All JDs)
- Explain `var` vs `let` vs `const` and scoping differences.
- What is the event loop in JavaScript? Explain synchronous vs asynchronous code, callbacks, Promises, `async/await`.
- What is event bubbling/delegation? How does jQuery's `.on()` leverage delegation?
- Difference between `==` and `===`.
- What is AJAX and how does it work under the hood (XHR/fetch)? **[JD1]**
- Have you integrated third-party JS libraries like Kendo UI — what challenges came up? **[JD1]**

### Angular **[JD3 — v16+ specifically]**
- Explain Angular architecture: modules, components, services, directives.
- What is dependency injection in Angular, and how does it differ conceptually from .NET DI?
- Explain data binding types: interpolation, property binding, event binding, two-way binding (`[(ngModel)]`).
- What are Angular lifecycle hooks (`ngOnInit`, `ngOnChanges`, `ngOnDestroy`)?
- What are Observables (RxJS) vs Promises?
- What's new/changed in recent Angular versions (standalone components, signals — v16+ introduced signals)? Be ready to say what you know here even briefly.
- How do you handle state management (services with RxJS, or NgRx)?
- What is a Route Guard, and how do you protect routes?

### Vue.js **[JD2 — specific to this role]**
- Explain Vue's reactivity system — how does it track dependencies and re-render?
- Difference between Options API and Composition API.
- What are Vue directives (`v-if`, `v-for`, `v-model`, `v-bind`)?
- How do components communicate (props down, events up; provide/inject)?
- What is Vuex or Pinia used for (state management)?
- Explain Vue lifecycle hooks (`created`, `mounted`, `updated`, `unmounted`).
- Single File Components (.vue files) — structure of `<template>`, `<script>`, `<style>`.
- How would you integrate a Vue front-end with a .NET Core Web API backend (CORS, auth tokens, API calls via axios/fetch)?

### Node.js **[JD1 mentions it]**
- What is Node.js used for in a primarily .NET shop (tooling, build scripts, BFF layer)?
- Basic understanding of npm, package.json, and how a JS build pipeline works.

## 9. Version Control (All JDs)
- Explain Git branching strategies you've used (Git Flow, trunk-based, feature branches).
- Difference between `git merge` and `git rebase`.
- How do you resolve merge conflicts?
- Difference between centralized (SVN/TFS) and distributed (Git) version control. **[JD1]**
- What is a pull request review process like on your team?

## 10. Cloud — Azure **[JD3]**
- What is Azure App Service, and how do you deploy a .NET app to it?
- What are Azure Functions? Difference between a Function App and a regular Web App (serverless vs always-on, triggers/bindings).
- What is Azure DevOps used for (Boards, Repos, Pipelines, Artifacts)?
- Explain a CI/CD pipeline you've built or used — build stage, test stage, deployment stage, approvals/gates.
- Difference between GitHub Actions and Azure DevOps Pipelines (YAML-based workflows in both — know basic syntax concepts).
- How do you manage secrets/configuration across environments (App Configuration, Key Vault, environment variables)?
- Basic understanding of scaling (vertical vs horizontal, auto-scale rules).
- Any exposure to containers/Docker or Kubernetes? (listed as "Good to Have") **[JD3]**
- Any exposure to event-driven architecture or message queues (Service Bus, Event Grid)? (Good to Have) **[JD3]**

## 11. AI Productivity — Important for JD3 specifically
- How have you used GitHub Copilot or similar AI coding assistants in your daily work? Give a concrete example (e.g., generating boilerplate, writing unit tests, refactoring).
- What are the risks of over-relying on AI-generated code (accuracy, security vulnerabilities, license/IP concerns)? How do you validate AI output before committing it?
- Basic understanding of prompt engineering — what makes a good prompt when asking an AI tool to generate or debug code (being specific, providing context/examples, iterating)?
- Have you integrated an LLM/AI service into an application (calling OpenAI/Azure OpenAI API, building a chatbot, workflow automation)? Even a small personal project counts — be ready to describe the architecture (API call, prompt, handling response, error handling).
- What is Azure OpenAI, and how does it differ from calling OpenAI's API directly (data residency, enterprise controls)? Good to Have, but worth a one-line answer.
- Any familiarity with the concept of a "copilot" pattern in your own app — i.e., embedding AI assistance into a workflow rather than just chat?

## 12. Behavioral / Scenario Questions (All JDs — prepare STAR-format stories)
- Tell me about a time you had to debug a production issue under pressure. What was your process?
- Describe a time you disagreed with a team lead or product manager on a technical approach — how did you resolve it?
- Tell me about the most complex feature you've built end-to-end (client + server + DB) — walk through your design decisions.
- Describe a time you improved performance of a slow application or query. What was the before/after?
- How do you approach code reviews — both giving and receiving feedback?
- Tell me about a time you had to learn a new technology quickly for a project (relevant here: if you don't know Vue/Angular v16/Azure deeply, have an honest story about ramping up fast on something else).
- How do you balance new feature development with production support/on-call work? **[JD2 explicitly mentions this]**
- Describe your experience working in an Agile/Scrum team — your role in standups, sprint planning, retros. **[JD2]**
- Tell me about a time you mentored or guided a junior developer. **[JD1 — "work independently and guide others"]**
- How do you ensure security is baked into your development process (not an afterthought)?

## 13. Questions YOU Should Ask Them
- What does the current tech stack modernization roadmap look like (e.g., .NET Framework → .NET Core migration, monolith → microservices)?
- What's the team's split between new feature work and production support?
- How is AI tooling (Copilot etc.) actually integrated into the team's workflow today — is it mandated, encouraged, ad hoc?
- What does the on-call/production-support rotation look like?
- What's the deployment cadence and CI/CD maturity — how often do you ship to prod?

---

### Quick Self-Assessment Before Tomorrow
Given "limited knowledge" was assumed, prioritize refreshing in this order:
1. SOLID principles + one design pattern example each (highest ROI, asked everywhere)
2. SQL injection prevention + basic query optimization talking points
3. async/await and DI lifetimes in .NET Core
4. One clear story of using Copilot/AI tools in real work (JD3 weights this heavily)
5. Whichever frontend framework matches the role you're most excited about (Angular for JD3, Vue for JD2) — just enough to not go blank
6. Skim Azure App Service/Functions basics if interviewing for JD3
