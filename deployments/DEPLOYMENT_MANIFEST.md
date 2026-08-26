# PM Agency Intelligence OS — Isolated Web Deployment Sources

Branch: `ops/deployment-sources-v1-20260826`

Rules:
- CREATE NEW only.
- Never overwrite existing Vercel projects by default.
- Each Vercel project must use its own Root Directory.
- Existing root `index.html` and `README.md` are out of scope and must remain untouched.

## Projects

### paojai-owner-enrollment
Root Directory: `deployments/paojai-owner-enrollment`
Purpose: Owner Passkey / Face ID enrollment.

### paojai-owner-recovery
Root Directory: `deployments/paojai-owner-recovery`
Purpose: Owner Recovery setup and test.

Promotion rule: merge or deploy only after target project/domain/root-directory collision checks pass.