# Gacha System

## Philosophy

The entire gacha system is configuration-driven.

Business logic must never contain event-specific rules.

---

# Source of Truth

Game data comes only from JSON files.

The engine calculates everything dynamically.

Never hardcode:

- Ranger count
- Gear count
- Featured characters
- Featured gears

---

# Ranger Rarities

Supported rarities:

- 7★ Normal
- 7★ Ultra
- 8★ Normal
- 8★ Ultra

Each rarity owns a total probability.

Items inside the rarity share that probability.

---

# Gear Rarities

Supported:

- 9★
- 8★
- 7★
- 6★
- 5★

---

# Probability

Random generation happens in two stages.

Stage 1

Select rarity.

Stage 2

Select item inside rarity.

---

# Featured Items

Featured items are configured.

The engine supports:

- zero featured items
- one featured item
- multiple featured items

There is no limit.

---

# Automatic Distribution

Configuration defines:

- rarity probability
- featured probability

The remaining probability is distributed equally among all remaining items in the same rarity.

---

# Dynamic Pools

Pools are built from JSON.

If JSON changes:

- pool changes
- rates change

without modifying business logic.

---

# Banner Types

Supported examples:

- Normal
- Boost
- Collaboration
- Gear
- Limited

New types can be added without modifying the engine.

---

# Validation

Validate:

- probability totals
- duplicate ids
- invalid rarity
- missing featured item
- invalid references

Invalid banners must fail validation.

---

# Extensibility

Future developers should only create JSON files.

The engine should not require changes.

This is a core project requirement.
