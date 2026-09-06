# Paojai Living World — Nightlife Layer Spec v0.1

Status: PREPARED ONLY — do not activate during stabilization feature freeze
Date: 2026-08-28

## Goal
ทำให้ Living World มีวงจรชีวิตทั้งกลางวันและกลางคืน โดยสถานที่กลางคืนต้องสร้างประสบการณ์/การพบปะ/บทสนทนา/ความทรงจำจริงใน shadow life system ไม่ใช่แค่เปลี่ยนสีฉากหรือย้าย avatar

## Existing assets to reuse first
- OBSERVATORY / STAR_WATCHING
- MUSIC_GARDEN / MUSIC_EXPLORATION
- GAME_ARCADE / COOP_GAME / PUZZLE_CHALLENGE
- AI_CAFE / VISIT_PEER
- IDEA_THEATER / IDEA_IMPROV
- TEA_HOUSE / TEA_CHAT / QUIET_TEA
- RIVERSIDE_WALK / solo + pair walk

## New nightlife places proposed
1. NIGHT_MARKET — 🌙 ตลาดค่ำ
   - type: SOCIAL
   - purpose: เดินเล่น พบ NPC ชิม/เลือกของเชิงสัญลักษณ์ ฟังเรื่องราวสั้น ๆ
   - activities: NIGHT_MARKET_WALK, TRY_RANDOM_STALL, STREET_STORY_EXCHANGE

2. JAZZ_LOUNGE — 🎷 เลานจ์ดนตรี
   - type: SOCIAL/PLAY
   - purpose: ฟังเพลง แลกเพลง/จังหวะ ทดลองบทสนทนาบรรยากาศเงียบหรือเป็นกลุ่มเล็ก
   - activities: LISTEN_LIVE_SET, MUSIC_TASTE_EXCHANGE, QUIET_TABLE_CHAT

3. ROOFTOP_NIGHT_DECK — 🌃 ดาดฟ้ายามค่ำ
   - type: RECOVERY/SOCIAL
   - purpose: ดูเมือง พัก ทบทวน หรือคุย 1:1
   - activities: CITY_LIGHT_REFLECTION, LATE_NIGHT_PAIR_TALK

4. NIGHT_CINEMA — 🎬 โรงหนังกลางคืน
   - type: PLAY/REFLECT
   - purpose: ชมเรื่องเล่าจำลองสั้น ๆ แล้วคุยความเห็นโดยไม่อ้างสื่อภายนอก
   - activities: SHORT_STORY_SCREENING, POST_SHOW_DISCUSSION

5. MOONLIGHT_PLAZA — ✨ ลานแสงจันทร์
   - type: SOCIAL/CIVIC
   - purpose: งานเล็ก ๆ ตามคืน เช่น open mic, mini festival, community gathering
   - activities: OPEN_MIC, MINI_FESTIVAL, NIGHT_COMMUNITY_EVENT

## Time policy
- Day layer: 06:00–18:00 BKK
- Evening transition: 18:00–20:00
- Nightlife active window: 20:00–23:30
- Wind-down: 23:30–00:00
- Sleep window remains 00:00–06:00 unless future policy changes after separate review

Night activity must never override WORK_BODY obligations or production missions.

## Life Motion integration
For eligible LIFE_BODY identities:
1. Per-identity staggered next-move time; no synchronized global move.
2. Select venue by time eligibility + recent history + preference + novelty + crowd density.
3. Travel event is recorded before arrival.
4. On arrival create at least one observable experience event.
5. Optional encounter if compatible AI/NPC is present.
6. Optional conversation bounded by cooldown and context.
7. Store structured memory/preference signal only; never raw chain-of-thought.
8. Next venue choice may use prior evidence so stories can continue across nights.

## Crowd control / realism
- Each venue has soft capacity and preferred density.
- Avoid moving everyone to the same nightlife location.
- If venue is crowded, probability shifts to alternate venue or solo activity.
- Each identity has cooldown and personality/preference weighting.
- Some identities may choose to stay home, rest, read, or walk alone.

## Story continuity
Every nightlife event should be able to contribute one or more of:
- experience summary
- shared memory between a pair
- preference evidence
- learned social compatibility signal
- place familiarity
- follow-up topic for a later conversation

No fake transcript generation solely to make the world look busy.

## Safety constraints
- PERSONAL/SHADOW only initially.
- production_action=false
- client_action=false
- external_network=false
- model_spend=false by default
- no client/mission/work-detail leakage
- bounded frequency + duplicate control
- sleep/recovery protected

## Success metrics for first shadow trial
- <20% simultaneous moves in any 5-minute bucket
- no venue with >35% of active non-work identities unless explicit event
- >=90% completed moves produce an observable experience record
- conversations reference the actual place/activity context
- no public-safe boundary violations
- no effect on WORK_BODY production execution

## Rollout
Design → Shadow schedule only → 24–48h evidence → safety review → refine → owner review → optional Preview UI exposure → later production consideration

Do not activate until current stabilization exits cleanly.
