# 04 — Vendor-neutral vocabulary and cloud mapping (approved)

## Canonical concepts, not universal provider resources

| EN UI | ES UI | Model meaning | Not interchangeable with |
|---|---|---|---|
| Compute Instance | Instancia de cómputo | One **abstract unit** of processing capacity, with fixed concurrent slots | AWS task, pod, VM, Lambda runtime, OS worker (each differs) |
| Concurrency slots | Espacios de concurrencia | Number of requests an abstract instance may process at once | CPU threads/cores, users, RPS |
| Incoming RPS | Solicitudes entrantes por segundo | Demand reaching the model | Number of users |
| Processing time | Tiempo de procesamiento | Duration an origin request holds a processing slot | Full client latency |
| Queue capacity | Capacidad de cola | Number of *waiting* requests allowed, excluding active work | Compute capacity |
| Cache hit | Acierto de caché | Eligible saved response avoids origin computation | Guarantee for every request |
| Rate limit | Límite de solicitudes | Ingress gate that may return 429 | Autoscaling or response caching |
| Horizontal scaling | Escalamiento horizontal | Add or remove processing units | Making one unit faster (vertical scaling) |
| Automatic scaling | Escalamiento automático | Model-driven bounded changes in active unit count | Any specific AWS/Azure built-in policy |
| Provisioning delay | Tiempo de aprovisionamiento | Wait between scheduling an added unit and making it usable | Network round-trip or HTTP latency |
| Cooldown | Período de espera | Minimum pause between scaling decisions in this model | Actual platform policy guarantee |

## Why “worker” is not the universal label

Depending on environment, *worker* might mean a process, thread, server, queue consumer or managed runtime. Even “instance” differs by platform. **Compute Instance** is our deliberately simplified, explicitly declared abstraction. Every learner must be able to read this in the glossary.

## Illustrative provider mappings — NOT 1:1 equivalence

| Concept | AWS example | Azure example | Caveat |
|---|---|---|---|
| Active service capacity | ECS service *tasks*; Lambda *execution environments* | App Service *instances*; Azure Functions *host instances* | Execution, billing, quotas and concurrency are fundamentally different. |
| Concurrency | App processing in ECS tasks; Lambda concurrency settings | HTTP concurrency / per-instance behavior in Azure Functions | One slot in our model is not a universal platform setting. |
| Scaling out | ECS desired service task count and autoscaling | App Service scale-out; Functions event-driven scale-out | Policies, cold starts, metrics, targets, delays and limits differ. |
| Cache | CloudFront / app or edge cache | Azure Front Door / app or edge cache | Ordering relative to rate limit depends on architecture. |
| Throttling | AWS API Gateway throttling / app middleware | Azure API Management policies / app middleware | Policies and returned codes vary. |

Do **not** label an engine trace “AWS autoscaling”; at most say “Conceptually similar to scaling out compute capacity, a common cloud pattern.” In technical glossary include the cloud examples above with an explicit disclaimer.

## Important cross-cutting distinctions

- Concurrency != requests/sec; a processing slot can finish multiple short requests each second.
- In this model capacity approximation under stable load is `effectiveInstances * slotsPerInstance / (processingTimeMs/1000)` **origin** completions/sec; it is not a cloud promise.
- Additional queue capacity mostly changes *waiting and rejection timing*, not core processing capacity.
- Cache applies only to eligible GETs in the MVP; MISS may still overload the origin.
- Rate limiting rejects before cache in **our chosen model**; in production the request pipeline can differ.
- **Auto scaling has provisioning delay, cooldown and a maximum**. Scaling when demand spikes cannot necessarily prevent immediate queueing or 503s.
- 429 means admission throttling; 503 is this simulator's overflow outcome. Neither should be conflated with a client timeout or necessarily 504.
- No synthetic CPU, memory, cloud costs, network bandwidth or platform replica guarantees.

## Sources for the cross-provider reference (verified 2026-11-23)

- [AWS ECS autoscaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/capacity-autoscaling-best-practice.html)
- [AWS Lambda execution environments/concurrency](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [Azure App Service automatic scaling](https://learn.microsoft.com/en-us/azure/app-service/manage-automatic-scaling)
- [Azure Functions concurrency](https://learn.microsoft.com/en-us/azure/azure-functions/functions-concurrency)
- [Azure Functions event-driven scaling](https://learn.microsoft.com/en-us/azure/azure-functions/event-driven-scaling)
- [MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [MDN caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429)
- [MDN 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503)

Keep example references separate from engine data. Re-check provider details before publishing evergreen claims.
