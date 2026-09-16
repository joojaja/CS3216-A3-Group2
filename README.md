# CS3216-A3-Group2

Repository for CS3216 Assignment 3, Group 2. The product is called Drape.

Drape is a wardrobe-first clothing assistant for Singapore. Users photograph their clothes, get outfits matched to the occasion and the live NEA weather forecast, and check whether a prospective purchase is redundant before buying.

## Team

<!-- Add matriculation numbers, names and contributions before submission -->

| Matriculation no. | Name | Contributions |
| --- | --- | --- |
| | | |

- Application URL: TBD
- Repository: https://github.com/joojaja/CS3216-A3-Group2

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + Motion (`motion/react`) for animation
- Supabase: Postgres, Auth, private Storage, row-level security
- Google Gemini via the Vercel AI SDK for multimodal extraction and structured outputs
- NEA weather forecasts via the data.gov.sg open API
- Hosting: Vercel (planned)

## Getting started

```bash
cd app
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

### Supabase setup

1. Create a free project at supabase.com
2. Paste `app/supabase/schema.sql` into the SQL editor and run it. This creates all tables, row-level security policies, the private `wardrobe-images` bucket, and the profile auto-creation trigger. The file resets everything it owns first, so it is also how you wipe and rebuild the database
3. Copy the project URL and publishable key into `.env.local`
4. Under Authentication, turn off email confirmation for development. The built-in mailer only delivers to your own team's addresses and allows two emails an hour

### Gemini setup

Get a free API key from Google AI Studio and put it in `GOOGLE_GENERATIVE_AI_API_KEY`.

## Repo layout

- `app/` — the Next.js application
- `app/supabase/schema.sql` — the whole database schema in one file
- `AGENTS.md` — product spec, constraints and agent rules
- `UNSLOP.md` — writing style rules applied to all user-facing copy

## Resources used

<!-- List significant tutorials, templates and references here before submission -->
