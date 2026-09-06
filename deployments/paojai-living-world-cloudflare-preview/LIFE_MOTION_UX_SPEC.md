# Paojai Living World — Life Motion UX Spec

Status: PREVIEW DESIGN / NO PRODUCTION AUTONOMY CHANGE
Date: 2026-08-28
Branch: preview/living-world-cloudflare-pages-20260828

## 1. Route visibility
Problem: commute lines make the overview map visually noisy, especially around 35% zoom.

Decision for Preview UX:
- Route lines hidden by default.
- Add a map control: `เส้นทาง` / `Routes`.
- When OFF: no route lines shown.
- When ON: show current commute routes only.
- At low zoom, route opacity must remain reduced; selected AI/NPC route may be emphasized.
- Route visibility changes presentation only; it must not alter movement state or backend evidence.

## 2. Life Motion Loop
Goal: AI and NPC should appear to live independently rather than moving in synchronized batches.

Principle: movement must be backed by real system events, not front-end animation pretending that a life event happened.

Loop:
`Current state -> Individual next-life window -> Place choice -> Travel event -> Arrival -> Experience -> Encounter opportunity -> Conversation if eligible -> Memory / preference evidence -> Next-life window`

### Individual timing
- Each AI/NPC receives its own next-action window and cooldown.
- Do not advance everyone on the same tick.
- Use deterministic jitter / bounded randomness so behavior is reproducible and auditable.
- Respect sleep, work presence, cognitive load, recent activity, recent place, and recent conversation.
- Avoid immediate return to the same place unless there is a reason.

### Place choice
Use existing daily plan, micro-activity catalog, preferences and recent history.
Prefer:
- a different place from the previous place;
- a place suitable to the activity;
- novelty balanced with learned preference;
- social places when open-to-social;
- rest/private places when recovery is needed.

### Experience generation
Arrival must create structured experience evidence such as:
- activity attempted;
- place;
- who was present;
- observation / outcome summary;
- novelty value;
- preference signal;
- whether the experience should influence future choices.

No raw chain-of-thought. No work/client content in Living World.

### Conversation generation
Conversation is eligible only when:
- two entities are co-located or an explicit encounter is created;
- cooldown allows it;
- context is PERSONAL / Living World;
- duplicate/recent-topic checks pass;
- no production/client/network authority is involved.

Conversation should reference the current experience/place and, when appropriate, a bounded shared memory so threads form a continuing story instead of isolated templates.

### Memory / growth
After an experience or conversation, update structured evidence only:
- recent places;
- recent activities;
- recent topics;
- shared memory summary;
- preference signal with confidence;
- learning/growth note.

Do not infer consciousness, emotions, intent or preference as fact without sufficient evidence.

## 3. Existing components to reuse
The current system already contains shadow components that should be extended rather than replaced:
- `pm_refresh_paojai_living_world_daily_plan_shadow_v1`
- `pm_run_paojai_life_rhythm_shadow_v1`
- `pm_run_paojai_npc_conversation_shadow_v1`
- `pm_run_paojai_npc_learning_stimulus_shadow_v1`
- `pm_reconcile_paojai_pair_conversation_memory_shadow_v1`

## 4. Safety constraints
- SHADOW / PERSONAL only during current stabilization.
- No Production action authority.
- No client action.
- No external network.
- No model spend unless separately approved by rule.
- No cross-client data.
- No raw chain-of-thought.
- Duplicate and conversation-rate controls required.
- Preserve existing Vercel production as rollback/fallback.

## 5. Rollout after stabilization
1. UX route toggle on isolated Preview.
2. Shadow Life Motion scheduler with per-entity jitter and no outbound effects.
3. Verify movement distribution is asynchronous and not synchronized.
4. Verify each move has an experience evidence record.
5. Verify conversations are context-linked and cooldown/duplicate-safe.
6. Verify memory affects later choices without becoming an ungrounded fact.
7. Safety regression.
8. Owner review before any promotion beyond Preview/Shadow.

## Success metrics
- Route lines OFF by default at first load.
- No mass synchronized movement pattern.
- >= 95% of completed moves have corresponding structured experience evidence.
- Conversation creation only from eligible encounter/context.
- No duplicate conversation burst.
- Zero client/work-content leakage into personal Living World.
- Zero production/network authority effect.
