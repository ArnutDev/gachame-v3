# AGENTS.md

## Project Overview

GachaMe is a browser-based gacha simulator for LINE Rangers.

The application runs entirely on the client side.

There is:

- No backend
- No database
- No authentication
- No API server

Game data is stored as JSON files inside the project.

---

# Project Philosophy

Prioritize:

- Simple architecture
- Readable code
- Maintainability
- Reusability
- Performance
- Data-driven design

Avoid unnecessary complexity.

---

# Important Documentation

Always read relevant documentation before making changes.

- docs/architecture.md
- docs/gacha-system.md
- docs/data-format.md
- docs/ui-guidelines.md

---

# Coding Rules

Always:

- Use TypeScript strict mode
- Use React Functional Components
- Use Custom Hooks when appropriate
- Keep components small
- Prefer composition
- Reuse existing code
- Handle loading, empty and error states

Avoid:

- any
- duplicated code
- hardcoded values
- magic numbers

---

# Gacha Rules

Never hardcode:

- Banner data
- Ranger data
- Gear data
- Featured items
- Probability values
- Monthly events

Everything must come from configuration.

---

# JSON is the Source of Truth

All game content comes from JSON.

Never duplicate game data inside code.

Always derive pools dynamically.

---

# Separation of Concerns

React Components

↓

Hooks

↓

Gacha Engine

↓

JSON Configuration

Business logic must never exist inside UI components.

---

# Dependencies

Prefer browser APIs.

Avoid adding packages unless necessary.

---

# Git

Use Conventional Commits.

Examples:

feat:
fix:
refactor:
docs:
test:
style:
chore:

---

# Before Writing Code

Always:

1. Read existing code.
2. Read related docs.
3. Reuse components.
4. Explain major architectural decisions.

Never modify unrelated files.

---

# Definition of Done

A task is complete only if:

- TypeScript passes
- Build succeeds
- No duplicated logic
- Documentation updated when required

---

## Project Initialization

- The repository root is the project root.
- Never create nested React/Vite projects.
- Never create folders such as temp-vite, client, app, frontend, or my-app unless explicitly requested.
- All generated files must be placed directly under the existing project root.
- Preserve existing documentation and configuration files.
