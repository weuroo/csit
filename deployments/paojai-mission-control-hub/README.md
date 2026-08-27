# Paojai Mission Control Hub

Isolated frontend source for a new Vercel project only.

## Purpose
Show every current and future mission from `pm_autodev_missions_v1` in one mission portfolio, with a dedicated mission view for progress, stage/state, blocker, next action, active contracts, AI owners, and success criteria.

## Backend
Read-only Supabase Edge Function: `pm-mission-control-data`

## Security
- Uses the existing read-only monitor token/session contract.
- Token is never embedded in source and is stored only in browser `sessionStorage`.
- No write actions.
- No client send.
- No production authority expansion.

## Deployment rule
Create a NEW Vercel project named `paojai-mission-control-hub` with Root Directory:

`deployments/paojai-mission-control-hub`

Do not bind this directory to any existing Vercel project.
