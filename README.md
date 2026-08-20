# Makabongwe Training Institute

Production website for **Makabongwe Project (Pty) Ltd**, trading as Makabongwe Training Institute.

This project is a full-stack web application built to support agricultural training programme discovery, enquiries and CMS-managed content. It demonstrates practical experience with modern React/Next.js development, TypeScript, server-side APIs, Supabase, security controls, validation, testing and Vercel deployment.

## Live project

Live site: [makabongwe-training.edureach70.chatgpt.site](https://makabongwe-training.edureach70.chatgpt.site)

## Engineering highlights

- React 19 + Next.js 16 App Router
- TypeScript with explicit type checking
- Server-side REST-style API route for enquiries
- Supabase-backed enquiry storage and CMS content
- Resend transactional email integration
- Input validation and sanitisation
- Honeypot protection and abuse detection
- Rate limiting using salted IP hashes
- Environment-based secret management
- CMS fallback behaviour when Supabase is temporarily unavailable
- Responsive UI for desktop, tablet and mobile
- Linting, type checking, build validation and automated tests
- Production deployment on Vercel

## What the application does

The website includes:

- Conversion-focused homepage
- About, leadership, vision, mission and values
- Six agricultural service pillars
- Azibuye Emasisweni flagship poultry programme
- Structured 10-day poultry training journey
- Institutional partnership and impact information
- Programme enquiry workflow
- Supabase-backed CMS for services, programmes, qualifications, training days, delivery steps and values
- Responsive layouts across screen sizes

## Architecture

```text
Browser
  |
  v
Next.js application
  |-- React UI
  |-- Server components / routes
  |-- POST /api/enquiries
  |       |-- validation + sanitisation
  |       |-- abuse / honeypot checks
  |       |-- rate limiting
  |       |-- Supabase persistence
  |       `-- Resend notification
  |
  `-- CMS reads
          |-- Supabase
          `-- built-in fallback content
```

## Technology

- **Frontend:** React 19, Next.js 16, TypeScript
- **Backend:** Next.js server routes
- **Database / CMS:** Supabase
- **Email:** Resend
- **ORM / data tooling:** Drizzle ORM
- **Deployment:** Vercel
- **Quality:** ESLint, TypeScript, Node test runner

## Project structure

```text
app/
  about/          About and leadership
  contact/        Contact information and enquiry form
  partners/       Institutional partnership model
  programmes/     Flagship and packaged programmes
  services/       Six service pillars
  components/     Shared header, footer and UI sections
public/images/    Official logo and optimised website imagery
supabase/         Database migrations
scripts/          Validation and operational scripts
tests/            Automated tests
```

## Local development

### Requirements

- Node.js 22.13 or newer
- Supabase project
- Resend account and verified sender

Install dependencies and start development:

```bash
npm install
npm run dev
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Required environment variables:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY # legacy fallback
RESEND_API_KEY
RESEND_FROM_EMAIL
ENQUIRY_IP_HASH_SALT
```

Optional rate-limit overrides:

```text
ENQUIRY_RATE_LIMIT_MAX
ENQUIRY_RATE_LIMIT_WINDOW_SECONDS
```

Do not expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` or `ENQUIRY_IP_HASH_SALT` in client-side code.

## Quality checks

Create a production build:

```bash
npm run build
```

Run automated validation:

```bash
npm test
```

Run lint and type checking:

```bash
npm run lint
npm run typecheck
```

These checks are intended to catch build failures, type errors, lint problems and regression issues before deployment.

## Enquiry backend

The contact form posts to `POST /api/enquiries`.

The endpoint:

1. Validates and sanitises submitted data.
2. Applies field-length limits.
3. Rejects honeypot and suspicious submissions.
4. Rate-limits requests using a salted IP hash stored in Supabase.
5. Stores the enquiry in Supabase.
6. Sends a Resend notification.
7. Preserves the stored enquiry even if the email provider is temporarily unavailable.

Supabase migration:

```text
supabase/migrations/20260714155240_create_enquiries.sql
```

Apply the migration:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

## Content management

Published website content is read from:

```text
cms_services
cms_programmes
cms_training_days
cms_qualifications
cms_delivery_steps
cms_values
```

`sort_order` controls display order and `is_published` controls visibility. CMS reads occur server-side so privileged credentials are not exposed to visitors. RLS is enabled and direct `anon` and `authenticated` access is revoked.

If Supabase is temporarily unavailable, the site serves matching built-in fallback content instead of returning a broken page.

Operational status endpoint:

```text
GET /api/cms/status
```

A healthy connection returns HTTP 200 with `connected: true` and does not expose credentials or CMS row content.

## Skills demonstrated

This project is intended to show practical ability in:

- Building and shipping responsive web applications
- React and TypeScript development
- Backend API implementation
- SQL-backed application workflows
- Third-party service integration
- Secure handling of secrets and user input
- Error handling and graceful degradation
- Testing and code-quality checks
- Deployment and production support
- Turning business requirements into working software

## Business context

Makabongwe provides practical agricultural skills development, poultry enterprise support, food-security programmes, enterprise incubation, mentorship and end-to-end programme implementation from Richards Bay, KwaZulu-Natal.

## Copyright

© 2026 Makabongwe Project (Pty) Ltd. All rights reserved.
