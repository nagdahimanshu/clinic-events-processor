# Architecture Decisions & Trade-offs

This document explains the key architectural decisions I made and why. I'll walk through the trade-offs.

## Why Express Instead of Lambda?

I chose Express instead of Lambda because I think development speed matters a lot. With Express, I can make a code change and test it in about 30 seconds. With Lambda, I would need to build, deploy and then test which means I would get maybe 2-3 iterations done instead of 10+.
The good thing is that I designed the architecture so the domain logic is completely framework-agnostic. Whenever it's needed to scale, migrating to Lambda would be straightforward. The core business logic wouldn't need to change at all.

## Incremental Analytics

Instead of accumulating all rows in memory and then calculating analytics at the end, I calculate them as rows stream in. This means memory usage is O(weeks) instead of O(rows).

## Modular Structure

I organized the code into clear layers: Routes → Controllers → Services → Domain.
- The domain logic has zero dependencies so it's easy to test it
- Services can be extended (S3 → Local, Slack → Email) without touching business logic
- When migrating to Lambda, I only need to change the routes/controllers layer

## Optional S3

I made S3 upload configurable via a `SKIP_S3` flag. This means you can develop and test locally without needing AWS credentials or setting up an S3 bucket. Just set `SKIP_S3=true` and it processes files directly from the HTTP stream.

## Summary

I built this with scalability in mind but prioritized development speed for the challenge. The architecture is modular and migration-friendly. Whenever it's needed to scale, migrating to Lambda is straightforward because the domain logic is framework-agnostic.

The main trade-offs were:
- Express for speed now, Lambda-ready for later
- Incremental analytics for scalability (more complex code but handles any file size)

The code is production ready in terms of patterns (logging, metrics, error handling) and the structure makes it extensible.
