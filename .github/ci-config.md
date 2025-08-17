# CI Configuration Notes

## Branch Protection Rules

To prevent CI loops when using the debug output system, configure the following in GitHub:

### For `latest-outputs-debug` branch:
1. No required status checks
2. No branch protection rules
3. This branch is force-pushed during rebases

### For `main` branch:
1. Normal protection rules apply
2. The `rebase-debug-branch.yml` workflow runs on push to main
3. This workflow updates the debug branch but doesn't trigger builds there

## Workflow Triggers

### Workflows that DON'T run on `latest-outputs-debug`:
- All deployment workflows
- Test workflows
- Build workflows

### Workflows that DO run:
- `capture-debug-outputs.yml` - Only via repository_dispatch, not push

## Environment Variables for Debug System

Set these in your deployment environment:
- `ENABLE_DEBUG_CAPTURE=true` - Enable debug capture
- `GITHUB_TOKEN` - Personal access token with repo write permissions
- `GITHUB_REPOSITORY` - Owner/repo format (e.g., dgrobinson/article-monster)

## Testing the Debug System

1. Deploy to production with `ENABLE_DEBUG_CAPTURE=true`
2. Use the bookmarklet on any article
3. Check the `latest-outputs-debug` branch for captured outputs
4. The outputs/ folder will contain timestamped directories with all debug data

## Preventing Infinite Loops

The system prevents loops by:
1. Debug capture workflow only triggers via repository_dispatch
2. Pushes to `latest-outputs-debug` don't trigger any workflows
3. The branch is excluded from all CI/CD pipelines
4. Only the main branch triggers the rebase workflow