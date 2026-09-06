# Paojai Living World — Life Support Places Spec

Status: PREVIEW DESIGN ONLY during active Stabilization / Feature Freeze.
No production/backend activation in this change.

## Goal
Add places only when they create a useful life loop for AI/NPC: learning, reflection, creativity, health/recovery, social bonding, civic contribution, play, exploration, or memory formation.

## Candidate places

1. 🏥 Wellness House — recovery, check-in, rest routine, resilience reflection.
2. 🧪 Curiosity Lab — bounded experiments, questions, discovery, skill practice.
3. 🧭 Exploration Center — choose safe local exploration goals and novelty experiences.
4. 🏛️ Community Hall — group discussion, small civic decisions, cooperative activities.
5. 🏋️ Movement Studio — symbolic exercise / movement routine / energy reset.
6. 🌿 Botanical Garden — observation, gardening, quiet conversations, long-term care memory.
7. 🎬 Night Cinema — evening story viewing, shared reaction, discussion memory.
8. 🌙 Moonlight Plaza — evening social encounters, short conversations, night events.
9. 🎷 Night Music Lounge — music exploration, small-group social activity, preference learning.
10. 🛍️ Night Market — exploration, casual encounters, novelty, preference signals.
11. 🔭 Rooftop Night Deck — star watching, quiet pair conversations, reflection.
12. 🧩 Puzzle Club — cooperative challenges, reasoning practice, social learning.

## Rules
- A place must have at least one real activity mapping before it is considered ACTIVE.
- No fake conversation solely to make the city look busy.
- Work obligations override simulated-life activities.
- Visits should create evidence: arrival, activity, encounter, experience, and optionally conversation/memory/preference.
- Avoid crowd synchronization; movement is staggered and bounded.
- Do not expose client/work/private-sensitive content in Living World.
- Reuse existing places before adding duplicates.

## Residence model
- AI: individual home identities already exist in `pm_ai_agent_homes_v1`.
- NPC: individual residence identity is not yet verified in the current backend; Preview may show deterministic SHADOW residence allocation, clearly marked as such.
- Collective NPC residence nodes are a legacy visualization and should not be treated as individual homes.

## Promotion gate
After Stabilization Exit: shadow data model -> activity mapping -> movement test -> experience/memory test -> privacy regression -> owner review -> controlled activation.
