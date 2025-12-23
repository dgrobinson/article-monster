const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * Handles GitHub authentication for the debug system
 * Supports multiple auth methods based on environment variables
 */
class GitHubAuth {
  constructor() {
    this.authMethod = this.detectAuthMethod();
  }

  detectAuthMethod() {
    // Prefer token over SSH since SSH isn't working in DigitalOcean
    if (process.env.GITHUB_TOKEN) {
      return 'personal-token';
    } else if (process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY) {
      return 'github-app';
    } else if (process.env.GITHUB_SSH_KEY) {
      return 'ssh-deploy-key';
    }
    return null;
  }

  async getAuthHeaders() {
    switch (this.authMethod) {
    case 'github-app':
      return this.getAppAuthHeaders();
    case 'personal-token':
      return this.getTokenAuthHeaders();
    default:
      throw new Error('No valid GitHub authentication configured');
    }
  }

  async getTokenAuthHeaders() {
    return {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  async getAppAuthHeaders() {
    // GitHub App authentication requires generating a JWT
    const jwt = await this.generateAppJWT();
    const installationToken = await this.getInstallationToken(jwt);

    return {
      'Authorization': `Bearer ${installationToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  async generateAppJWT() {
    const jwt = require('jsonwebtoken');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,  // Issued 60 seconds ago
      exp: now + 600, // Expires in 10 minutes
      iss: process.env.GITHUB_APP_ID
    };

    return jwt.sign(payload, process.env.GITHUB_APP_PRIVATE_KEY, {
      algorithm: 'RS256'
    });
  }

  async getInstallationToken(jwt) {
    const axios = require('axios');

    const response = await axios.post(
      `https://api.github.com/app/installations/${process.env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    return response.data.token;
  }

  /**
   * Push to GitHub using SSH deploy key
   * This method clones, commits, and pushes directly
   */
  async pushWithSSH(outputData) {
    const tmpDir = path.join('/tmp', `debug-output-${Date.now()}`);
    const sshKeyPath = path.join(tmpDir, 'deploy_key');

    console.log(`[GitHubAuth] Starting SSH push to ${process.env.GITHUB_REPOSITORY}`);

    try {
      // Create temp directory
      await fs.mkdir(tmpDir, { recursive: true });
      console.log(`[GitHubAuth] Created temp dir: ${tmpDir}`);

      // Write SSH key to temp file - handle potential formatting issues
      let sshKey = process.env.GITHUB_SSH_KEY;

      // If the key appears to be on a single line with \n literals, fix it
      if (sshKey && !sshKey.includes('\n') && sshKey.includes('\\n')) {
        console.log('SSH key appears to be escaped, converting \\n to actual newlines');
        sshKey = sshKey.replace(/\\n/g, '\n');
      }

      // Ensure the key ends with a newline
      if (sshKey && !sshKey.endsWith('\n')) {
        sshKey += '\n';
      }

      await fs.writeFile(sshKeyPath, sshKey, { mode: 0o600 });
      console.log(`[GitHubAuth] SSH key written to ${sshKeyPath}`);

      // Configure git to use the SSH key
      const gitSSHCommand = `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no`;

      // Clone the repository (just the branch we need)
      const repoUrl = `git@github.com:${process.env.GITHUB_REPOSITORY}.git`;
      console.log(`[GitHubAuth] Cloning ${repoUrl} (branch: latest-outputs-debug)`);

      try {
        await execAsync(`GIT_SSH_COMMAND="${gitSSHCommand}" git clone --branch latest-outputs-debug --single-branch ${repoUrl} ${tmpDir}/repo`);
      } catch {
        // If branch doesn't exist, clone main and create the branch
        console.log('[GitHubAuth] Branch doesn\'t exist, creating it...');
        await execAsync(`GIT_SSH_COMMAND="${gitSSHCommand}" git clone ${repoUrl} ${tmpDir}/repo`);
        await execAsync(`cd ${tmpDir}/repo && git checkout -b latest-outputs-debug`);
      }

      const repoDir = path.join(tmpDir, 'repo');

      // Create output directory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputDir = path.join(repoDir, 'outputs', timestamp);
      await fs.mkdir(outputDir, { recursive: true });

      // Write all output files
      await this.writeOutputFiles(outputDir, outputData);

      // Commit and push
      await execAsync(`cd ${repoDir} && git config user.name "DigitalOcean App"`);
      await execAsync(`cd ${repoDir} && git config user.email "debug@article-monster.app"`);
      await execAsync(`cd ${repoDir} && git add outputs/`);
      await execAsync(`cd ${repoDir} && git commit -m "Debug output: ${outputData.title || 'Unknown'} [${timestamp}]"`);
      await execAsync(`cd ${repoDir} && GIT_SSH_COMMAND="${gitSSHCommand}" git push origin latest-outputs-debug`);

      console.log('Successfully pushed debug output via SSH');
    } finally {
      // Clean up temp directory
      try {
        await execAsync(`rm -rf ${tmpDir}`);
      } catch (e) {
        console.error('Failed to clean up temp directory:', e);
      }
    }
  }

  async writeOutputFiles(outputDir, data) {
    // Write summary
    const summary = `# Extraction Debug Output

**Timestamp**: ${new Date().toISOString()}
**URL**: ${data.url}
**Title**: ${data.title}
**Success**: ${data.success}

## Status
- Extraction: ${data.extraction_status}
- Kindle: ${data.kindle_status}
- Zotero: ${data.zotero_status}
`;
    await fs.writeFile(path.join(outputDir, 'summary.md'), summary);

    // Write JSON files
    await fs.writeFile(
      path.join(outputDir, 'bookmarklet-log.json'),
      JSON.stringify(data.bookmarklet_log || [], null, 2)
    );

    await fs.writeFile(
      path.join(outputDir, 'payload.json'),
      JSON.stringify(data.payload || {}, null, 2)
    );

    await fs.writeFile(
      path.join(outputDir, 'server-logs.json'),
      JSON.stringify(data.server_logs || [], null, 2)
    );

    if (data.config_used) {
      await fs.writeFile(
        path.join(outputDir, 'config-used.json'),
        JSON.stringify(data.config_used, null, 2)
      );
    }

    // Write EPUB if provided
    if (data.epub_base64) {
      const epubBuffer = Buffer.from(data.epub_base64, 'base64');
      await fs.writeFile(path.join(outputDir, 'article.epub'), epubBuffer);
    }

    // Write email content
    if (data.email_content) {
      await fs.writeFile(path.join(outputDir, 'email-content.html'), data.email_content);
    }
  }

  /**
   * Determine if we should use SSH or API based on auth method
   */
  async canUseSSH() {
    return this.authMethod === 'ssh-deploy-key';
  }
}

module.exports = GitHubAuth;
