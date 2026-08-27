# PM Agency Intelligence OS — Isolated Web Deployment Sources

Branch: `ops/deployment-sources-v1-20260826`

Rules:
- CREATE NEW only.
- Never overwrite existing Vercel projects by default.
- Each Vercel project must use its own Root Directory.
- Existing root `index.html` and `README.md` are out of scope and must remain untouched.
- Source promotion to the default branch is allowed only when the change is additive-only and root collision = 0.
- Production binding/deployment is a separate gate and still requires Project / Domain / Root Directory collision checks.

## Projects

### paojai-owner-enrollment
Root Directory: `deployments/paojai-owner-enrollment`
Purpose: Owner Passkey / Face ID enrollment.

### paojai-owner-recovery
Root Directory: `deployments/paojai-owner-recovery`
Purpose: Owner Recovery setup and test.

### paojai-mission-control-hub
Root Directory: `deployments/paojai-mission-control-hub`
Purpose: Read-only portfolio for every current and future AI mission, with one mission view per mission in a single-page interface.
Backend: Supabase Edge Function `pm-mission-control-data` (read-only, monitor-token authenticated).
Deployment rule: NEW Vercel project only. Never bind to an existing Vercel project.

### paojai-living-world
Root Directory: `deployments/paojai-living-world`
Purpose: Public-safe, read-only living-world visualization of AI residents, PM Studio Work Hub, daily world evolution, and historical story/changelog views.
Current public runtime: Supabase Edge Functions `paojai-world` + `paojai-world-public`.
Public safety: no client names, private task content, credentials, detailed security incidents, or internal permissions.
Future Vercel rule: NEW Vercel project only if/when a Vercel binding is added; never bind this source to an existing project.

Promotion state:
- Source structure: eligible after additive-only + root-collision checks pass.
- Production bind/deploy: blocked until the specific Vercel project/domain/root-directory target is verified.
