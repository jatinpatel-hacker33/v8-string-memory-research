# v8-string-memory-research
Independent research on V8 SlicedString and ConsString behavior, substring memory retention, and JavaScript string allocation.
# V8 String Memory Behavior Research

## Overview

An independent, bounded investigation of JavaScript string representations in V8, focusing on `SlicedString`, `ConsString`, substring retention, and memory reclamation.

This project explores how string representation and copying behavior can affect memory usage in Chrome.

## Research Questions

- When does V8 represent a substring as a `SlicedString` rather than copying it?
- Can a small substring keep a larger parent string reachable?
- How do concatenation methods behave in bounded local tests?
- What are the limitations of measuring JavaScript heap usage?

## Environment

- Browser: Chrome 156.0.8078.48
- Runtime: Headless Chrome / V8 build family
- Test scope: Local, bounded experiments
- Largest parent string: approximately 4 MB

The exact V8 revision corresponding to the tested Chrome build has not yet been independently pinned.

## Key Observations

- In the tested environment, substring lengths around the 13-character boundary showed different memory-retention behavior.
- V8 source code inspected during this research defines `SlicedString::kMinLength` as 13.
- A retained substring may keep its parent string reachable.
- Tested copying strategies showed different memory-retention outcomes.
- Memory usage returned close to baseline after references were dropped and garbage collection was triggered in the tested cases.

## Source-Level Analysis

The inspected V8 source includes:

- `src/objects/string.h`
- `src/heap/factory.cc`
- `docs/objects/strings.md`

These sources describe V8 string representations and the logic used to create sliced or copied substrings.

Source links:
- https://chromium.googlesource.com/v8/v8/+/refs/heads/main/src/objects/string.h
- https://chromium.googlesource.com/v8/v8/+/refs/heads/main/src/heap/factory.cc
- https://chromium.googlesource.com/v8/v8/+/refs/heads/main/docs/objects/strings.md

These links point to the main branch, not a revision pinned to the tested Chrome version.

## Reproduction — Node.js cross-check

The sections above describe the original Chrome-based observations. `node-repro.js` is a small,
independently runnable script added later, in a **different V8 host embedding (Node.js, not
Chrome)**, so the repo has at least one experiment anyone can execute and verify themselves
instead of relying only on narrative description. It is not a reproduction of the exact original
methodology — it's a separate, smaller cross-check.

```bash
node --expose-gc node-repro.js
```

Actual output from this environment (Node v20.18.1, linux x64), unedited:

```
V8 (Node.js) substring memory-retention cross-check
Node version: v20.18.1, platform: linux x64

[short-substring] substring length = 10, gc available = true
  baseline heap:            2.83 MB
  after building 4MB parent: 4.19 MB (delta 1.36 MB)
  after slice + drop parent: 8.19 MB
  after forced GC:           2.82 MB (delta from peak: -1.37 MB)

[long-substring] substring length = 5000, gc available = true
  baseline heap:            2.83 MB
  after building 4MB parent: 4.11 MB (delta 1.29 MB)
  after slice + drop parent: 8.11 MB
  after forced GC:           6.83 MB (delta from peak: 2.72 MB)

Summary:
  short-substring: heap retained after GC vs baseline = -0.00 MB
  long-substring: heap retained after GC vs baseline = 4.00 MB
```

**Reading this result:** the 10-character substring (below the ~13-character boundary cited in
Key Observations above) let the heap return fully to baseline after GC — consistent with V8
copying a short substring rather than creating a `SlicedString` that references the parent. The
5,000-character substring retained ~4MB after GC — consistent with a `SlicedString` keeping the
~4MB parent string reachable through the small child string. This is a heap-size measurement, not
a retaining-path proof (no heap snapshot was captured here either — see Limitations).

## Limitations

- Heap measurements are approximate and do not independently identify individual retaining references.
- A heap snapshot proving the object-retention graph was not obtained.
- Results were collected in a bounded, local test environment.
- Results do not establish a security vulnerability or exploitable impact.

## Conclusion

The experiments document observed V8 string-memory behavior and compare it with the inspected implementation.

The original historical Chromium string-concatenation issue was not reproduced in the tested Chrome environment. The substring-retention behavior observed here appears consistent with an intentional representation trade-off, but this research does not establish a new security defect.

## Disclaimer

This is independent technical research, not an official Chromium finding, security advisory, or claim of vulnerability discovery.
