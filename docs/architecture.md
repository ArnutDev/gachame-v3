# Architecture

## Overview

The application is completely client-side.

The UI should never contain business logic.

Business logic belongs inside the Gacha Engine.

---

# Layer Structure

Pages

↓

Components

↓

Hooks

↓

Engine

↓

Configuration

↓

JSON Data

---

# Folder Structure

src/

pages/

components/

hooks/

engine/

services/

types/

utils/

data/

---

# Gacha Engine

The engine is responsible for:

- Building pools
- Calculating probabilities
- Selecting rarity
- Selecting items
- Validation

The engine should not know anything about React.

---

# UI Responsibilities

UI only:

- Displays banners
- Starts pulls
- Shows animations
- Displays results

UI never calculates probabilities.

---

# Configuration

Configuration controls:

- Active banners
- Featured items
- Rates
- Events

Business logic should never be modified when a new event starts.

Only configuration changes.
