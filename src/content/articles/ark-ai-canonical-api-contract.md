---
title: "A canonical contract for an OpenAI-compatible API"
description: "ARK AI parses once, rejects unknown fields, streams from the provider, bounds the agent loop, and makes usage accounting idempotent."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["ark-ai", "api", "streaming", "benchmark"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/ark-ai-canonical-api-contract.html"
draft: false
featured: true
relatedProjects: ["ark-ai"]
relatedDocs: []
---

OpenAI compatibility usually means accepting the union of what every provider tolerates. That is a support surface disguised as an API. A client sends a field that one provider ignores, another rejects, and a third interprets differently. The gateway forwards it, and the difference becomes an incident.

ARK AI's v2.5.0 ingress takes the opposite position. `/v1/chat/completions` has one canonical parse. That parse runs before plan resolution, before billing and before any provider call. The provider body is then rebuilt field by field from the canonical object. No caller-shaped field reaches a provider by accident.

## Parse once, then rebuild

The ordering is the design:

1. parse the request into the canonical shape;
2. reject unknown top-level fields at the HTTP edge;
3. resolve the plan and the billing consequences;
4. rebuild the provider request from canonical fields;
5. call the provider.

Unknown top-level fields are refused by default. There is one bounded opt-in for optional client metadata, which can be ignored instead of rejected. That exception is narrow on purpose: metadata is not allowed to become a second, unvalidated request surface.

`store: true` is refused by name rather than forwarded. The reason is concrete: a real OpenCode request carrying `store` is fatal on at least two providers, one rejecting the unknown name and another rejecting the extra field.

Rebuilding field by field is more work than spreading the input object into the provider call. It is also the only way to guarantee that a field the gateway did not validate cannot reach a provider. The cost is a mapping layer; the benefit is a contract that cannot drift with every client.

## Streaming without a fake stream

A synthesized stream is easy to spot: the gateway waits for the full provider response, then emits it as SSE chunks. The client sees a stream, but the first token arrives after the answer is already complete.

On the caller-harness path, ARK uses true provider streaming. The harness turn is a `ReadableStream` over `streamChatCompletionBackend`; upstream provider frames are forwarded as they arrive, so a delta reaches the caller while the provider stream is still open. Direct streaming and the harness path share one normalization, one sanitizer and one `[DONE]` terminator.

The error path is part of the contract. Every refusal that can be decided happens before the response object exists. A rejected request is a JSON 400 or 413, not a 200 SSE stream whose only content is an error frame.

Once visible text or tool calls have started, a later provider failure does not replace the answer with a duplicate fallback.

## The agent loop has numbers

A ReAct loop without caps is an infinite loop with a language model in the middle. ARK's loop is bounded at several levels.

The reasoning depth comes from a Lite classifier pass with tools, web and reasoning disabled, `temperature 0`, a 120-token cap and a five-second timeout. It selects `low`, `medium`, `high` or `xhigh` for the final agent turn. A timeout, provider failure, malformed payload, out-of-enum value or ambiguous double-object reply falls back to `medium`. The public product contract remains exactly `Instant` and `Thinking`; the selected depth is internal.

The loop itself is capped:

| Control | Limit |
| --- | --- |
| Tool-continuation turns by effort | `low 2`, `medium 4`, `high 6`, `xhigh 8` |
| Global continuation cap | 6, hard maximum 8 |
| Total model-requested tool calls | 18 |
| Tool calls in one turn | 6 |
| Identical repeated calls | Blocked after 3 |
| Concurrent read-only calls | 4 |

A repeated call is identified by canonical name plus stable JSON arguments. After three identical calls, the loop blocks with a bounded reason and allows one recovery turn instead of executing forever. A tool call whose arguments never closed is never executed, because running a partial JSON document could apply an unintended operation.

Read-only calls can run concurrently, capped at four. Writes, destructive actions, external calls and code execution stay strictly sequential. The decision comes from the existing `toolRisk` authority, not from the tool's name. Results are replayed to the model in the order the calls were emitted, so concurrency cannot scramble a turn.

These caps are a product decision. A task needing more than eighteen tool calls stops; a bounded failure is easier to diagnose than a loop that keeps spending.

## Accounting that does not double-charge

Usage accounting is downstream of generation, but it cannot be an afterthought. ARK uses an integer microUSD wallet with five operations: `topup`, `reserve`, `settle`, `release` and `refund`.

A reserve is one conditional atomic move from available to reserved, guarded by a balance check, so a concurrent request cannot drive the balance negative. Settlement and release are the two terminations of a reservation, both idempotent per `requestId`. An un-terminated reservation is reclaimable after its expiry.

The usage-ledger write is a `runId`-keyed idempotent upsert. A retry updates the same run record rather than creating a second charge. The run record carries `usageLedgerStatus` (`pending`, `completed` or `failed`) and the final usage snapshot as a reconciliation source.

The failure semantics are deliberate. A failed accounting step surfaces as a non-blocking `run.warning`, never as a failed request and never as silently successful accounting. A valid answer is not overwritten because a post-generation write failed, and the user still gets the answer.

Pay-as-you-go is opt-in and off by default. When enabled, a request is refused before the provider is contacted if the balance is insufficient, and billing counts public-visible tokens: the caller's canonical input and the text actually delivered.

## What the benchmark measures

The ARK Capability 100 is an internal benchmark, and its methodology is committed as data rather than prose. It is 100 closed-book questions, concurrency 1, no tools, no web, no LLM judge, no fuzzy matching and no partial credit. All 100 gold answers were independently verified. The run date is 2026-09-30, and the dataset hash is committed with the benchmark.

| Profile | Score | Unparseable |
| --- | --- | --- |
| LITE | 62 | 23 |
| FLASH | 75 | 17 |
| PRO | 93 | 4 |

The unparseable column matters. A score of 62 with 23 unparseable answers is not the same result as 62 with zero; the first says the model often failed to produce a parseable final answer, the second says it was wrong in a readable way.

The vision caveat is also explicit. Four cases in the set carry images, and the production perception path returned empty visual context for all four in this run. The benchmark reports that the public score is not a vision score.

## What this does not prove

The benchmark is self-run, not an independent ranking; scores come from one run, not a distribution. It does not compare ARK against external models, and it does not measure tool use, web research or long-running agent work, because those are excluded by design.

The source is private and has no license file, so no open-source claim or repository link is made. The public contract is documented; internal provider routing is not.

Strict canonical parsing has a cost: a client that sends a vendor extension the gateway does not know will be rejected. That is a compatibility trade, not a bug. The committed compatibility fixture proves the canonical-parse behavior for a real OpenCode request; it does not prove that every client will work.

The API version, model catalog and prices are product facts that change. Nothing here is a claim about uptime, customer counts or external benchmark standing. The durable part is the shape: parse once, rebuild the provider body, stream from the provider, bound the loop, and make the ledger idempotent.

For the product context, see the [ARK AI case study](/work/ark-ai.html).
