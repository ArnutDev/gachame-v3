# Probability Engine

## Overview

The gacha engine performs random selection in two stages.

```
Pull

↓

Stage 1
Select Rarity

↓

Stage 2
Select Item

↓

Return Result
```

Business logic must never select an item directly from all available items.

---

# Stage 1 - Select Rarity

The engine first selects a rarity based on the configured rarity probabilities.

Example (Ranger)

| Rarity    | Probability |
| --------- | ----------: |
| 8★ Ultra  |          3% |
| 8★ Normal |          5% |
| 7★ Ultra  |         22% |
| 7★ Normal |         70% |

Example (Gear)

| Rarity | Probability |
| ------ | ----------: |
| 9★     |          1% |
| 8★     |          2% |
| 7★     |          3% |
| 6★     |         46% |
| 5★     |         48% |

The rarity probabilities must always total 100%.

---

# Stage 2 - Select Item

After a rarity has been selected, the engine selects one item from that rarity.

The probability of each item is calculated dynamically.

Example

```
Selected rarity

↓

8★ Normal

↓

Build pool

↓

Calculate probabilities

↓

Random item
```

---

# Featured Item Calculation

Banner configuration defines:

- featured items
- featured probabilities

Example

```
8★ Normal

Total rarity rate

5%

Featured

A1 = 0.88%

B1 = 0.88%

Remaining

3.24%

Remaining characters divide equally.
```

The engine performs this calculation automatically.

Developers should never manually assign every character probability.

---

# Remaining Rate Distribution

Formula

```
Remaining Rate

=

Rarity Rate

-

Sum(Featured Rates)
```

The remaining rate is distributed equally across every non-featured item in the same rarity.

---

# Dynamic Pool

Pools are generated from JSON.

The engine counts:

- total items
- featured items
- non-featured items

at runtime.

Never hardcode counts.

---

# Random Flow

```
User Pull

↓

Load Banner

↓

Load Ranger / Gear Pool

↓

Select Rarity

↓

Calculate Item Probabilities

↓

Select Item

↓

Return Result
```

---

# Validation

Before using a banner, validate:

- rarity totals = 100%
- featured items exist
- featured rate <= rarity rate
- remaining rate >= 0
- every item belongs to the correct rarity

Invalid banners must fail validation.

---

# Engine Rules

The probability engine must:

- be deterministic
- be reusable
- never depend on React
- never depend on UI
- never contain event-specific logic
- calculate everything from JSON configuration
