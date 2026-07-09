# Interview Prep — Extended Topics (Modern .NET Ecosystem)

The 3 JDs in `prompt.md` explicitly name Azure, microservices, Angular/Vue, and AI tooling. But interviewers for a "5-10 years, full stack .NET" role commonly probe adjacent tech that's now standard in the ecosystem even when not spelled out in the JD — multi-cloud awareness (AWS), messaging, caching, containers, resiliency, observability, and architecture patterns (CQRS/Clean Architecture). This file covers the gap: questions likely to come up that `Interview_Prep_Questions.md` doesn't already handle. Given the seniority of this role (10 YOE), these answers go deep — full explanation of the "why," a practical example for every topic, and the trade-offs/follow-up traps a senior candidate should be ready for, not just name-dropping the tool.

---

## 1. AWS — in case the interviewer probes beyond Azure

Even JD3 (Azure-focused) may ask "have you used any other cloud?" to gauge general cloud literacy — a lot of .NET shops run on AWS too, especially after acquisitions or when a company started on AWS before standardizing on Azure. The interviewer isn't testing AWS trivia; they're testing whether your cloud knowledge is *conceptual* (transfers across vendors) or just "I memorized the Azure portal." Showing you can map a problem to primitives regardless of vendor is the actual signal.

**What's your AWS equivalent knowledge of Azure services?**
- Compute: Azure App Service ≈ AWS Elastic Beanstalk; Azure Functions ≈ AWS Lambda; Azure VMs ≈ EC2.
- Containers: AKS ≈ EKS; Azure Container Apps ≈ ECS/Fargate.
- Storage: Blob Storage ≈ S3; Azure Files ≈ EFS.
- Database: Azure SQL ≈ RDS; Cosmos DB ≈ DynamoDB.
- Messaging: Service Bus ≈ SQS/SNS; Event Grid ≈ EventBridge.
- IAM: Azure AD/Entra ID ≈ AWS IAM.
- Secrets: Key Vault ≈ AWS Secrets Manager/Parameter Store.
- Framing this as a comparison table shows cloud-agnostic thinking even if your hands-on experience is Azure-only — say so honestly: "My production experience is Azure, but the concepts map directly to AWS — same patterns, different service names."

**Practical example** — picture explaining a real migration scenario: "We had a claims-intake service on Azure Functions triggered by a Blob upload (a PDF claim form landed in storage, a Function parsed it and wrote a row to Azure SQL). If I had to port that to AWS, it's an S3 event notification triggering a Lambda that parses the PDF and writes to RDS — same shape, same trigger/compute/store pattern, different product names." That's the kind of answer that shows you understand the *architecture*, not the vendor UI.

**Can .NET run on AWS well?**
- Yes — .NET is cross-platform since .NET Core; AWS has first-class SDKs (`AWSSDK.*` NuGet packages), and AWS Toolkit for Visual Studio supports deploying to Lambda, Elastic Beanstalk, ECS directly. Lambda supports .NET runtimes natively (custom runtime or managed, currently .NET 6/8 managed runtimes).
```csharp
// Minimal AWS Lambda function in .NET, triggered by an S3 event
public class Function
{
    public async Task Handler(S3Event evt, ILambdaContext context)
    {
        foreach (var record in evt.Records)
        {
            var bucket = record.S3.Bucket.Name;
            var key = record.S3.Object.Key;
            context.Logger.LogInformation($"Processing {key} from {bucket}");
            // download, parse, persist...
        }
    }
}
```

**Lambda vs Azure Functions**
- Same serverless concept: pay-per-execution, auto-scaling, event-triggered (S3 upload, SQS message, API Gateway request vs Blob upload, Queue message, HTTP trigger). Main practical differences are ecosystem integration (Lambda + API Gateway + DynamoDB is the classic AWS serverless stack) and cold-start characteristics, which are broadly comparable — both suffer worse cold starts on .NET than on lighter runtimes like Node/Python because of JIT/assembly loading, which is why AOT compilation (`Native AOT` in .NET 8) has become a talking point for reducing Lambda cold-start latency.

**Common follow-up / trap**: "Which would you pick for a new project?" — the honest, senior answer is "it depends on where the rest of the org's infrastructure already lives; don't introduce a second cloud vendor just for one service unless there's a strong reason (cost, a specific managed service, compliance/region requirement) — the operational overhead of running two clouds usually outweighs the benefit of picking the 'better' one for a single workload."

---

## 2. Microservices — deeper patterns beyond the JD3 basics

**API Gateway implementations in .NET**
- **YARP** (Yet Another Reverse Proxy) — Microsoft's own reverse proxy toolkit, lightweight, code-first configuration, increasingly the default choice for .NET-native gateways.
- **Ocelot** — older, popular open-source .NET API Gateway, config-driven (JSON), supports routing, aggregation, rate limiting, auth.
- **Azure API Management (APIM)** — managed PaaS gateway: policies (transform, rate-limit, cache), developer portal, subscription keys — used when you want the gateway as infrastructure rather than code you maintain.

**Practical example**: imagine a claims-processing platform split into `IntakeService`, `EligibilityService`, and `PaymentService`. Instead of the mobile app knowing three different base URLs, YARP sits in front and routes by path:
```json
{
  "ReverseProxy": {
    "Routes": {
      "intake": { "ClusterId": "intakeCluster", "Match": { "Path": "/api/intake/{**catch-all}" } },
      "eligibility": { "ClusterId": "eligibilityCluster", "Match": { "Path": "/api/eligibility/{**catch-all}" } }
    },
    "Clusters": {
      "intakeCluster": { "Destinations": { "d1": { "Address": "http://intake-svc:8080/" } } },
      "eligibilityCluster": { "Destinations": { "d1": { "Address": "http://eligibility-svc:8080/" } } }
    }
  }
}
```
The gateway also becomes the single place to enforce auth (validate the JWT once) and rate limiting, instead of every downstream service reimplementing it.

