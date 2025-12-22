# Deployment SOP (gh + doctl)

This is the standard process to deploy and monitor Article Monster using GitHub and DigitalOcean App Platform.
Note: CI does not deploy; AWS/Kubernetes steps were legacy and have been removed.

## Prereqs
- GitHub CLI (`gh`) authenticated to the `dgrobinson/article-monster` repo
- DigitalOcean CLI (`doctl`) authenticated and context set
- App ID: `214fb1d0-54f7-4a28-ba39-7db566e8a8e6`

## Deploy
1) Push to `main`
```bash
git push origin main
```
DigitalOcean App Platform auto-builds from GitHub push webhook.

2) (Optional) Rerun CI workflows if needed
```bash
gh run list --limit 5
gh run rerun <run-id> --failed
```

## Monitor Deployment
- List deployments:
```bash
doctl apps list-deployments 214fb1d0-54f7-4a28-ba39-7db566e8a8e6
```
- Get active deployment:
```bash
doctl apps get 214fb1d0-54f7-4a28-ba39-7db566e8a8e6
```
- Tail logs (server + client-mirrored):
```bash
doctl apps logs 214fb1d0-54f7-4a28-ba39-7db566e8a8e6 --tail 200
```

## Verify
- Health:
```bash
curl -fsSL https://seal-app-t4vff.ondigitalocean.app/health | jq
```
- Bookmarklet: open `https://seal-app-t4vff.ondigitalocean.app/`, drag bookmarklet, click on an article page. Loader should fetch `/bookmarklet.js` at click-time.

## Troubleshooting
- If DO deployment is failing but CI failed too: DO can still deploy from GitHub push. Check deployment list and logs to confirm.
- If logs show extraction failures:
  - Confirm `/site-config/<hostname>` returns a config
  - Validate bookmarklet loader fetched `/bookmarklet.js`
  - Compare against FiveFilters reference
- Rollback: redeploy a previous commit by pushing a revert or triggering a manual deployment in DO dashboard.

## References
- App URL: https://seal-app-t4vff.ondigitalocean.app
- App ID: 214fb1d0-54f7-4a28-ba39-7db566e8a8e6
- Production Debugging Protocol: see `README.md` and `AGENTS.md`
