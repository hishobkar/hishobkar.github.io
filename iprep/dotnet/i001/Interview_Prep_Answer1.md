# Interview Prep — Extended Topics (Modern .NET Ecosystem)

The 3 JDs in `prompt.md` explicitly name Azure, microservices, Angular/Vue, and AI tooling. But interviewers for a "5-10 years, full stack .NET" role commonly probe adjacent tech that's now standard in the ecosystem even when not spelled out in the JD — multi-cloud awareness (AWS), messaging, caching, containers, resiliency, observability, and architecture patterns (CQRS/Clean Architecture). This file covers the gap: questions likely to come up that `Interview_Prep_Questions.md` doesn't already handle, with answers in the same interview-ready style.

---

## 1. AWS — in case the interviewer probes beyond Azure

Even JD3 (Azure-focused) may ask "have you used any other cloud?" to gauge general cloud literacy — a lot of .NET shops run on AWS too.

**What's your AWS equivalent knowledge of Azure services?**
- Compute: Azure App Service ≈ AWS Elastic Beanstalk; Azure Functions ≈ AWS Lambda; Azure VMs ≈ EC2.
- Containers: AKS ≈ EKS; Azure Container Apps ≈ ECS/Fargate.
- Storage: Blob Storage ≈ S3; Azure Files ≈ EFS.
- Database: Azure SQL ≈ RDS; Cosmos DB ≈ DynamoDB.
- Messaging: Service Bus ≈ SQS/SNS; Event Grid ≈ EventBridge.
- IAM: Azure AD/Entra ID ≈ AWS IAM.
- Secrets: Key Vault ≈ AWS Secrets Manager/Parameter Store.
- Framing this as a comparison table shows cloud-agnostic thinking even if your hands-on experience is Azure-only — say so honestly: "My production experience is Azure, but the concepts map directly to AWS — same patterns, different service names."

**Can .NET run on AWS well?**
- Yes — .NET is cross-platform since .NET Core; AWS has first-class SDKs (`AWSSDK.*` NuGet packages), and AWS Toolkit for Visual Studio supports deploying to Lambda, Elastic Beanstalk, ECS directly. Lambda supports .NET runtimes natively (custom runtime or managed).

**Lambda vs Azure Functions**
- Same serverless concept: pay-per-execution, auto-scaling, event-triggered (S3 upload, SQS message, API Gateway request vs Blob upload, Queue message, HTTP trigger). Main practical differences are ecosystem integration (Lambda + API Gateway + DynamoDB is the classic AWS serverless stack) and cold-start characteristics, which are broadly comparable.

---

## 2. Microservices — deeper patterns beyond the JD3 basics

**API Gateway implementations in .NET**
- **YARP** (Yet Another Reverse Proxy) — Microsoft's own reverse proxy toolkit, lightweight, code-first configuration, increasingly the default choice for .NET-native gateways.
- **Ocelot** — older, popular open-source .NET API Gateway, config-driven (JSON), supports routing, aggregation, rate limiting, auth.
- **Azure API Management (APIM)** — managed PaaS gateway: policies (transform, rate-limit, cache), developer portal, subscription keys — used when you want the gateway as infrastructure rather than code you maintain.

**Service discovery**
- In Kubernetes, service discovery is largely solved by DNS (a `Service` object gives a stable name that resolves to healthy pod IPs) — you typically don't need a separate discovery tool. Outside K8s, options include Consul or Azure's built-in App Service/Container Apps internal DNS. Worth naming even briefly to show awareness that "how do services find each other" is a real problem microservices architectures must solve.

**Resiliency — Polly**
```csharp
var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(3, retry => TimeSpan.FromSeconds(Math.Pow(2, retry)));

var circuitBreaker = Policy
    .Handle<HttpRequestException>()
    .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));
```
- Polly is the standard .NET resiliency library, integrates with `HttpClientFactory` (`AddPolicyHandler`). Key patterns to know:
  - **Retry** (with exponential backoff) — for transient failures.
  - **Circuit Breaker** — stops calling a failing downstream service for a cooldown period instead of hammering it further, giving it time to recover.
  - **Timeout** — bounds how long you'll wait for a call.
  - **Bulkhead isolation** — limits concurrent calls to a dependency so one slow downstream service can't exhaust all threads/connections and take down the whole app.