**Common follow-up / trap**: "Doesn't the gateway become a single point of failure / bottleneck?" — yes, which is why it's typically deployed as multiple stateless replicas behind a load balancer, not a single instance, and why you keep it thin (routing + cross-cutting concerns) rather than putting business logic in it — a "smart gateway" becomes a hidden monolith that every team has to coordinate changes through.

**Service discovery**
- In Kubernetes, service discovery is largely solved by DNS (a `Service` object gives a stable name that resolves to healthy pod IPs) — you typically don't need a separate discovery tool. Outside K8s, options include Consul or Azure's built-in App Service/Container Apps internal DNS. Worth naming even briefly to show awareness that "how do services find each other" is a real problem microservices architectures must solve, especially as instances scale up/down dynamically and IPs aren't stable.

**Resiliency — Polly**
```csharp
var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(3, retry => TimeSpan.FromSeconds(Math.Pow(2, retry)));

var circuitBreaker = Policy
    .Handle<HttpRequestException>()
    .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));

// registered against HttpClientFactory so every call through this named client gets the policy automatically
services.AddHttpClient("EligibilityClient")
    .AddPolicyHandler(retryPolicy)
    .AddPolicyHandler(circuitBreaker);
```
- Polly is the standard .NET resiliency library, integrates with `HttpClientFactory` (`AddPolicyHandler`). Key patterns to know:
  - **Retry** (with exponential backoff) — for transient failures. The backoff matters: retrying immediately three times in a row against an already-struggling service is how you turn a blip into an outage (this is called a "retry storm"). Exponential backoff plus a small random jitter avoids every failed caller retrying in lockstep and re-hammering the service at the same moment.
  - **Circuit Breaker** — stops calling a failing downstream service for a cooldown period instead of hammering it further, giving it time to recover. Concretely: after 5 consecutive failures, the circuit "opens" and every call fails fast (no network call attempted) for 30 seconds, then goes "half-open" and lets one test call through to see if the dependency has recovered.
  - **Timeout** — bounds how long you'll wait for a call; without one, a single slow downstream dependency can leave your threads/connections tied up waiting indefinitely.
  - **Bulkhead isolation** — limits concurrent calls to a dependency so one slow downstream service can't exhaust all threads/connections and take down the whole app (named after ship bulkheads — one compartment flooding shouldn't sink the whole ship).
- **What happens without this**: picture `PaymentService` calling a flaky third-party bank API with no timeout and no circuit breaker. The bank API starts responding slowly under its own load. Every request into `PaymentService` now blocks waiting on that call, thread pool starvation sets in, and `PaymentService` itself becomes unresponsive to *everything*, including requests that don't even touch the bank API. That cascading failure is exactly what Polly's circuit breaker + timeout + bulkhead combination prevents — the failure stays contained to "payment operations are temporarily degraded" instead of "the whole service is down."
- .NET 8 also ships a built-in resilience library (`Microsoft.Extensions.Http.Resilience`) built on Polly v8 — worth mentioning if targeting recent .NET; it wraps the same concepts (retry, circuit breaker, timeout, rate limiter) behind a simpler `AddStandardResilienceHandler()` call.

**Health checks**
- `AddHealthChecks()` / `MapHealthChecks("/health")` exposes an endpoint Kubernetes or a load balancer polls to know if an instance is alive (liveness) and ready to receive traffic (readiness) — unhealthy instances get removed from rotation automatically. Can check DB connectivity, downstream dependencies, disk space, etc.
```csharp
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString, name: "sql")
    .AddCheck<EligibilityApiHealthCheck>("eligibility-api");

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false }); // liveness: just "is the process up"
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = _ => true });  // readiness: checks dependencies too
```
- **Common trap**: conflating liveness and readiness. Liveness should be nearly free (is the process running) — if it checks the database and the DB has a blip, Kubernetes will kill and restart a perfectly healthy pod, which doesn't fix the DB problem and just adds churn. Readiness is where you check dependencies, because "not ready" just pulls the pod out of the load-balancer rotation without killing it.

**Idempotency in microservices**
- Since network calls can be retried (by clients, by resiliency policies, by message brokers redelivering), handlers must be safe to process the same request/message twice without side effects — e.g. using an idempotency key on payment requests, or checking "have I already processed message ID X" before applying it (common with at-least-once delivery queues).
```csharp
public async Task ProcessPaymentAsync(string idempotencyKey, decimal amount)
{
    if (await _paymentRepo.ExistsAsync(idempotencyKey))
        return; // already processed this exact request — safe no-op, not a duplicate charge

    await _bankGateway.ChargeAsync(amount);
    await _paymentRepo.RecordAsync(idempotencyKey, amount);
}
```
- **Interview trap**: "Isn't at-least-once delivery + retries basically the same as exactly-once if you're careful?" — the honest answer is no: the broker can never *guarantee* exactly-once because a crash can happen between "process the message" and "acknowledge the message," so it will redeliver. What you *can* build is an idempotent consumer that makes redelivery harmless — the end result behaves like exactly-once even though the delivery guarantee underneath is at-least-once.

---

## 3. Messaging / Event-Driven Architecture

