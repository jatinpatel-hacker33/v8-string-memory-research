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
