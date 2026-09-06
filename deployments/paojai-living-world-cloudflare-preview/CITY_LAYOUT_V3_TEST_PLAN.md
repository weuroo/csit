# Paojai Living World — City Layout v3 Test Plan

Status: PREPARED / NOT ACTIVE
Production effect: NONE
Activation gate: after current stabilization period is complete and clean.

## Deterministic layout
- Same input identities + places must return the same coordinates across refreshes.
- No random drift between page loads.

## Collision / spacing
- Place-to-place overlap count = 0 at default sizes.
- Residence-to-residence overlap count = 0.
- Minimum visual gap target: 34px homes, 54px activity places.
- PM Studio, Town Center, and district landmarks retain breathing room.

## Spatial balance
- No district should contain >40% of all non-home activity places unless supported by plan.
- Residential identities split between southwest and southeast neighborhoods.
- Open-space target remains >=30% of logical city canvas.

## Capacity
- Candidate destination is rejected when occupancy >= capacity.
- Small social locations do not become crowd sinks.
- Full locations create alternative destination selection, not stacked avatars.

## Routes
- Character routes hidden by default.
- Selecting a person may reveal only that person's route.
- Roads remain visible independently from character route overlays.

## Day / night
- Night-only places unavailable outside active window.
- Work obligation overrides leisure.
- Night activity does not force every resident out of home.

## Movement safety
- No more than 20% of population starts relocation in the same 5-minute window without an explicit event.
- Movement cooldown is identity-specific.
- No synchronized mass movement caused solely by scheduler ticks.

## Experience integrity
- A completed trip does not count as life progress by movement alone.
- Target >=90% of completed trips produce an evidence-backed experience record.
- Conversation only occurs when encounter/context evidence exists.
- No fabricated conversation for visual activity.

## Data boundary
Must never expose:
- client content
- credentials
- permission details
- internal decision logic
- raw chain-of-thought
- SECURITY_COMMAND

## Residence truthfulness
- AI residences use verified `pm_ai_agent_homes_v1` identities.
- NPC residences remain visibly SHADOW until a verified backend home identity exists.

## Rollback
Activation must be one wiring change only. Rollback = remove City Layout v3 loader and return to current preview layout-fix without data migration.
