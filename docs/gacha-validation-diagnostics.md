# Gacha Engine Validation & Diagnostics

This document outlines the architectural details, mathematical validation procedures, and statistical verification suite implemented to ensure the reliability and precision of the GachaMe Gacha Engine.

---

## 1. Core Random & Weighted Selection Algorithm

The gacha simulation runs entirely on the client-side, using a generic two-stage weighted random selection algorithm. This architecture decouples structural pools from selection probabilities.

```
                  ┌──────────────────────┐
                  │      User Pull       │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │       Stage 1        │
                  │    Select Rarity     │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │    Isolate Pool      │
                  │   by chosen Rarity   │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │       Stage 2        │
                  │     Select Item      │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │    Return Outcome    │
                  └──────────────────────┘
```

### Stage 1: Rarity Selection
1. **Accumulate Rates**: Sum the configured probability percentages for all rarities (e.g. `8★ Ultra: 3%`, `8★ Normal: 5%`, `7★ Ultra: 22%`, `7★ Normal: 70%`).
2. **Generate Random Roll**: Roll a pseudo-random value $r \in [0, 100)$.
3. **Bucket Assignment**: Linearly search the cumulative thresholds. The rarity bucket corresponding to the interval containing $r$ is selected.
4. **Validation Constraint**: The sum of all rarity weights must equal exactly 100%.

### Stage 2: Item Selection
Once a rarity group is determined, the engine isolates items of that rarity and calculates individual probabilities dynamically:
1. **Identify Featured Items**: Gather items configured as featured for this banner.
2. **Allocate Explicit Rates**: Assign the configured featured rates to these items.
3. **Distribute Remaining Probability**: Calculate the remaining probability for non-featured items using the formula:
   $$\text{Remaining Rate} = \text{Rarity Rate} - \sum \text{Featured Rates}$$
4. **Divide Equally**: Divide the remaining rate equally among all non-featured items in this rarity pool:
   $$\text{Item Rate} = \frac{\text{Remaining Rate}}{\text{Total Non-Featured Items}}$$
5. **Selection Roll**: Roll a random value $r_2 \in [0, \text{Rarity Rate})$ and traverse cumulative item probability bounds to select the final item.

---

## 2. Validation Methodology

Before a banner is allowed to resolve pulls, it must pass a strict validation check:
* **Sum of Rarity Rates**: Total must equal 100% (with a precision threshold of $\pm 0.001\%$).
* **Featured Existence**: Every featured item ID in the banner config must correspond to a valid item loaded in the global pool.
* **Rate Limits**: The sum of all featured rates inside a given rarity must not exceed that rarity's total rate.
* **Negative Remainder Prevention**: The remaining rate after featured allocation must be $\ge 0$.

If any check fails, the configuration is rejected, and an exception is raised before any random calls execute.

---

## 3. Unit Testing & Determinism

A comprehensive unit test suite is built directly into the developer console (`src/utils/engineDiagnostics.ts`) to ensure mathematical boundaries behave correctly:
1. **Rarity Mapping**: Verifies boundary transitions (e.g., transitions at 70%, 92%, and 97%).
2. **Empty Pools**: Confirms that trying to pull from an empty pool triggers an exception.
3. **Single Item Pools**: Confirms that if a rarity contains only 1 item, it is pulled 100% of the time, regardless of its configured rate.
4. **Zero-Weight Items**: Confirms that items with an explicit 0% rate are never drawn.
5. **Decimal Weights**: Assures floating-point coordinates map to precise fractional ranges (e.g., `0.333%` rate).
6. **Large Weights**: Confirms that forcing a rarity rate to 100% results in that rarity being drawn exclusively.
7. **Validator Rejections**: Assures that invalid configurations (e.g., sums != 100%, negative remaining rates) are rejected.
8. **PRNG Matcher**: Runs simulations with mocked, identical pseudo-random number generator (PRNG) sequences, verifying that outcomes match exactly (identical seeds generate identical items).

---

## 4. Performance Benchmarks

Since simulations run entirely client-side, the engine has been optimized to maximize pulls per second to prevent browser freezes:
* **Benchmark Cases**: 100,000 pulls and 1,000,000 pulls.
* **Throughput**: Typically handles **1,500,000+ pulls per second** on modern desktop browser environments.
* **Memory Management**: Garbage collection overhead is minimized by recycling objects and keeping tracking records flat.

---

## 5. Limitations

* **Client-Side Dependency**: Performance and memory usage depend directly on the user's hardware and web browser JS engine optimization.
* **Floating Point Accuracy**: In javascript, floats are subject to double-precision binary floating-point representation. Rate checks use a small margin of tolerance ($10^{-5}$) to prevent rounding checks from rejecting valid configs.
