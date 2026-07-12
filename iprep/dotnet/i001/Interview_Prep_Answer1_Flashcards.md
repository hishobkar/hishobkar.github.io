# Extended .NET Ecosystem Flashcards
*Cover the answer, say it out loud, then check. Condensed from `Interview_Prep_Answer1.md`.*

---

## 1. AWS

**Q: Azure App Service / Functions / Blob Storage / Service Bus — what are the AWS equivalents?**
A: Elastic Beanstalk / Lambda / S3 / SQS+SNS.

**Q: Can .NET run natively on AWS Lambda?**
A: Yes — first-class SDKs (`AWSSDK.*`), managed .NET 6/8 Lambda runtimes, AWS Toolkit for Visual Studio.

---

## 2. Microservices

**Q: Name three API Gateway options in the .NET ecosystem.**
A: YARP (code-first, Microsoft-native), Ocelot (config-driven, open source), Azure API Management (managed PaaS).

**Q: List Polly's four core resiliency patterns.**
A: Retry (with backoff), Circuit Breaker, Timeout, Bulkhead isolation.

**Q: Why does a circuit breaker matter beyond just retrying?**
A: It stops calling a failing dependency for a cooldown period, preventing thread/connection exhaustion and cascading failure across the whole app.

**Q: Liveness probe fails vs readiness probe fails — what happens in each?**
A: Liveness failure kills and restarts the container. Readiness failure just removes the pod from load-balancer rotation without killing it.

**Q: Why is "at-least-once + idempotent consumer" effectively exactly-once?**
A: The broker can never guarantee true exactly-once (a crash can occur between processing and acknowledging), but an idempotent consumer makes redelivery harmless — so the end result behaves the same.

---

## 3. Messaging

**Q: RabbitMQ vs Kafka — pick one for "replay 90 days of events for a fraud model."**
A: Kafka — messages aren't deleted on consume and are retained per policy, so replay is native; Service Bus consumers remove/complete messages on read.

**Q: Queue vs Pub/Sub — core difference?**
A: Queue: one message consumed by exactly one consumer (work distribution). Pub/Sub: one message delivered to every subscriber (broadcast).

**Q: What's a dead-letter queue for?**
A: Moves messages that repeatedly fail processing aside after N retries so they don't block the rest of the queue.

---

## 4. Caching

**Q: Why is `IMemoryCache` risky behind a load balancer with multiple instances?**
A: It's per-instance — instance A's cached value may never be seen by instance B, causing inconsistent responses depending on which server handles the request.

**Q: Describe the cache-aside pattern in one sentence.**
A: Check cache first; on miss, load from the source of truth and populate the cache for next time.

**Q: What's a "thundering herd," and how do you prevent it?**
A: A hot cache key expiring causes many concurrent requests to all miss and hit the DB simultaneously; prevent with a short-lived distributed lock or staggered TTLs with jitter.

---

## 5. Containers & Kubernetes

**Q: Why copy `.csproj` and run `dotnet restore` before copying the rest of the source in a Dockerfile?**
A: Reuses Docker's layer cache so `dotnet restore` only reruns when dependencies actually change, not on every commit.

**Q: What's the main operational value of Kubernetes over manually managed containers?**
A: Self-healing — a crashed or failing pod is automatically restarted/rescheduled.

**Q: Rolling vs Blue-Green vs Canary — which limits blast radius the most?**
A: Canary — routes a small percentage of traffic to the new version first and monitors before ramping up.

---

## 6. Architecture Patterns

**Q: Does CQRS require two separate databases?**
A: No — that's the advanced/extreme version. You can (and often should) separate command/query models in code against a single database.

**Q: In Clean Architecture, which direction do dependencies point?**
A: Inward only — Infrastructure depends on abstractions defined in Domain/Application, never the reverse.

**Q: Entity vs Value Object in DDD?**
A: Entity has identity that persists over time (two identical Orders are still different by ID). Value Object is defined purely by its values, no identity (two identical Money instances are equal, full stop).

**Q: What is an Aggregate Root?**
A: A cluster of entities/value objects treated as one consistency boundary — you only load/save through the root, which enforces invariants for everything inside it.

---

## 7. gRPC & GraphQL

**Q: When is gRPC the better fit than REST?**
A: High-performance internal service-to-service calls where both ends are your own services and a strongly-typed contract matters.

**Q: What problem does GraphQL solve that REST doesn't?**
A: Lets the client specify exactly which fields it needs in one request, avoiding both over-fetching and under-fetching.

**Q: What's the GraphQL equivalent of the EF N+1 problem?**
A: Naively resolving a nested field (like `member` per claim) in a loop — fixed with DataLoader-style batching.

---

## 8. Real-Time & Blazor

**Q: Why doesn't `Clients.Group(...).SendAsync(...)` reach every connected client once you scale SignalR to multiple servers?**
A: Each server instance keeps connections in memory — you need a backplane (Redis or Azure SignalR Service) so messages reach clients on other instances too.

**Q: Blazor Server vs Blazor WebAssembly — key trade-off?**
A: Server: small payload but needs a constant connection, latency per interaction. WASM: larger initial download but runs fully in-browser, no per-interaction round trip.

---

## 9. Observability

**Q: Why is structured logging better than string interpolation in logs?**
A: Properties like `OrderId` become independently searchable/indexed fields instead of requiring a full-text grep.

**Q: Name the three pillars of observability.**
A: Logs, Metrics, Traces.

**Q: Should you alert directly off raw logs?**
A: No — alert on metrics (cheap/fast at scale), then use logs/traces to investigate once an alert fires.

---

## 10. Identity / Auth

**Q: Name the three main OAuth2 grant types used today.**
A: Authorization Code + PKCE (web/mobile login), Client Credentials (service-to-service), Refresh Token (renew without re-login).

**Q: OAuth2 vs OIDC — what's the actual difference?**
A: OAuth2 handles authorization (delegated access). OIDC adds an authentication layer on top — an ID token that tells you who the user actually is.

**Q: What security problem does Azure Managed Identity solve that Key Vault alone doesn't?**
A: It removes the "bootstrapping secret" problem — there's no credential anywhere for an attacker to steal, since the identity is tied to the Azure resource itself.

---

## 11. NoSQL

**Q: What's the single most important Cosmos DB design decision?**
A: Choosing the partition key — low cardinality or uneven distribution creates a hot partition that tanks throughput and requires a full data migration to fix.

**Q: What is "polyglot persistence"?**
A: Using the right database per data shape (e.g. SQL Server for financial transactional data, a document store for a high-volume audit log) instead of forcing everything into one store.

---

## 12. IaC & Deployment

**Q: What's the real risk of running `terraform apply` directly against production?**
A: Some changes force destroy-and-recreate of a resource, risking downtime or data loss — always review `terraform plan`/what-if output first.

**Q: What is "flag debt"?**
A: Feature flags left in code long after full rollout, creating permanent branching complexity nobody remembers the purpose of — removal should be part of the rollout's definition of done.
