# Makabongwe Training Institute

A production web application for Makabongwe Project (Pty) Ltd, an agricultural training provider based in Richards Bay, KwaZulu-Natal.

Live site: https://www.makabongwe.network

## Overview

The project supports programme discovery, enquiries and CMS-managed content for Makabongwe's agricultural training work. It combines a modern React interface with server-side routes, database-backed content and production deployment on Vercel.

I use this project as one of my main portfolio examples because it reflects work around a real organisation, real content and real operational requirements rather than a demo-only interface.

## Technology

- React 19
- Next.js 16
- TypeScript
- Supabase
- Drizzle ORM
- Resend
- Vercel
- ESLint and automated tests

## What the application does

- Presents Makabongwe's agricultural services and programmes
- Explains accredited qualifications and training pathways
- Publishes CMS-managed programme and service content
- Accepts structured programme enquiries
- Stores enquiry data server-side
- Sends enquiry notifications through Resend
- Provides responsive layouts across desktop, tablet and mobile
- Falls back to built-in content if the CMS is temporarily unavailable

## Enquiry workflow

The contact form posts to `POST /api/enquiries`.

The server route:

1. Validates and sanitises submitted fields.
2. Applies field-length limits.
3. Rejects honeypot and suspicious submissions.
4. Rate-limits requests using a salted IP hash.
5. Stores accepted enquiries in Supabase.
6. Sends a notification through Resend.
7. Keeps the stored enquiry even if email delivery temporarily fails.

This keeps validation, persistence and notification logic on the server instead of trusting the browser.

## Content management

Website content is read from CMS tables for services, programmes, training days, qualifications, delivery steps and organisational values.

CMS access happens server-side so privileged credentials are not exposed to visitors. Published content can be managed without hard-coding routine updates into page components.

If the CMS is unavailable, the application can serve matching fallback content rather than returning a broken page.

## Security and reliability

The project includes:

- Environment-based secret management
- Input validation and sanitisation
- Honeypot abuse protection
- Request rate limiting
- Server-side database access
- Restricted direct access to privileged CMS data
- Graceful fallback behaviour
- Build, lint, type-check and test scripts

## Project structure

```text
app/
  about/
  contact/
  partners/
  programmes/
  services/
  components/
public/images/
supabase/
scripts/
tests/
```

## Local development

Requirements:

- Node.js 22.13 or newer
- Supabase project
- Resend account with a verified sender

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Run project checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use `.env.example` as a reference for local configuration. Real database, email and security credentials should never be committed to the repository.

## Project context

Makabongwe provides agricultural skills development, poultry enterprise support, food-security programmes, enterprise incubation and mentorship. Building the application required translating those business requirements into a maintainable production system rather than designing around placeholder content.

## Status

Active production project.

Copyright 2026 Makabongwe Project (Pty) Ltd.
