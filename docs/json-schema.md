# JSON Schema

This document defines the JSON file structure used by GachaMe.

---

# Overview

Game data is divided into two categories.

- Base Data (Permanent content)
- Event Data (Monthly content)

The gacha engine combines these files dynamically when generating the item pool.

---

# Folder Structure

```
src/data/

rangers/
│
├── 7-normal.json
├── 7-ultra.json
├── 8-normal.json
└── 8-ultra.json

gears/
│
├── 5.json
├── 6.json
├── 7.json
├── 8.json
└── 9.json

events/
│
├── 2026-08/
│   ├── rangers/
│   │   ├── 8-normal.json
│   │   └── 8-ultra.json
│   │
│   └── gears/
│       ├── 9.json
│       ├── 8.json
│       ├── 7.json
│       └── 6.json
│
└── 2026-10/
    └── rangers/
        ├── 8-normal.json
        └── 8-ultra.json
```

---

# Ranger JSON

Permanent Rangers and Event Rangers use the same structure.

Example

```json
[
  {
    "Name": "Haruka",
    "Image": "https://gachame.github.io/images/rangers/u1602e-sh-thum.png",
    "UnitCode": "u1602e-sh"
  }
]
```

## Fields

| Field    | Type   | Required | Description      |
| -------- | ------ | -------- | ---------------- |
| Name     | string | ✅       | Display name     |
| Image    | string | ✅       | Image URL        |
| UnitCode | string | ✅       | Unique Ranger ID |

---

# Gear JSON

Permanent Gears and Event Gears use the same structure.

Example

```json
[
  {
    "Name": "Suo's Earrings",
    "Image": "https://gachame.github.io/images/gears/eq_2606_acc_08_icon.png",
    "ItemCode": "eq_2606_acc_08"
  }
]
```

## Fields

| Field    | Type   | Required | Description    |
| -------- | ------ | -------- | -------------- |
| Name     | string | ✅       | Display name   |
| Image    | string | ✅       | Image URL      |
| ItemCode | string | ✅       | Unique Gear ID |

---

# Base Data

The following files contain permanent game content.

```
rangers/
    7-normal.json
    7-ultra.json
    8-normal.json
    8-ultra.json

gears/
    5.json
    6.json
    7.json
    8.json
    9.json
```

Permanent data should rarely change.

---

# Event Data

Each event contains only newly released Rangers and Gears.

Example

```
events/
└── 2026-08/
    ├── rangers/
    │   ├── 8-normal.json
    │   └── 8-ultra.json
    │
    └── gears/
        ├── 9.json
        ├── 8.json
        ├── 7.json
        └── 6.json
```

Event files should only contain new content introduced in that event.

Do not duplicate permanent content.

---

# Pool Generation

The Gacha Engine generates the item pool by combining Base Data with Event Data.

Example

8★ Normal Rangers

```
rangers/8-normal.json

+

events/2026-08/rangers/8-normal.json
```

↓

Combined Pool

Example

9★ Gear

```
gears/9.json

+

events/2026-08/gears/9.json
```

↓

Combined Pool

The engine performs this process automatically.

---

# Validation Rules

The engine must validate every JSON file before use.

Checks include:

- No duplicate UnitCode values.
- No duplicate ItemCode values.
- Image field must not be empty.
- Every JSON file must be a valid array.
- Every object must contain all required fields.

Invalid JSON files must fail validation.

---

# Naming Convention

## Ranger Files

```
7-normal.json
7-ultra.json
8-normal.json
8-ultra.json
```

## Gear Files

```
5.json
6.json
7.json
8.json
9.json
```

## Event Folders

```
YYYY-MM
```

Example

```
2026-08
2026-10
2027-02
```

---

# Source of Truth

The following JSON files are the single source of truth.

- Base Ranger Data
- Base Gear Data
- Event Ranger Data
- Event Gear Data

Business logic must never duplicate data stored in these files.

All item pools must be generated dynamically from the JSON files.

Hardcoded Ranger or Gear data is not allowed.
