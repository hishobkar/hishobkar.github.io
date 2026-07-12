# Extended .NET Ecosystem Cheat Sheet — Quick-Recall Edition
*Condensed from `Interview_Prep_Answer1.md`. Mnemonics in 🧠, gotchas in ⚠️.*

---

## 1. AWS ↔ Azure Mapping

| Category | Azure | AWS |
|---|---|---|
| Compute (PaaS/serverless/VM) | App Service / Functions / VMs | Elastic Beanstalk / Lambda / EC2 |
| Containers | AKS / Container Apps | EKS / ECS-Fargate |
| Storage | Blob Storage / Files | S3 / EFS |
| Database | Azure SQL / Cosmos DB | RDS / DynamoDB |
| Messaging | Service Bus / Event Grid | SQS+SNS / EventBridge |
| IAM | Entra ID (Azure AD) | IAM |
| Secrets | Key Vault | Secrets Manager / Parameter Store |

**Key talking point:** cloud knowledge should be conceptual (maps across vendors), not "memorized the Azure portal." .NET runs natively on Lambda too (`AWSSDK.*`).

---

## 2. Microservices — Deeper Patterns

| Topic | Key facts |
|---|---|
| API Gateways in .NET | **YARP** (code-first, MS-native) · **Ocelot** (config/JSON-driven) · **Azure APIM** (managed PaaS) |
| Service discovery | Solved by DNS in Kubernetes (Service object → stable name → healthy pod IPs) |
| 🧠 Polly resiliency patterns | **Retry** (w/ exponential backoff + jitter, avoids retry storms) · **Circuit Breaker** (fail fast during cooldown after N failures) · **Timeout** (bounds wait) · **Bulkhead** (isolates concurrent calls so one slow dependency can't exhaust all threads) |
| Health checks | Liveness = "is the process up" (cheap, restarts pod if failed). Readiness = "can it serve traffic" (checks dependencies, just pulls from LB rotation if failed). ⚠️ Checking DB in liveness causes restart loops during transient DB blips. |
| Idempotency | Handlers must be safe to process the same message twice (retries/at-least-once delivery) — use an idempotency key, check "already processed?" before applying. |

---

## 3. Messaging / Event-Driven

| Topic | Key facts |
|---|---|
| RabbitMQ vs Kafka vs Service Bus | RabbitMQ = smart broker, complex routing, task queues. Kafka = distributed log, replayable, high-throughput streaming/event sourcing. Service Bus = managed PaaS, queues+topics, enterprise features (dead-lettering, dup detection). |
| Queue vs Pub/Sub | Queue = one message → one consumer (work distribution). Pub/Sub = one message → every subscriber (broadcast). |
| Delivery guarantee | Most brokers = at-least-once (redelivery possible after a crash before ack). True exactly-once achieved via **idempotent consumers**, not the broker itself. |
| Dead-letter queue | Poison messages moved aside after N failed attempts so they don't block the whole queue. |
| Event notification vs event-carried state transfer | Notification = small event, subscriber calls back for details (coupling+latency). Carried state = full data in the event (more decoupled/resilient, but schema versioning discipline needed). |

---

## 4. Caching

| Topic | Key facts |
|---|---|
| Redis vs IMemoryCache | `IMemoryCache` = per-instance, inconsistent across load-balanced instances. Redis (`IDistributedCache`) = shared across all instances. |
| Cache-aside pattern | Check cache → miss → load from DB → populate cache. ⚠️ Guard against cache outage (catch `RedisConnectionException`, fall through to DB, don't crash the app). |
| Invalidation strategies | TTL/expiration (simplest, accepts staleness) · Write-through (update cache+DB together) · Explicit invalidation (hardest — "one of the two hard problems in CS") |
| 🧠 Thundering herd | Hot key expires → many concurrent requests all miss at once, hammering the DB. Fix: short-lived distributed lock, or stagger TTLs with jitter. |
| Output caching | Caches whole HTTP responses server-side. ⚠️ Never cache user-specific/sensitive data without proper vary-by configuration — leaks one user's data to another. |

---

## 5. Containers & Orchestration

| Topic | Key facts |
|---|---|
| Multi-stage Docker build | Build stage = full SDK (large). Final stage = runtime + published output only (small, less attack surface). Copy `.csproj` + restore before copying full source → reuses Docker's layer cache, faster CI. |
| Containers vs VMs | Containers share host kernel (lightweight, seconds to start). VMs virtualize whole OS (heavier, stronger isolation — better for untrusted multi-tenant code). |
| 🧠 K8s core objects | **Pod** (smallest unit) → **Deployment** (manages replicas, rolling updates) → **Service** (stable DNS/load-balancing across pods) → **Ingress** (external routing/TLS) → **ConfigMap/Secret** (externalized config) → **Namespace** (logical isolation) |
| Readiness vs Liveness probe failure | Readiness fail = pulled from LB rotation, pod keeps running. Liveness fail = pod killed and restarted. |
| 🧠 Deployment strategies | **Rolling** (gradual, default, zero downtime, low risk) · **Blue-Green** (instant switch, instant rollback, double infra cost) · **Canary** (small % first, smallest blast radius, most operationally complex) |

---

## 6. Architecture Patterns

| Pattern | Key facts |
|---|---|
| CQRS | Separate write model (commands) from read model (queries) — often via **MediatR** (`IMediator.Send()`). Can use one DB — splitting into two stores is the advanced/extreme version, not a requirement. Good for complex/divergent read-write needs; overkill for simple CRUD. |
| Clean/Onion Architecture | Domain (center, no dependencies) → Application (use cases/interfaces) → Infrastructure (implements interfaces, e.g. EF Core) → Presentation. Dependencies point **inward only**. Overkill for small CRUD apps — senior judgment is knowing when it's worth it. |
| 🧠 DDD vocabulary | **Entity** (has identity, e.g. Order by ID) · **Value Object** (defined by value, immutable, e.g. Money/Address) · **Aggregate Root** (consistency boundary, only load/save through it) · **Bounded Context** (a word can mean different things in different contexts — that's fine) |

---

## 7. gRPC & GraphQL

| Topic | Key facts |
|---|---|
| gRPC | Protobuf (binary, small/fast) over HTTP/2. 4 call types: unary, server-streaming, client-streaming, bidirectional. Best for internal service-to-service, high volume, strongly-typed contract. Poor browser support. |
| GraphQL | Client specifies exact fields needed → avoids over/under-fetching. One endpoint. Trade-offs: N+1 resolver risk (needs DataLoader-style batching), harder HTTP caching (POST-based), steeper learning curve. .NET: Hot Chocolate. |
| REST vs GraphQL vs gRPC — when to use which | REST = public/simple APIs, broad compatibility. GraphQL = clients need flexible/different field sets. gRPC = high-performance internal service-to-service. |

---

## 8. Real-Time & UI Extras

| Topic | Key facts |
|---|---|
| SignalR | Real-time bidirectional (WebSockets w/ fallback). Server pushes via `Hub`. ⚠️ Scaling across instances needs a backplane (Redis or Azure SignalR Service) — otherwise `Clients.Group()` only reaches clients on that one instance. |
| Blazor modes | **Server** (logic runs server-side, SignalR connection, small payload, latency per interaction) vs **WebAssembly** (runs fully in browser, larger download, works offline, no per-interaction round trip) vs **Auto/United** (.NET 8+, switches per component). |

---

## 9. Observability — Logs, Metrics, Traces

| Topic | Key facts |
|---|---|
| Structured logging | Log key-value properties (`LogInformation("Order {OrderId}...", orderId)`), not string concatenation — enables indexed queries. Serilog = standard library. |
| 🧠 Three pillars | **Logs** (discrete events, what happened) · **Metrics** (aggregated numbers over time — RED: Rate/Errors/Duration) · **Traces** (one request across services, correlated by trace ID) |
| OpenTelemetry | Vendor-neutral standard for emitting all three, exportable anywhere (App Insights, Jaeger, Prometheus/Grafana). |
| Alerting rule of thumb | Alert on metrics (cheap at scale) → investigate with logs/traces once triggered. Don't alert directly off raw high-volume logs. |
| App Insights / ELK / Prometheus+Grafana | App Insights = Azure APM, near-zero-code instrumentation. ELK = centralized log search. Prometheus (pull-based scrape) + Grafana (dashboards) = standard OSS metrics pairing, common with K8s. |

---

## 10. Identity / Auth — Deeper

| Topic | Key facts |
|---|---|
| 🧠 OAuth2 grant types | **Authorization Code + PKCE** (web/mobile login redirect, current standard) · **Client Credentials** (service-to-service, no user) · **Refresh Token** (renew access token without re-login). Implicit flow = legacy/discouraged (token exposed in URL fragment). |
| OAuth2 vs OIDC | OAuth2 = authorization (delegated access — what can this app do). OIDC = adds authentication (ID token — who is this user). ⚠️ "We use OAuth for login" usually means OIDC. |
| IdentityServer/Duende/Azure AD B2C | Options to centralize auth instead of hand-rolling: Duende IdentityServer (self-hosted STS), Azure AD B2C (managed customer identity), ASP.NET Core Identity (simple in-app username/password+roles). |
| Managed Identity (Azure) | Azure resource authenticates to other Azure services with zero stored credentials — removes the "bootstrapping secret" problem entirely (no secret anywhere to leak). |

---

## 11. NoSQL / Polyglot Persistence

| Topic | Key facts |
|---|---|
| When to reach for NoSQL | Flexible/evolving schema, extreme horizontal scale, document-shaped data, key-value lookups. SQL still wins for strong consistency/complex joins/transactions. |
| Polyglot persistence | Use the right store per data shape (e.g. SQL Server for financial `Claim` data, NoSQL for high-volume audit-event log) rather than forcing everything into one DB. |
| Cosmos DB partition key | ⚠️ The single most important design decision — low cardinality or uneven access creates a "hot partition" that tanks throughput and can't be fixed without a full migration. Pick high cardinality + even distribution. |

---

## 12. IaC & Deployment

| Topic | Key facts |
|---|---|
| Terraform vs Bicep vs ARM | ARM = Azure-native JSON (verbose, rarely hand-written). Bicep = MS's cleaner DSL, compiles to ARM. Terraform = cloud-agnostic (multi-cloud orgs). |
| ⚠️ IaC production risk | Some changes force **destroy and recreate** — always run `terraform plan`/what-if and have a human review the diff before applying to prod. |
| Feature flags | Decouples deployment from release — ship dark, enable gradually, instant rollback without redeploy. ⚠️ Flag debt: removing the flag should be part of "done," not optional cleanup. |