**RabbitMQ vs Kafka vs Azure Service Bus**
- **RabbitMQ**: traditional message broker, smart broker/dumb consumer, good for complex routing (exchanges — direct, topic, fanout), task queues, RPC-style messaging.
- **Kafka**: distributed log/streaming platform, built for high-throughput event streaming, consumers can replay history (messages aren't deleted on consume, retained per a policy), better suited for event sourcing, analytics pipelines, and very high volume.
- **Azure Service Bus**: managed PaaS equivalent to RabbitMQ's use case (queues + topics/subscriptions for pub-sub), enterprise features (sessions, dead-lettering, duplicate detection) with no infrastructure to manage.
- Choosing between them: Service Bus/RabbitMQ for reliable task/command processing between services; Kafka when you need a durable, replayable event log at scale (e.g. audit trail, multiple independent consumers reading the same stream at their own pace).

**Practical example**: on a healthcare claims platform, `ClaimSubmittedEvent` publishing could go either way depending on the need. If it's "notify billing and notifications when a claim is submitted" — that's Service Bus topic/subscription territory, a handful of known subscribers, straightforward pub-sub. If it's "every claim event needs to be replayable for a fraud-detection model that gets retrained monthly and needs to reprocess 90 days of history" — that's Kafka, because Service Bus consumers remove/complete messages on read, they don't naturally support "replay the last 90 days" the way a Kafka topic with a long retention policy does.
```csharp
// Azure Service Bus — publishing a topic message
await using var client = new ServiceBusClient(connectionString);
var sender = client.CreateSender("claim-events");
var message = new ServiceBusMessage(JsonSerializer.Serialize(new ClaimSubmittedEvent(claimId, memberId)))
{
    Subject = "ClaimSubmitted",
    MessageId = claimId.ToString() // enables built-in duplicate detection
};
await sender.SendMessageAsync(message);
```

**Common follow-up / trap**: "Why not just use Kafka for everything since it's more powerful?" — trade-off: Kafka is operationally heavier (partitioning, consumer group rebalancing, ZooKeeper/KRaft, schema registry for evolving message formats) and overkill for a system that just needs reliable task distribution between five internal services. Reach for the simpler tool (Service Bus/RabbitMQ) unless you specifically need replay, extremely high throughput, or a shared event log consumed independently by many downstream systems.

**Pub/Sub vs point-to-point queue**
- Queue (point-to-point): one message, consumed by exactly one consumer — good for distributing work across workers (e.g. a pool of claim-processing workers pulling from one queue, each claim handled once).
- Pub/Sub (topic/subscription): one message published, delivered to every subscriber — good for broadcasting an event (e.g. "OrderPlaced") to multiple independent services that each need to react (billing, inventory, notifications) without the publisher knowing who's listening.

**At-least-once vs exactly-once delivery**
- Most brokers guarantee at-least-once delivery (a message might be redelivered after a crash before acknowledgment) — this is why idempotent consumers matter (see Section 2). True exactly-once is hard/expensive; most systems achieve it in effect via idempotency rather than the broker itself guaranteeing it.

**Dead-letter queues**
- Messages that repeatedly fail processing (poison messages) get moved to a separate dead-letter queue after N retries instead of blocking the main queue forever — lets you inspect/reprocess failures without losing them or stalling healthy traffic.
- **Practical example**: a malformed `ClaimSubmittedEvent` with a null `MemberId` will throw a `NullReferenceException` every time the consumer tries to process it. Without a DLQ, that one bad message blocks the whole queue (or gets retried forever, burning CPU). With a DLQ, after 5 failed delivery attempts Service Bus automatically moves it to `claim-events/$DeadLetterQueue`, the rest of the queue keeps flowing, and an alert fires so someone can look at the bad message and decide: fix and replay it, or discard it.

**Event-driven architecture — event notification vs event carried state transfer**
- Event notification: a small event ("OrderPlaced", order ID only) tells subscribers something happened; they call back to fetch full details if needed — keeps events small but adds coupling/latency to fetch details, and means the subscriber's success now depends on the publisher's API being up at the time it processes the event.
- Event-carried state transfer: the event itself carries the full data subscribers need, so they don't have to call back — more decoupled/resilient (works even if the publisher is down later) but events can get large and schema changes need more care (versioning the event contract becomes its own discipline — adding a field is safe, removing/renaming one breaks every consumer still expecting the old shape).

---

## 4. Caching

**Redis in .NET**
- Distributed cache used across multiple app instances (unlike `IMemoryCache`, which is per-instance and lost on restart/doesn't work correctly behind a load balancer with multiple servers — instance A might cache a value that instance B never sees, causing inconsistent responses depending on which server handles the request). Registered via `AddStackExchangeRedisCache()`, accessed through `IDistributedCache`, or directly via `StackExchange.Redis` for advanced scenarios (pub/sub, sorted sets, distributed locks).

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
- Application checks cache first; on miss, loads from the source of truth (DB) and populates the cache. Most common caching pattern — simple, and the cache can be empty/cold without breaking correctness (a Redis outage just means every request falls through to the DB, degraded performance but not a broken app, *provided you code the fallback defensively* — see the trap below).

**What happens without this / a deeper example**: consider a product catalog page hit thousands of times a minute where each hit does a 5-table join in SQL Server. Without caching, that join runs on every single request — CPU and I/O on the DB scale linearly with traffic, and a traffic spike (e.g. a marketing email blast) can bring the database to its knees for every other query sharing that DB, not just the catalog page. With cache-aside and a 10-minute TTL, the DB only sees roughly one query per product per 10 minutes regardless of how many users hit the page — the read load is decoupled from user traffic.

```csharp
// A common trap: not guarding against a Redis outage taking down the whole app
public async Task<Product> GetProductAsync(int id)
{
    try
    {
        var cached = await cache.GetStringAsync($"product:{id}");
        if (cached is not null) return Deserialize(cached);
    }
    catch (RedisConnectionException)
    {
        // swallow — treat cache unavailability as a cache miss, not a fatal error
    }

    var product = await db.Products.FindAsync(id);
    try { await cache.SetStringAsync($"product:{id}", Serialize(product)); } catch (RedisConnectionException) { }
    return product;
}
```

**Cache invalidation strategies**
- TTL/expiration (simplest — accept some staleness). Write-through (update cache and DB together on every write). Explicit invalidation (delete/update the cache key when the underlying data changes) — the hardest of "the two hard problems in computer science." Interviewers like hearing you understand the trade-off between staleness and complexity, not just "use Redis."
- **Common follow-up / trap**: "How do you avoid a 'thundering herd' when a hot key expires?" — if a very popular cache key (say, a homepage banner config) expires and 500 concurrent requests all miss at the same instant, all 500 hit the DB simultaneously to repopulate it. Mitigations: a short-lived distributed lock so only one request repopulates while others wait/serve stale, or staggering TTLs with jitter so not everything expires at exactly the same moment.

**Output/response caching in ASP.NET Core**
- `[ResponseCache]` or the newer Output Caching middleware (.NET 7+) caches whole HTTP responses server-side (or instructs the client/CDN via headers) for endpoints where the same response is served repeatedly — reduces load for expensive, infrequently-changing GET endpoints.
```csharp
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy("CatalogPolicy", p => p.Expire(TimeSpan.FromMinutes(5)).Tag("catalog"));
});
app.MapGet("/api/catalog", GetCatalog).CacheOutput("CatalogPolicy");
// later, when a product changes:
await outputCacheStore.EvictByTagAsync("catalog", default);
```
- **When NOT to use it**: never on endpoints that return user-specific or sensitive data without proper vary-by configuration — caching a response keyed only by URL when the response actually differs per authenticated user is a classic way to leak one user's data to another.

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
- Multi-stage build: build stage has the full SDK (large, ~800MB+), final image only has the runtime + published output (small, ~200MB) — keeps production images lean, which matters for pull time on deploys and attack surface (fewer tools/compilers sitting in a production image is fewer things an attacker can use if they get a shell). Image = immutable blueprint; container = a running instance of that image — you can run many containers from the same image, each with its own writable layer and isolated process/filesystem view.
- **Practical extension**: a common real improvement on top of the snippet above is copying `.csproj` files and restoring *before* copying the rest of the source, so Docker's layer cache is reused across builds when only source code changed but dependencies didn't:
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app
```
This alone can cut CI build times significantly on a large solution, because `dotnet restore` (network-bound, slow) only reruns when a `.csproj` actually changes, not on every commit.

**Why containers over VMs**
- Containers share the host OS kernel (lightweight, start in seconds, smaller footprint) vs VMs which virtualize the whole OS (heavier, slower to start, minutes not seconds). Containers guarantee "works on my machine" consistency across dev/test/prod since the runtime + dependencies ship inside the image — the classic bug class of "works locally, breaks in prod because of a missing system library or different .NET patch version" mostly disappears.
- **When NOT to use containers**: workloads needing strict OS-level isolation/security boundaries (multi-tenant untrusted code) are still better suited to VMs or a sandboxed runtime — containers share a kernel, so a kernel-level exploit can, in principle, cross container boundaries in a way it can't cross VM boundaries as easily.

**Kubernetes core concepts**
- **Pod**: smallest deployable unit, one or more tightly-coupled containers (usually one — a sidecar pattern, e.g. a logging agent alongside the app container, is the main reason for more than one).
- **Deployment**: manages a set of pod replicas, handles rolling updates/rollbacks.
- **Service**: stable network endpoint/DNS name that load-balances across healthy pods (pod IPs change constantly as pods get rescheduled — the Service abstracts that away).
- **Ingress**: routes external HTTP(S) traffic into services, often with TLS termination.
- **ConfigMap/Secret**: externalize configuration/secrets from the container image — so the same image can be promoted from dev to staging to prod unchanged, with only the config differing per environment.
- **Namespace**: logical isolation boundary (e.g. dev/staging/prod within one cluster).
- Self-healing: if a pod crashes or fails its health check, Kubernetes automatically restarts/reschedules it — this is the main operational value over manually managed containers.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eligibility-svc
spec:
  replicas: 3
  selector:
    matchLabels: { app: eligibility-svc }
  template:
    metadata:
      labels: { app: eligibility-svc }
    spec:
      containers:
        - name: eligibility-svc
          image: myregistry.azurecr.io/eligibility-svc:1.4.2
          ports: [{ containerPort: 8080 }]
          readinessProbe:
            httpGet: { path: /health/ready, port: 8080 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health/live, port: 8080 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: eligibility-svc
spec:
  selector: { app: eligibility-svc }
  ports: [{ port: 80, targetPort: 8080 }]
```

**Common follow-up / trap**: "What's the difference between a readiness probe failing vs a liveness probe failing?" — a failed readiness probe just removes the pod from the Service's load-balancer rotation (no traffic sent, pod keeps running, can recover on its own e.g. after a slow startup dependency connects); a failed liveness probe causes Kubernetes to *kill and restart* the container. Wiring the DB check into liveness instead of readiness is a classic misconfiguration that causes unnecessary restart loops during a transient DB blip.

**Rolling deployment / blue-green / canary**
- **Rolling**: gradually replace old pods with new ones, a few at a time — default K8s Deployment behavior, zero downtime if health checks are correct.
- **Blue-green**: run the new version fully alongside the old, then switch traffic all at once (via load balancer/slot swap) — instant rollback by switching back; costs double the infrastructure while both are running.
- **Canary**: route a small % of traffic to the new version first, monitor for errors, then gradually increase — limits blast radius of a bad deploy; more operationally complex (needs traffic-splitting infrastructure and good real-time metrics to decide whether to proceed or roll back).
- **When to use which**: rolling for routine, low-risk changes; blue-green when you need an instant, guaranteed rollback path (e.g. a risky schema-adjacent change) and can afford double capacity briefly; canary when the change is high-risk/high-uncertainty and you want real production traffic validating it gradually before full exposure — this is the one that best limits the "blast radius" of an unknown bug.

---

## 6. Architecture Patterns — CQRS, Clean Architecture, DDD

**CQRS (Command Query Responsibility Segregation)**
- Separates the write model (commands — `PlaceOrderCommand`) from the read model (queries — `GetOrderSummaryQuery`), often with different data models/even different data stores optimized for each. In .NET, commonly implemented with **MediatR**: controllers send a command/query object through `IMediator.Send()`, which routes it to a single handler — decouples the controller from the business logic implementation and keeps each handler focused on one operation.
```csharp
public record PlaceOrderCommand(Guid CustomerId, List<OrderLine> Lines) : IRequest<Guid>;

public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, Guid>
{
    private readonly IOrderRepository _repo;
    public PlaceOrderHandler(IOrderRepository repo) => _repo = repo;

    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Lines); // domain enforces invariants
        await _repo.AddAsync(order, ct);
        return order.Id;
    }
}

// controller stays thin
[HttpPost]
public async Task<IActionResult> Place(PlaceOrderCommand cmd)
    => Ok(await _mediator.Send(cmd));
```
- **Practical example of the "different store" version**: an order-management system where writes go through the normalized transactional model (enforcing invariants like "can't ship more than what's in stock") but the "order history" read screen queries a denormalized, pre-joined read model (maybe even a separate reporting DB or a materialized view) updated asynchronously via events — because that read query joining 6 tables and aggregating totals is expensive to run live on every page load, and it doesn't need to be perfectly real-time.
- Not always needed — good for complex domains with very different read/write shapes or performance needs; overkill for simple CRUD (be ready to say when you *wouldn't* use it, shows judgment). **Common trap**: interviewers sometimes conflate CQRS with "must use two databases" — that's the advanced/extreme version. You can (and often should) do CQRS with a single database, just separate command and query models/handlers in code, and only split the physical store later if you actually hit a read/write scaling mismatch.

**Clean Architecture / Onion Architecture**
- Concentric layers: Domain (entities, business rules, no dependencies on anything) at the center → Application (use cases, interfaces like `IOrderRepository`) → Infrastructure (EF Core, external APIs — implements the interfaces) → Presentation (API controllers). Dependencies point inward only — infrastructure depends on abstractions defined in the domain/application layer, not the other way around (this is Dependency Inversion applied at the architecture level). Benefit: business logic is testable and framework-agnostic; you could swap EF Core for Dapper without touching domain logic.
- **Practical example**: `Domain.Order` has a method `AddLine(Product product, int qty)` that throws if `qty <= 0` or the product is discontinued — that rule lives in the domain project with zero references to EF Core or ASP.NET. `Infrastructure.OrderRepository : IOrderRepository` (defined in `Application`) is the only place that knows about `DbContext`. If you write a unit test for the order's business rule, you don't need a database, a web server, or even a DI container — you just `new Order()` and assert.
- **Common follow-up / trap**: "Isn't this over-engineering for a small CRUD app?" — yes, honestly. Clean Architecture pays off when business logic is genuinely complex and long-lived; for a small internal admin tool with thin CRUD and no real business rules, the extra layers/indirection are pure ceremony that slows the team down. Senior judgment here is recognizing *when* the investment is worth it, not applying it everywhere by default.

**Domain-Driven Design (DDD) — just the vocabulary**
- **Entity**: has identity that persists over time (e.g. `Order` with an ID — two orders with identical line items are still different orders because their IDs differ).
- **Value Object**: defined by its values, no identity (e.g. `Address`, `Money`) — immutable, comparable by value (two `Money(50, "USD")` instances are equal, full stop, there's no notion of "which one").
- **Aggregate/Aggregate Root**: a cluster of entities/value objects treated as a consistency boundary — you only load/save the aggregate root, and it enforces invariants for everything inside it (e.g. `Order` is the root, `OrderLine` items are only modified through it, never fetched and updated directly — that's what prevents "OrderLine total doesn't match the sum the Order thinks it has").
- **Bounded Context**: a boundary within which a domain model is consistent/unambiguous — the word "Customer" might mean something different in the Billing context (has payment methods, credit limit) vs the Support context (has ticket history, preferred contact method); DDD says that's fine as long as each context has its own clear model rather than forcing one bloated shared `Customer` class to serve every team's needs.
- **Practical example**: in a healthcare claims system, `Claim` is the aggregate root; `ClaimLine` items (individual billed procedures) can only be added/modified through `Claim.AddLine(...)`, which checks things like "total billed doesn't exceed the authorized amount" — you never let a repository fetch and update a `ClaimLine` in isolation, because that would let the invariant get violated by code that doesn't know about it.
- Even a surface-level answer here signals architectural maturity beyond CRUD.

---

## 7. gRPC & GraphQL

**gRPC**
- RPC framework using Protocol Buffers (binary serialization, much smaller/faster than JSON) over HTTP/2 (multiplexed streams, header compression). Supports four call types: unary (request/response), server streaming, client streaming, bidirectional streaming. Best for internal service-to-service calls where performance matters and both ends are typically your own services (strongly-typed contract via `.proto` files, code-generated clients/servers). Less suited for public-facing APIs consumed by browsers directly (limited browser support without a proxy like grpc-web).
```protobuf
service EligibilityService {
  rpc CheckEligibility (EligibilityRequest) returns (EligibilityResponse);
  rpc StreamClaimStatusUpdates (ClaimId) returns (stream ClaimStatusUpdate); // server streaming
}
message EligibilityRequest { string memberId = 1; string procedureCode = 2; }
message EligibilityResponse { bool isEligible = 1; string reason = 2; }
```
```csharp
// generated client usage — strongly typed, no manual JSON (de)serialization or URL string-building
var response = await eligibilityClient.CheckEligibilityAsync(
    new EligibilityRequest { MemberId = "M123", ProcedureCode = "99213" });
```
- **Practical example**: `IntakeService` calling `EligibilityService` synchronously on every claim submission (hundreds of times a minute, low latency required, both are your own internal services) — a great gRPC fit. The `.proto` contract is versioned and shared, so a breaking field removal is caught at compile time on both sides, not discovered at runtime like a loosely-typed JSON REST call might be.
- **Common follow-up / trap**: "Why not just use REST for internal calls too, keep it consistent?" — valid trade-off to acknowledge: REST/JSON is easier to debug with a browser or curl, has broader tooling support, and doesn't require the whole team to learn Protobuf tooling. gRPC's performance/type-safety win matters most at high call volume or when payload size/latency is a measured bottleneck — for low-volume internal calls, plain REST is often simpler to maintain and not worth the added complexity.

**GraphQL**
- Client specifies exactly what fields it needs in a single query, avoiding both over-fetching (REST returning a whole object when you need 2 fields) and under-fetching (needing multiple round-trips to assemble related data). One endpoint (`/graphql`) instead of many REST routes; schema is strongly typed.
```graphql
query {
  claim(id: "C-9081") {
    status
    member { name }
    lines { procedureCode billedAmount }
  }
}
```
One request returns exactly the claim status, member name, and line items — a mobile client showing a summary card doesn't have to pull the full claim object with every field REST would return, and doesn't need three separate REST calls (claim, member, lines) either.
- Trade-offs: more complex server implementation (resolvers, N+1 query risk requiring DataLoader-style batching — resolving `member` per claim naively in a loop reintroduces the exact N+1 problem discussed under EF Core), harder to cache with standard HTTP caching (since it's typically POST-based, CDN/browser caching by URL doesn't work the same way), steeper learning curve for the team. .NET libraries: Hot Chocolate is the current standard.
- When asked "REST vs GraphQL vs gRPC" — REST for public/simple APIs and broad compatibility, GraphQL when clients have very different/flexible data needs (e.g. mobile vs web needing different field sets from the same underlying data), gRPC for high-performance internal service-to-service calls. **Trap**: don't claim GraphQL is strictly "better" — it trades server complexity and caching simplicity for client flexibility; a simple CRUD API with one consumer gets nothing from GraphQL except more moving parts.

---

## 8. Real-Time & UI Extras

**SignalR**
- ASP.NET Core library for real-time bidirectional communication between server and client (WebSockets, with automatic fallback to Server-Sent Events/long polling if WebSockets aren't available). Used for live features: chat, live notifications, dashboards updating in real time, collaborative editing indicators. Server pushes to clients via a `Hub` (`await Clients.All.SendAsync("ReceiveMessage", msg)`) — inverts the normal request/response model.
```csharp
public class ClaimStatusHub : Hub
{
    public async Task JoinClaimGroup(string claimId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"claim-{claimId}");
}

// elsewhere, when a claim's status changes (e.g. from a message-queue consumer)
await hubContext.Clients.Group($"claim-{claimId}").SendAsync("StatusChanged", newStatus);
```
- **Practical example**: a claims-adjuster dashboard where multiple adjusters watch the same claim; when one approves a line item, every other browser looking at that claim updates instantly without polling. Without SignalR, you'd either poll every few seconds (wasteful, laggy) or need the user to refresh manually.
- **Common follow-up / trap**: "How does this scale across multiple server instances?" — a single SignalR server keeps connections in memory, so `Clients.Group(...)` only reaches clients connected to *that* instance. Scaling out requires a backplane (Redis backplane is the common .NET answer, or Azure SignalR Service as a fully managed option) so a message sent from any server instance reaches clients connected to any other instance.

**Blazor** (worth a one-liner even if not in any of the 3 JDs — shows current .NET awareness)
- Lets you write client-side interactive UI in C# instead of JavaScript. **Blazor Server**: UI logic runs on the server, UI updates pushed to the browser over a SignalR connection (small initial payload, but needs a constant connection and has latency per interaction — every button click is a round trip to the server). **Blazor WebAssembly**: the whole app + a WASM-compiled .NET runtime downloads and runs entirely in the browser (larger initial download, but works offline/no server round-trip per interaction, scales better since the server isn't holding a persistent connection per user). **Blazor United/Auto** (.NET 8+): can switch between render modes per component — e.g. server-rendered for the first paint (fast, SEO-friendly) then WASM takes over for interactivity.
- **When NOT to use it**: a team already deep in React/Angular/Vue with existing component libraries and hiring pipeline built around JS shouldn't switch to Blazor just because it's "all C#" — the ecosystem maturity (component libraries, tooling, hiring pool) still favors the established JS frameworks for large public-facing apps; Blazor tends to make the most sense for internal tools in an all-.NET shop wanting to avoid context-switching between C# and JS.

---

## 9. Observability — Logging, Metrics, Tracing

**Structured logging — Serilog**
- Logs as structured data (key-value properties), not just strings — enables querying/filtering in log aggregation tools (`logger.LogInformation("Order {OrderId} placed by {UserId}", orderId, userId)` rather than string concatenation, which lets a log platform index `OrderId` as its own searchable field instead of parsing free text). Serilog is the most common structured logging library in .NET, with "sinks" to route logs to files, Seq, Elasticsearch, Application Insights, etc.
```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.WithProperty("Service", "ClaimsApi")
    .WriteTo.Console()
    .WriteTo.Seq("http://seq:5341")
    .CreateLogger();

logger.LogInformation("Claim {ClaimId} rejected: {Reason}", claimId, reason);
// queryable later as: Service = "ClaimsApi" AND ClaimId = "C-9081"
```
- **What happens without it**: `logger.LogInformation($"Claim {claimId} rejected: {reason}")` (string interpolation) produces text that a log platform can only full-text search — finding "every rejected claim for member M123 in the last hour" means grepping through unstructured text instead of running an indexed query on a `ClaimId`/`Reason` field.

**The three pillars of observability**
- **Logs**: discrete events with context (what happened).
- **Metrics**: aggregated numeric measurements over time (request rate, error rate, latency percentiles — the "RED" method: Rate, Errors, Duration for services, or "USE": Utilization, Saturation, Errors for resources).
- **Traces**: follow a single request as it flows across multiple services (essential in microservices to see where time was spent/where it failed across service boundaries) — each service adds a "span" to the trace, and spans are correlated by a shared trace ID propagated in request headers.
- **OpenTelemetry**: the emerging vendor-neutral standard in .NET for emitting all three, exportable to any backend (Application Insights, Jaeger, Prometheus/Grafana, Datadog) without vendor lock-in — increasingly the default over provider-specific SDKs.
```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddOtlpExporter());
```
- **Practical example**: a claim submission that's slow — without distributed tracing you'd have to manually correlate timestamps across `IntakeService`, `EligibilityService`, and `PaymentService` logs by hand. With tracing, one trace ID shows the whole request as a waterfall: 5ms in Intake, 800ms waiting on Eligibility's external call to an insurer API, 12ms in Payment — instantly pinpointing where the time actually went instead of guessing.
- **Common follow-up / trap**: "What's the difference between a metric and a log for alerting?" — you alert on metrics (cheap to store/query at scale, e.g. "p99 latency > 2s for 5 minutes"), and you use logs/traces to *investigate* once an alert fires. Trying to alert directly off raw logs at high volume is expensive and slow; that's precisely the problem metrics aggregation solves.

**Application Insights**
- Azure's APM (Application Performance Monitoring) service: auto-instruments ASP.NET Core apps for request/dependency tracking, exceptions, custom events/metrics, live metrics stream, and distributed tracing across Azure services — the "if interviewing for JD3, know this by name" answer for "how would you monitor a .NET app in Azure." Adding `builder.Services.AddApplicationInsightsTelemetry()` gets you request/dependency/exception tracking with almost no extra code, which is a big part of its appeal for teams that don't want to stand up their own OpenTelemetry collector pipeline.

**ELK / Grafana+Prometheus stack**
- ELK (Elasticsearch, Logstash, Kibana): centralized log aggregation and search/visualization — logs shipped from all service instances into one searchable place instead of SSH-ing into individual servers/pods (which, in Kubernetes, is often impossible after a pod is rescheduled anyway — the logs are gone unless centralized).
- Prometheus (metrics collection, pull-based scraping — Prometheus polls a `/metrics` endpoint on each service rather than services pushing to it) + Grafana (dashboards/alerting on top) — the standard open-source metrics/monitoring pairing, especially common alongside Kubernetes.

---

## 10. Identity / Auth — going deeper than "JWT exists"

**OAuth2 grant types**
- **Authorization Code (+ PKCE)**: standard for web/mobile apps with a login redirect — the recommended flow today, PKCE (Proof Key for Code Exchange) added to protect public clients (SPAs, mobile) that can't securely store a client secret; it binds the authorization code to the specific client instance that requested it via a dynamically generated code verifier/challenge pair, preventing a stolen auth code from being redeemed by an attacker.
- **Client Credentials**: service-to-service, no user involved — a service authenticates as itself using a client ID/secret to get a token (e.g. a nightly batch job calling an internal API needs a token but there's no human logged in).
- **Refresh Token**: used to get a new access token without forcing the user to log in again, once the short-lived access token expires.
- (Implicit flow is now considered legacy/discouraged — worth knowing it existed but that Auth Code + PKCE replaced it, because Implicit returned the access token directly in the browser URL fragment, exposed to things like browser history and referrer leaks.)

**Practical example**:
```csharp
// Client Credentials flow — a background service authenticating itself, no user
builder.Services.AddHttpClient("EligibilityApi")
    .AddClientCredentialsTokenHandler("eligibility-scope"); // conceptually — via Duende.AccessTokenManagement or similar

// Authorization Code + PKCE — a SPA/web app config (ASP.NET Core middleware)
builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddOpenIdConnect(options =>
    {
        options.ResponseType = "code";
        options.UsePkce = true; // on by default in recent versions, but worth knowing it's there
    });
```

**OAuth2 vs OpenID Connect (OIDC)**
- OAuth2 is about **authorization** (delegated access — "can this app act on my behalf for X," e.g. "can this app read my calendar"). OIDC is a thin identity layer on top of OAuth2 that adds **authentication** — the ID token (a JWT with user identity claims like `sub`, `email`, `name`), giving you "who is this user," not just "what can this app access." **Common trap**: people say "we use OAuth for login" when they mean OIDC — OAuth2 alone doesn't actually tell you who logged in, only what the token can access; conflating the two is a frequent, telling mistake in interviews.

**IdentityServer / Duende / Azure AD B2C**
- Options for centralizing authentication instead of hand-rolling it: **Duende IdentityServer** (commercial successor to the open-source IdentityServer4) implements OAuth2/OIDC as a standalone identity provider you host; **Azure AD B2C** is a managed customer-identity service (social logins, custom policies) so you don't run your own STS (Security Token Service); ASP.NET Core Identity is for simpler cases where you just need username/password + roles within your own app's database and don't need to be a full identity provider for other apps.

**Managed Identity (Azure)**
- Lets an Azure resource (App Service, Function) authenticate to other Azure services (Key Vault, SQL, Storage) without storing any credentials/connection secrets at all — Azure AD issues short-lived tokens automatically behind the scenes. The recommended way to access Key Vault from a .NET app in Azure instead of a stored client secret.
```csharp
var client = new SecretClient(new Uri("https://myvault.vault.azure.net/"), new DefaultAzureCredential());
var secret = await client.GetSecretAsync("PaymentGatewayApiKey");
// no connection string, no client secret in config — the App Service's own identity is the credential
```
- **Common follow-up / trap**: "What's the actual security benefit over a stored secret?" — a stored secret (even in Key Vault) still has to be fetched with *something* — a bootstrapping credential — which is itself a secret that can leak (in config, in source control by accident, in an env var dump). Managed Identity removes that bootstrapping problem entirely: there's no secret anywhere for an attacker to steal, because the identity is tied to the Azure resource itself and the token is short-lived and issued automatically.

---

## 11. NoSQL / Polyglot Persistence

**When would you reach for NoSQL over SQL Server?**
- High-volume, flexible/evolving schema data (e.g. product catalogs with wildly different attributes per category — a laptop and a t-shirt don't share the same fields, forcing an awkward EAV table design in SQL), extreme horizontal scale needs, document-shaped data that doesn't map well to relational tables, or key-value lookup patterns (session state, caching). SQL Server/relational still wins for strong consistency, complex joins/transactions, and well-understood tooling.
- **Practical example**: a claims platform's core `Claim`/`ClaimLine`/`Member` data — with strict referential integrity, financial totals that must reconcile, and complex reporting joins — belongs in SQL Server; ACID transactions matter when money's involved. But that same platform's audit-event log ("who viewed/edited claim X, when, what changed") is high-volume, append-mostly, rarely joined, and benefits from a document/NoSQL store's write throughput and flexible schema as the event shape evolves over time. This is **polyglot persistence** — using the right store per data shape rather than forcing everything into one database.

**Cosmos DB**
- Azure's globally-distributed, multi-model NoSQL database (document/SQL API most common in .NET via the `Microsoft.Azure.Cosmos` SDK). Key selling points: single-digit millisecond latency at scale, tunable consistency levels (from Strong to Eventual, 5 levels total — trade-off between consistency and latency/availability), automatic global replication across regions.
```csharp
var container = cosmosClient.GetContainer("ClaimsDb", "AuditEvents");
await container.CreateItemAsync(new AuditEvent
{
    Id = Guid.NewGuid().ToString(),
    ClaimId = "C-9081",
    PartitionKey = "C-9081", // choosing partition key is the single most important Cosmos design decision
    Action = "StatusChanged",
    Timestamp = DateTimeOffset.UtcNow
});
```
- **Common follow-up / trap**: "How do you choose a partition key?" — this is the classic Cosmos interview question. A bad partition key (low cardinality, or one that creates a "hot partition" where most traffic concentrates on one logical partition, e.g. partitioning by `TenantId` when one tenant is 90% of traffic) tanks throughput and can't be changed after the fact without a full data migration. Good practice: pick a key with high cardinality and even access distribution — often something like the entity's own ID or a composite of tenant+entity, not a low-cardinality field like `Status` or `Region`.

---

## 12. Infrastructure as Code & Deployment Extras

**IaC — Terraform / Bicep / ARM templates**
- Define infrastructure (App Services, databases, networking) as version-controlled code instead of manually clicking through the portal — repeatable, reviewable in PRs, environment-consistent (dev/staging/prod created from the same definitions, differing only by parameter values). ARM templates are Azure's native JSON format (verbose, rarely hand-written directly anymore); Bicep is Microsoft's newer, cleaner DSL that compiles down to ARM; Terraform is cloud-agnostic (HashiCorp), useful if the org runs multi-cloud or wants one tool across AWS/Azure/GCP.
```bicep
resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: 'claims-api-${environment}'
  location: resourceGroup().location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: { appSettings: [ { name: 'ASPNETCORE_ENVIRONMENT', value: environment } ] }
  }
}
```
```hcl
resource "azurerm_linux_web_app" "claims_api" {
  name                = "claims-api-${var.environment}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id
}
```
- **Practical example**: "we manually clicked through the portal to set up staging and it drifted from what's actually in prod" is a real, common failure mode IaC solves — with Terraform/Bicep, standing up a new environment (or recovering from a deleted resource) is `terraform apply` against the same definition, not tribal knowledge of "which 15 portal settings did we configure by hand 8 months ago."
- **Common follow-up / trap**: "What's the risk with `terraform apply` in production?" — IaC tools can *destroy and recreate* resources if a change requires it (e.g. renaming certain resource properties), which can mean unplanned downtime or even data loss if you're not careful with state and plan review. Always run `terraform plan` (or the ARM/Bicep what-if equivalent) and have a human review the diff before applying against production — the tool tells you exactly what it intends to create/modify/destroy before it acts.

**Feature flags / feature management**
- Ship code to production behind a flag, then turn the feature on for specific users/percentages without a redeploy — decouples deployment from release, enables trunk-based development (merge incomplete features safely, keeping `main` always deployable), and supports A/B testing/canary rollouts. .NET has `Microsoft.FeatureManagement`; Azure App Configuration has built-in feature flag support.
```csharp
if (await _featureManager.IsEnabledAsync("NewEligibilityEngine"))
{
    return await _newEligibilityEngine.CheckAsync(request);
}
return await _legacyEligibilityEngine.CheckAsync(request);
```
- **Practical example**: rolling out a rewritten eligibility-check algorithm — instead of a risky big-bang cutover, enable the flag for 5% of traffic, compare error rates/latency against the old path, ramp to 50%, then 100%, with the ability to flip back to the old code path instantly (no redeploy, no rollback) if something looks wrong.
- **Common follow-up / trap**: "What's the downside of feature flags?" — flag debt: flags left in code long after the feature is fully rolled out create permanent branching complexity and dead code paths nobody remembers the purpose of. Good practice is treating flag removal as part of the definition of done for the rollout, not an optional cleanup task that never happens.

---

### How to use this file in the interview
These are **secondary-depth** topics — you're not expected to whiteboard Kubernetes YAML from scratch, but naming the right pattern/tool, explaining the production problem it solves, and giving a concrete example signals current, practical experience beyond the JD's explicit list. The follow-up traps included above are worth rehearsing out loud — a senior candidate who can say "here's the trade-off, and here's when I'd choose differently" stands out much more than one who can only name the tool. If a question here comes up and you genuinely haven't used the tech, say so plainly and pivot to the closest thing you *have* used (e.g. "I haven't used Kafka directly, but I've used Azure Service Bus for the same pub-sub problem — conceptually similar, topics and subscriptions instead of partitions and consumer groups").
