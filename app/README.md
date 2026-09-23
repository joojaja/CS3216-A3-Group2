# Wearabouts web application

This directory contains the Next.js application. See the [repository README](../README.md) for service setup and product context.

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Fill the service variables in `.env.local` to use real accounts and private wardrobe storage. Without them, development mode offers a labelled preview with no persistence. Never commit `.env.local`.

## Checks

```bash
npm run lint
npm test
npm run build
```

Tests use Node's built-in runner with TypeScript support, requiring Node 22.18 or newer. No test dependency is added. Next.js supports `npm run build -- --webpack` when the local Turbopack process cannot run.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public editorial landing page |
| `/login` | Sign in or register |
| `/auth/callback` | Exchange an email-confirmation code for a session |
| `/onboarding` | Optional preferences and first confirmed wardrobe item |
| `/wardrobe` | Private wardrobe grid |
| `/wardrobe/new` | Upload and confirm a new item |
| `/wardrobe/[id]` | Item detail and editing |
| `/wardrobe/today` | Rule-first daily outfit feed |
| `/wardrobe/outfits` | Saved outfits |
| `/planner` | Occasion-based outfit planner |
| `/evaluator` | Purchase evaluator |
| `/explore` | Curated product feed (needs at least five confirmed items) |
| `/style` | Colour and style archetype breakdown |
| `/sizing` | Size-chart and shopping-screenshot checker |
| `/profile`, `/profile/measurements` | Preferences, sizes and privacy controls |
| `/privacy` | Data-use explanation and analytics controls |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image` | Search and social metadata |

Onboarding reuses the existing profile action and `ItemUploader`. Its resume marker in auth user metadata controls presentation only. It never grants access. Completion is checked against the authenticated user's confirmed wardrobe items.
