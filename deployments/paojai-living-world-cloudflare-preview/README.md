# Paojai Living World — Cloudflare Pages Preview

Status: PREVIEW ONLY / ADDITIVE / NO PRODUCTION REPLACEMENT
Date: 2026-08-28

## Purpose
Isolated Cloudflare Pages target for testing Paojai Living World UX v2 without modifying the current Vercel production project or the existing `deployments/paojai-living-world/index.html`.

## Cloudflare Pages settings
- Git repository: `weuroo/csit`
- Production branch for this isolated preview project: `preview/living-world-cloudflare-pages-20260828`
- Root directory: `deployments/paojai-living-world-cloudflare-preview`
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `.`
- Environment variables: none required
- Recommended build watch include: `deployments/paojai-living-world-cloudflare-preview/**`

## Data / API
- Living World API: `https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/paojai-world-public`
- Mission World API: `https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/paojai-mission-public`
- Both endpoints are GET/OPTIONS read-only and currently return `Access-Control-Allow-Origin: *`, so a Cloudflare Pages origin can read them without a backend change.

## Safety boundaries
- Read-only visualization only.
- No client data added.
- No credential, permission, authority, production action, or automation change.
- Existing Vercel production remains untouched and is the rollback/fallback.
- This directory is a new deployment target and does not overwrite the existing Living World directory.

## Promotion gate
Do not replace the current production domain during the active stabilization / feature freeze. After stabilization exit, verify the Cloudflare preview on iPhone, confirm API/CORS and public-safe behavior, then obtain explicit Owner approval before any production domain migration.

## Rollback
Delete or disable the isolated Cloudflare Pages project. No existing production file or Vercel project needs to be changed.
