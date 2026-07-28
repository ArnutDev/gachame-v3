# Data Format

## Rangers

Each Ranger should contain:

- id
- name
- rarity
- type
- image
- event
- releaseDate

---

Example

{
"id": "ranger_a1",
"name": "A1",
"rarity": "8_normal",
"type": "collab"
}

---

## Gears

Each Gear should contain:

- id
- name
- rarity
- image
- event

---

## Banner

Each Banner contains:

- id
- name
- type
- featuredItems
- featuredRates
- active
- startDate
- endDate

Example

{
"id": "collab_boost_1",
"type": "boost",
"featuredItems": [
"A1",
"B1",
"A2",
"B2"
]
}

---

Rules

IDs must be unique.

Items referenced by banners must exist.

The engine calculates probabilities automatically.

Configuration should never contain duplicated data.
