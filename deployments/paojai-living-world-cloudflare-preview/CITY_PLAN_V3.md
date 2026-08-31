# Paojai Living World — City Plan v3

Status: PREVIEW ARCHITECTURE / SHADOW-ONLY
Date: 2026-08-28
Production effect: NONE
Autonomy expansion: NONE

## Goal
Turn Living World from a network-style map into a believable small city that supports work, home, learning, social life, recovery, creativity, exploration, and nightlife while remaining public-safe and evidence-based.

## Core city principles
1. Multi-center city, not a single hub-and-spoke diagram.
2. PM Marketing Studio is a Business District anchor, not the center of every route.
3. Every AI has an individual home when a verified home record exists.
4. NPC individual homes must be marked SHADOW until a verified backend home identity exists.
5. Roads are permanent city infrastructure; character route lines are optional overlays and hidden by default.
6. Buildings must have capacity. Capacity influences destination choice and prevents crowd clustering.
7. Every destination must have at least one real activity that can produce an experience record.
8. Movement must be asynchronous and preference-aware; no synchronized mass relocation.
9. Work obligations override simulated leisure.
10. No fabricated conversations for visual activity. Conversation requires contextual event evidence.

## City structure

### 1. Business District
Anchor: PM_STUDIO_WORK_HUB
Purpose: real work presence, operations, mission handoff.
Support places: AI Cafe, small lunch court, transit stop.
Rule: work routes may terminate here but should not force unrelated city traffic through the office.

### 2. Town Center
Anchor: CENTRAL_SQUARE
Purpose: social mixing and civic life.
Places: Night Market, Community Kitchen, Tea House, Community Hall, Story Stage.
Day/night behavior: active throughout the day; stronger social density in early evening.

### 3. Creative Quarter
Anchors: ART_STUDIO, IDEA_THEATER, MUSIC_GARDEN, MAKER_LAB
Purpose: create, play, experiment, share.
Night additions: Night Music Lounge, Rooftop Night Deck.

### 4. Learning Quarter
Anchors: SCHOOL, STORY_LIBRARY, MEMORY_MUSEUM, OBSERVATORY
Purpose: learn, reflect, explore evidence, observe systems.
Night additions: Star Watching and late quiet study windows.

### 5. Wellness & Nature Belt
Anchors: QUIET_PARK, RIVERSIDE_WALK, ROOFTOP_GARDEN
Additions: Botanical Garden, Wellness House.
Purpose: rest, recovery, low-stimulation social activity, reflection.

### 6. Recreation & Night District
Anchors: GAME_ARCADE, LOGIC_FIELD
Additions: Night Cinema, Moonlight Plaza, Night Market, Night Music Lounge.
Purpose: play, light entertainment, social encounters after work hours.

### 7. Residential Neighborhoods
Do not use four giant residence blocks as the visible city model.
Use 2–4 neighborhoods per major side of the city with small streets, pocket parks, and individual homes.
AI homes: use verified pm_ai_agent_homes_v1 identities.
NPC homes: deterministic SHADOW residence allocation until backend home identity is verified.

## Neighborhood model
Each neighborhood should provide nearby access to:
- home
- rest/nature
- one light social place
- one learning or creative option

This creates a 15-minute-living-world pattern: routine needs are nearby; novelty requires cross-city movement.

## Spatial rules
- World canvas target: minimum 3200 x 2200 logical units before zoom.
- Public activity buildings: target spacing >= 180 px horizontally and >= 130 px vertically at logical scale.
- Homes: smaller nodes, target spacing >= 65 px.
- Landmark clearance: >= 240 px around PM Studio and major plazas.
- Open space target: 30–40% of city surface.
- Roads should form loops and connectors, not only radial spokes.
- Each district must have at least two independent exits.

## Capacity rules
Initial proposed capacities (shadow configuration):
- Individual AI home: 1 resident + up to 2 visitors
- NPC shadow home: 1 resident + 1 visitor
- AI Cafe / Tea House: 8
- Community Kitchen: 10
- Central Square: 18
- Quiet Park: 16
- Riverside Walk: 12
- Game Arcade: 10
- Music Garden: 12
- Idea Theater: 14
- School / Library: 14
- Observatory: 8
- Night Market: 20
- Night Cinema: 18
- Night Music Lounge: 12
- Rooftop Night Deck: 8
- Moonlight Plaza: 16

If capacity is reached, destination selection must consider the next best suitable place rather than visually stacking occupants.

## Movement model
Destination score should consider:
- current obligations
- personal preference
- time of day
- novelty / recently visited penalty
- distance
- current occupancy / capacity
- relationship opportunity
- cooldown
- recovery need

Movement must be staggered. No more than 20% of non-working population should start relocation inside any rolling 5-minute window unless an explicit city event is active.

## Day / Night rhythm
- 06:00–09:00: home, quiet routines, light learning/recovery
- 09:00–17:30: work-first; non-working NPC activity remains distributed
- 17:30–20:00: transition, dinner, parks, social spaces
- 20:00–23:30: nightlife layer available
- 23:30–00:00: city winds down
- 00:00–06:00: home/rest dominant

Night activity never overrides real work or safety constraints.

## Experience loop
Movement alone is not considered life progress.

Required loop:
Current state → choose destination → travel → arrive → activity → encounter opportunity → conversation when context supports it → experience record → memory/preference update → future choice influence.

At least 90% of completed leisure trips should produce a bounded experience record before the system can claim the trip enriched the character.

## Route display
Default: hidden.
User controls:
- Routes OFF (default)
- Selected character route
- All routes (diagnostic only)

At overview zoom, diagnostic routes must be low-opacity. Roads remain visible independently of route overlays.

## Public-safety boundary
City UI may display public-safe life state, activity, place, and redacted conversation only.
It must not expose client content, credentials, permission details, internal decision logic, raw chain-of-thought, or security command information.

## Rollout after Stabilization
1. PROVE: static City Plan v3 layout using existing public-safe data.
2. SHADOW: capacity and destination scoring with no authority effect.
3. VERIFY: asynchronous movement, collision rate, experience-record coverage, conversation contextuality.
4. STABILIZE: observe for clustering, fake activity, safety regressions, and performance.
5. ADOPT: promote only after evidence and Owner-approved production migration gate.

## Success metrics
- Major building overlaps: 0
- Individual home visual overlap: <2%
- Single venue population share: <35% without explicit event
- Simultaneous relocation starts: <=20% per rolling 5 minutes without event
- Completed leisure trips with experience record: >=90%
- Fabricated/context-free conversation rate: 0
- Public-safe leakage incidents: 0
- Production changes during current Feature Freeze: 0
