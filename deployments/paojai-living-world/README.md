# Paojai Living World

Public, read-only visualization layer for PM Agency Intelligence OS.

## Purpose
- Show AI residents as a living world without fabricating real work.
- Any AI with real active/overdue runtime contracts is visually moved to `PM_STUDIO_WORK_HUB`.
- When real work clears, the AI returns to the Living World daily plan.
- Public output is sanitized: no client names, private task content, security incident detail, credentials, or internal permissions.

## Public runtime
- Web Edge Function: `paojai-world`
- Public-safe data Edge Function: `paojai-world-public`
- Supabase project: `bvnmwfhqgdevupvcqqyl`

## Data layers
- `pm_paojai_world_public_agents_v1`
- `pm_paojai_world_public_summary_v1`
- `pm_paojai_world_daily_changelog_v1`
- `pm_paojai_world_event_history_v1`
- `pm_paojai_world_priority_board_v1`
- `pm_paojai_world_agent_snapshot_v1`

## Scheduled evolution
- `paojai-world-midnight-evolution-v1`: 00:00 Asia/Bangkok (17:00 UTC), deterministic daily theme/changelog/world-plan refresh.
- `paojai-world-story-recorder-v1`: change-only story capture every minute; inserts only when a public-safe location/activity/work-hub state changes.

## Safety
- Work-first.
- Public-safe only.
- No client data.
- No production authority expansion.
- Daily evolution changes simulation/display state, not permissions or autonomous authority.
- Code/capability changes remain gated and are not self-modified nightly.
