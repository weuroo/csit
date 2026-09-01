# Paojai Mission Activation Center v1

Status: isolated candidate on `activation-center-v1` branch.

## Safety contract

- New route only: `/activation-center/`; does not replace the existing Mission Control page.
- Canonical production origin remains `https://paojai-mission-control-hub.vercel.app`.
- Preview origins render fixture-only UI and never request Live/Internal Data.
- Canonical production route requires the existing `pm_owner_mission_session` issued by Owner Passkey flow.
- Backend candidate is read-only and validates session scope `READ_ONLY_MISSION_CONTROL` before querying.
- Data source is limited to `pm_mission_activation_center_v1`, `pm_mission_activation_summary_v1`, and `pm_reusable_mission_outputs_v1`.
- No action endpoint, deploy authority, network authority, client send, permission change, secret handling, or production mutation is included.

## Promotion gate

Do not deploy `pm-mission-activation-center-data-v1` or merge this branch to `master` until the owner-authorized production promotion gate is satisfied. Before promotion: verify diff/scope, rollback path, Central/Action/Guardian safety regressions, and intended access path.