- .NET 8 also ships a built-in resilience library (`Microsoft.Extensions.Http.Resilience`) built on Polly v8 — worth mentioning if targeting recent .NET.

**Health checks**
- `AddHealthChecks()` / `MapHealthChecks("/health")` exposes an endpoint Kubernetes or a load balancer polls to know if an instance is alive (liveness) and ready to receive traffic (readiness) — unhealthy instances get removed from rotation automatically. Can check DB connectivity, downstream dependencies, disk space, etc.

**Idempotency in microservices**
- Since network calls can be retried (by clients, by resiliency policies, by message brokers redelivering), handlers must be safe to process the same request/message twice without side effects — e.g. using an idempotency key on payment requests, or checking "have I already processed message ID X" before applying it (common with at-least-once delivery queues).

---

## 3. Messaging / Event-Driven Architecture

**RabbitMQ vs Kafka vs Azure Service Bus**
- **RabbitMQ**: traditional message broker, smart broker/dumb consumer, good for complex routing (exchanges — direct, topic, fanout), task queues, RPC-style messaging.
- **Kafka**: distributed log/streaming platform, built for high-throughput event streaming, consumers can replay history (messages aren't deleted on consume, retained per a policy), better suited for event sourcing, analytics pipelines, and very high volume.
- **Azure Service Bus**: managed PaaS equivalent to RabbitMQ's use case (queues + topics/subscriptions for pub-sub), enterprise features (sessions, dead-lettering, duplicate detection) with no infrastructure to manage.
- Choosing between them: Service Bus/RabbitMQ for reliable task/command processing between services; Kafka when you need a durable, replayable event log at scale (e.g. audit trail, multiple independent consumers reading the same stream at their own pace).

**Pub/Sub vs point-to-point queue**
- Queue (point-to-point): one message, consumed by exactly one consumer — good for distributing work across workers.
- Pub/Sub (topic/subscription): one message published, delivered to every subscriber — good for broadcasting an event (e.g. "OrderPlaced") to multiple independent services that each need to react (billing, inventory, notifications) without the publisher knowing who's listening.

**At-least-once vs exactly-once delivery**
- Most brokers guarantee at-least-once delivery (a message might be redelivered after a crash before acknowledgment) — this is why idempotent consumers matter. True exactly-once is hard/expensive; most systems achieve it in effect via idempotency rather than the broker itself guaranteeing it.

**Dead-letter queues**
- Messages that repeatedly fail processing (poison messages) get moved to a separate dead-letter queue after N retries instead of blocking the main queue forever — lets you inspect/reprocess failures without losing them or stalling healthy traffic.

**Event-driven architecture — event notification vs event carried state transfer**
- Event notification: a small event ("OrderPlaced", order ID only) tells subscribers something happened; they call back to fetch full details if needed — keeps events small but adds coupling/latency to fetch details.
- Event-carried state transfer: the event itself carries the full data subscribers need, so they don't have to call back — more decoupled/resilient (works even if the publisher is down later) but events can get large and schema changes need more care.

---

## 4. Caching

**Redis in .NET**
- Distributed cache used across multiple app instances (unlike `IMemoryCache`, which is per-instance and lost on restart/doesn't work correctly behind a load balancer with multiple servers). Registered via `AddStackExchangeRedisCache()`, accessed through `IDistributedCache`, or directly via `StackExchange.Redis` for advanced scenarios (pub/sub, sorted sets, distributed locks).

**Cache-aside pattern**
```csharp
var cached = await cache.GetStringAsync(key);
if (cached is not null) return Deserialize(cached);

var data = await db.GetDataAsync();
await cache.SetStringAsync(key, Serialize(data), new DistributedCacheEntryOptions
{
    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
});
return data;
```
- Application checks cache first; on miss, loads from the source of truth (DB) and populates the cache. Most common caching pattern — simple, and the cache can be empty/cold without breaking correctness.

**Cache invalidation strategies**
- TTL/expiration (simplest — accept some staleness). Write-through (update cache and DB together on every write). Explicit invalidation (delete/update the cache key when the underlying data changes) — the hardest of "the two hard problems in computer science." Interviewers like hearing you understand the trade-off between staleness and complexity, not just "use Redis."

**Output/response caching in ASP.NET Core**
- `[ResponseCache]` or the newer Output Caching middleware (.NET 7+) caches whole HTTP responses server-side (or instructs the client/CDN via headers) for endpoints where the same response is served repeatedly — reduces load for expensive, infrequently-changing GET endpoints.

---

## 5. Containers & Orchestration

**Docker basics**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "MyApi.dll"]
```
- Multi-stage build: build stage has the full SDK (large), final image only has the runtime + published output (small) — keeps production images lean. Image = immutable blueprint; container = a running instance of that image.

**Why containers over VMs**
- Containers share the host OS kernel (lightweight, start in seconds, smaller footprint) vs VMs which virtualize the whole OS (heavier, slower to start). Containers guarantee "works on my machine" consistency across dev/test/prod since the runtime + dependencies ship inside the image.

**Kubernetes core concepts**
- **Pod**: smallest deployable unit, one or more tightly-coupled containers.
- **Deployment**: manages a set of pod replicas, handles rolling updates/rollbacks.
- **Service**: stable network endpoint/DNS name that load-balances across healthy pods.
- **Ingress**: routes external HTTP(S) traffic into services, often with TLS termination.
- **ConfigMap/Secret**: externalize configuration/secrets from the container image.
- **Namespace**: logical isolation boundary (e.g. dev/staging/prod within one cluster).
- Self-healing: if a pod crashes or fails its health check, Kubernetes automatically restarts/reschedules it — this is the main operational value over manually managed containers.

**Rolling deployment / blue-green / canary**
- **Rolling**: gradually replace old pods with new ones, a few at a time — default K8s Deployment behavior, zero downtime if health checks are correct.
- **Blue-green**: run the new version fully alongside the old, then switch traffic all at once (via load balancer/slot swap) — instant rollback by switching back.
- **Canary**: route a small % of traffic to the new version first, monitor for errors, then gradually increase — limits blast radius of a bad deploy.

---

## 6. Architecture Patterns — CQRS, Clean Architecture, DDD

**CQRS (Command Query Responsibility Segregation)**
- Separates the write model (commands — `PlaceOrderCommand`) from the read model (queries — `GetOrderSummaryQuery`), often with different data models/even different data stores optimized for each. In .NET, commonly implemented with **MediatR**: controllers send a command/query object through `IMediator.Send()`, which routes it to a single handler — decouples the controller from the business logic implementation and keeps each handler focused on one operation.
- Not always needed — good for complex domains with very different read/write shapes or performance needs; overkill for simple CRUD (be ready to say when you *wouldn't* use it, shows judgment).

**Clean Architecture / Onion Architecture**
- Concentric layers: Domain (entities, business rules, no dependencies on anything) at the center → Application (use cases, interfaces like `IOrderRepository`) → Infrastructure (EF Core, external APIs — implements the interfaces) → Presentation (API controllers). Dependencies point inward only — infrastructure depends on abstractions defined in the domain/application layer, not the other way around (this is Dependency Inversion applied at the architecture level). Benefit: business logic is testable and framework-agnostic; you could swap EF Core for Dapper without touching domain logic.

**Domain-Driven Design (DDD) — just the vocabulary**
- **Entity**: has identity that persists over time (e.g. `Order` with an ID).
- **Value Object**: defined by its values, no identity (e.g. `Address`, `Money`) — immutable, comparable by value.
- **Aggregate/Aggregate Root**: a cluster of entities/value objects treated as a consistency boundary — you only load/save the aggregate root, and it enforces invariants for everything inside it (e.g. `Order` is the root, `OrderLine` items are only modified through it).
- **Bounded Context**: a boundary within which a domain model is consistent/unambiguous — the word "Customer" might mean something different in the Billing context vs the Support context; DDD says that's fine as long as each context has its own clear model.
- Even a surface-level answer here signals architectural maturity beyond CRUD.

---

## 7. gRPC & GraphQL

**gRPC**
- RPC framework using Protocol Buffers (binary serialization, much smaller/faster than JSON) over HTTP/2 (multiplexed streams, header compression). Supports four call types: unary (request/response), server streaming, client streaming, bidirectional streaming. Best for internal service-to-service calls where performance matters and both ends are typically your own services (strongly-typed contract via `.proto` files, code-generated clients/servers). Less suited for public-facing APIs consumed by browsers directly (limited browser support without a proxy like grpc-web).

**GraphQL**
- Client specifies exactly what fields it needs in a single query, avoiding both over-fetching (REST returning a whole object when you need 2 fields) and under-fetching (needing multiple round-trips to assemble related data). One endpoint (`/graphql`) instead of many REST routes; schema is strongly typed. Trade-offs: more complex server implementation (resolvers, N+1 query risk requiring DataLoader-style batching), harder to cache with standard HTTP caching (since it's typically POST-based), steeper learning curve for the team. .NET libraries: Hot Chocolate is the current standard.
- When asked "REST vs GraphQL vs gRPC" — REST for public/simple APIs and broad compatibility, GraphQL when clients have very different/flexible data needs (e.g. mobile vs web needing different field sets), gRPC for high-performance internal service-to-service calls.

---

## 8. Real-Time & UI Extras

**SignalR**
- ASP.NET Core library for real-time bidirectional communication between server and client (WebSockets, with automatic fallback to Server-Sent Events/long polling if WebSockets aren't available). Used for live features: chat, live notifications, dashboards updating in real time, collaborative editing indicators. Server pushes to clients via a `Hub` (`await Clients.All.SendAsync("ReceiveMessage", msg)`) — inverts the normal request/response model.

**Blazor** (worth a one-liner even if not in any of the 3 JDs — shows current .NET awareness)
- Lets you write client-side interactive UI in C# instead of JavaScript. **Blazor Server**: UI logic runs on the server, UI updates pushed to the browser over a SignalR connection (small payload, but needs a constant connection and has latency per interaction). **Blazor WebAssembly**: the whole app + a WASM-compiled .NET runtime downloads and runs entirely in the browser (larger initial download, but works offline/no server round-trip per interaction). **Blazor United/Auto** (.NET 8+): can switch between render modes per component.

---

## 9. Observability — Logging, Metrics, Tracing

**Structured logging — Serilog**
- Logs as structured data (key-value properties), not just strings — enables querying/filtering in log aggregation tools (`logger.LogInformation("Order {OrderId} placed by {UserId}", orderId, userId)` rather than string concatenation). Serilog is the most common structured logging library in .NET, with "sinks" to route logs to files, Seq, Elasticsearch, Application Insights, etc.

**The three pillars of observability**
- **Logs**: discrete events with context (what happened).
- **Metrics**: aggregated numeric measurements over time (request rate, error rate, latency percentiles — the "RED" or "USE" method).
- **Traces**: follow a single request as it flows across multiple services (essential in microservices to see where time was spent/where it failed across service boundaries) — each service adds a "span" to the trace.
- **OpenTelemetry**: the emerging vendor-neutral standard in .NET for emitting all three, exportable to any backend (Application Insights, Jaeger, Prometheus/Grafana, Datadog) without vendor lock-in — increasingly the default over provider-specific SDKs.

**Application Insights**
- Azure's APM (Application Performance Monitoring) service: auto-instruments ASP.NET Core apps for request/dependency tracking, exceptions, custom events/metrics, live metrics stream, and distributed tracing across Azure services — the "if interviewing for JD3, know this by name" answer for "how would you monitor a .NET app in Azure."

**ELK / Grafana+Prometheus stack**
- ELK (Elasticsearch, Logstash, Kibana): centralized log aggregation and search/visualization — logs shipped from all service instances into one searchable place instead of SSH-ing into individual servers.
- Prometheus (metrics collection, pull-based scraping) + Grafana (dashboards/alerting on top) — the standard open-source metrics/monitoring pairing, especially common alongside Kubernetes.

---

## 10. Identity / Auth — going deeper than "JWT exists"

**OAuth2 grant types**
- **Authorization Code (+ PKCE)**: standard for web/mobile apps with a login redirect — the recommended flow today, PKCE added to protect public clients (SPAs, mobile) that can't securely store a client secret.
- **Client Credentials**: service-to-service, no user involved — a service authenticates as itself using a client ID/secret to get a token.
- **Refresh Token**: used to get a new access token without forcing the user to log in again, once the short-lived access token expires.
- (Implicit flow is now considered legacy/discouraged — worth knowing it existed but that Auth Code + PKCE replaced it.)

**OAuth2 vs OpenID Connect (OIDC)**
- OAuth2 is about **authorization** (delegated access — "can this app act on my behalf for X"). OIDC is a thin identity layer on top of OAuth2 that adds **authentication** — the ID token (a JWT with user identity claims), giving you "who is this user," not just "what can this app access."

**IdentityServer / Duende / Azure AD B2C**
- Options for centralizing authentication instead of hand-rolling it: **Duende IdentityServer** (commercial successor to the open-source IdentityServer4) implements OAuth2/OIDC as a standalone identity provider you host; **Azure AD B2C** is a managed customer-identity service (social logins, custom policies) so you don't run your own STS; ASP.NET Core Identity is for simpler cases where you just need username/password + roles within your own app's database.

**Managed Identity (Azure)**
- Lets an Azure resource (App Service, Function) authenticate to other Azure services (Key Vault, SQL, Storage) without storing any credentials/connection secrets at all — Azure AD issues short-lived tokens automatically behind the scenes. The recommended way to access Key Vault from a .NET app in Azure instead of a stored client secret.

---

## 11. NoSQL / Polyglot Persistence

**When would you reach for NoSQL over SQL Server?**
- High-volume, flexible/evolving schema data (e.g. product catalogs with wildly different attributes per category), extreme horizontal scale needs, document-shaped data that doesn't map well to relational tables, or key-value lookup patterns (session state, caching). SQL Server/relational still wins for strong consistency, complex joins/transactions, and well-understood tooling.

**Cosmos DB**
- Azure's globally-distributed, multi-model NoSQL database (document/SQL API most common in .NET via the `Microsoft.Azure.Cosmos` SDK). Key selling points: single-digit millisecond latency at scale, tunable consistency levels (from Strong to Eventual, 5 levels total — trade-off between consistency and latency/availability), automatic global replication across regions.

---

## 12. Infrastructure as Code & Deployment Extras

**IaC — Terraform / Bicep / ARM templates**
- Define infrastructure (App Services, databases, networking) as version-controlled code instead of manually clicking through the portal — repeatable, reviewable in PRs, environment-consistent (dev/staging/prod created from the same definitions). ARM templates are Azure's native JSON format; Bicep is Microsoft's newer, cleaner DSL that compiles to ARM; Terraform is cloud-agnostic (HashiCorp), useful if the org runs multi-cloud.

**Feature flags / feature management**
- Ship code to production behind a flag, then turn the feature on for specific users/percentages without a redeploy — decouples deployment from release, enables trunk-based development (merge incomplete features safely), and supports A/B testing/canary rollouts. .NET has `Microsoft.FeatureManagement`; Azure App Configuration has built-in feature flag support.

---

### How to use this file in the interview
These are **secondary-depth** topics — you're not expected to whiteboard Kubernetes YAML, but naming the right pattern/tool and giving one sentence of "why" signals current, practical experience beyond the JD's explicit list. If a question here comes up and you genuinely haven't used the tech, say so plainly and pivot to the closest thing you *have* used (e.g. "I haven't used Kafka directly, but I've used Azure Service Bus for the same pub-sub problem — conceptually similar, topics and subscriptions instead of partitions and consumer groups").
