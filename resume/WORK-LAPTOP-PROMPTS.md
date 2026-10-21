# Prompts to run on the work laptop

Goal: pull out the concrete details of **your** Wizzer work so the resume can name
real systems, real numbers and real integrations instead of describing the product.

Run these in Claude on the company machine (it can see the repos, PRs and tickets).
Bring back the **answers**, not the code. Paste them into our chat and I'll turn them
into bullets.

**Before you paste anything back:** strip anything that shouldn't sit on a public
resume — internal hostnames, client names under NDA, credentials, unreleased product
names, anything your team would consider confidential. Scale numbers, technology
names and the shape of what you built are normally fine, but you know the rules
there better than I do. If in doubt, give me the rounded version ("millions of ticks
a day" rather than an exact figure from a dashboard).

---

## 1. What did I actually build? (start here — most important)

```
Look through my commits, branches and merged PRs in this org from January 2026 to
now. My git identity is Sharma Ketan (sharmaketann@gmail.com) — check `git log
--author` across the repos I've touched.

For each distinct system, service or major feature I worked on, give me:
  - the internal name of the system or service
  - what it does in one sentence
  - what specifically I built or changed in it (not what the team built)
  - the main technologies involved
  - roughly when, and whether I owned it or contributed

Rank them by how much of my work went into each. Be concrete and factual — do not
pad or guess. If my contribution to something was small, say so.
```

## 2. Numbers (the thing my resume is missing)

```
For the market-data and backtesting work I've done here, find me any real,
defensible numbers. Check dashboards, configs, load tests, monitoring, benchmark
results, PR descriptions and ticket comments. I want things like:

  - ticks/messages per second or per day through the market-data pipeline
  - number of instruments, symbols or exchanges covered
  - size of the ClickHouse dataset, or retention window
  - backtest throughput — strategies or runs per hour, bars processed
  - latency figures (p50/p95/p99) on anything I built
  - concurrent users / advisors / connected WebSocket clients
  - before-and-after on anything I optimised

For each number tell me the source and how confident you are. I need to be able to
defend these in an interview, so flag anything that's an estimate rather than
something measured.
```

## 3. The optimisation or fix I'm proudest of

```
Find the 3 changes I made here that had the biggest technical impact — a
performance win, a reliability fix, a migration, a redesign, a bug that mattered.

For each: what was wrong before, what I changed, and what measurably improved.
Point me at the PR or commit so I can check the details myself.
```

## 4. Integrations

```
List every external system I personally integrated or worked on here — brokers,
exchanges, market-data vendors, feeds, third-party APIs. For each, name it, say
what the integration does, and what I specifically did on it.

Also: how many of these are there in total across the platform, and how many did
I touch?
```

## 5. Scope and seniority signals

```
Based on my actual activity here — PRs, reviews, design docs, tickets — what
evidence is there of:
  - systems I own rather than just contribute to
  - design or architecture decisions I made
  - code reviews I did for others / people I mentored
  - cross-team work (with quant, frontend, infra, compliance)
  - incidents I handled or on-call work

Quote the specific evidence. If there's no evidence for one of these, say so
plainly rather than inventing it.
```

## 6. Stack check

```
List the actual technologies, libraries, databases and infrastructure I work with
day to day here, based on the code I've written — not what the company uses
generally. Separate "I've written real code in this" from "I've touched it once".
```

---

## What I'll do with it

Each answer becomes a bullet in this shape, which is the pattern that makes a
resume read as senior:

> **name the system** → **what you built in it** → **the technology** → **one number**

Example of the shape (not your work — yours will come from the answers above):

> Built the market-data ingestion service feeding the trading terminal, streaming
> ~N instruments over WebSocket into ClickHouse at ~N ticks/sec, cutting chart
> load times from Xs to Ys.

Three or four of those and the Wizzer section stops being the weakest part of the
resume. Rough notes are fine — I'll do the writing.
