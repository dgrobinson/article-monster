const axios = require('axios');
const GitHubAuth = require('./githubAuth');

/**
 * Directly commit debug outputs to the latest-outputs-debug branch
 * Uses GitHub's Contents API to create files in a single commit
 */
class GitHubDirectCommit {
  constructor() {
    this.auth = new GitHubAuth();
    this.baseUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
  }

  async commitDebugOutput(extractionData, serverLogs) {
    try {
      const headers = await this.auth.getAuthHeaders();
      
      // Generate folder name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const folderPath = `outputs/${timestamp}`;
      
      console.log(`[GitHubDirectCommit] Creating debug output at ${folderPath}`);
      
      // Get the latest commit SHA of the debug branch
      const branchResponse = await axios.get(
        `${this.baseUrl}/git/ref/heads/latest-outputs-debug`,
        { headers }
      );
      const latestCommitSha = branchResponse.data.object.sha;
      
      // Get the tree SHA of the latest commit
      const commitResponse = await axios.get(
        `${this.baseUrl}/git/commits/${latestCommitSha}`,
        { headers }
      );
      const baseTreeSha = commitResponse.data.tree.sha;
      
      // Prepare files for the commit
      const files = [
        {
          path: `${folderPath}/summary.md`,
          content: this.createSummary(extractionData)
        },
        {
          path: `${folderPath}/server-logs.json`,
          content: JSON.stringify(serverLogs, null, 2)
        },
        {
          path: `${folderPath}/bookmarklet-log.json`,
          content: JSON.stringify(extractionData.bookmarklet_log || [], null, 2)
        },
        {
          path: `${folderPath}/payload.json`,
          content: JSON.stringify(extractionData.payload || {}, null, 2)
        },
        {
          path: `${folderPath}/email-content.html`,
          content: extractionData.email_content || ''
        }
      ];
      
      // Add EPUB if available
      if (extractionData.epub_base64) {
        files.push({
          path: `${folderPath}/article.epub`,
          content: extractionData.epub_base64,
          encoding: 'base64'
        });
      }
      
      // Add config if used
      if (extractionData.config_used) {
        files.push({
          path: `${folderPath}/config-used.json`,
          content: JSON.stringify(extractionData.config_used, null, 2)
        });
      }
      
      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const blobResponse = await axios.post(
            `${this.baseUrl}/git/blobs`,
            {
              content: file.content,
              encoding: file.encoding || 'utf-8'
            },
            { headers }
          );
          
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobResponse.data.sha
          };
        })
      );
      
      // Create a new tree
      const treeResponse = await axios.post(
        `${this.baseUrl}/git/trees`,
        {
          base_tree: baseTreeSha,
          tree: blobs
        },
        { headers }
      );
      
      // Create the commit
      const commitMessage = `Debug output: ${extractionData.title || 'Unknown'} [${timestamp}]`;
      const newCommitResponse = await axios.post(
        `${this.baseUrl}/git/commits`,
        {
          message: commitMessage,
          tree: treeResponse.data.sha,
          parents: [latestCommitSha]
        },
        { headers }
      );
      
      // Update the branch reference
      await axios.patch(
        `${this.baseUrl}/git/refs/heads/latest-outputs-debug`,
        {
          sha: newCommitResponse.data.sha,
          force: false
        },
        { headers }
      );
      
      console.log(`[GitHubDirectCommit] Successfully created commit: ${commitMessage}`);
      return {
        success: true,
        commit: newCommitResponse.data.sha,
        path: folderPath
      };
      
    } catch (error) {
      console.error('[GitHubDirectCommit] Failed to create commit:', error.message);
      if (error.response) {
        console.error('GitHub API error:', error.response.status, error.response.data);
      }
      throw error;
    }
  }
  
  createSummary(data) {
    return `# Extraction Debug Output

**Timestamp**: ${new Date().toISOString()}
**URL**: ${data.url}
**Title**: ${data.title}
**Success**: ${data.success}

## Status
- Extraction: ${data.extraction_status}
- Kindle: ${data.kindle_status}
- Zotero: ${data.zotero_status}

## Files
- bookmarklet-log.json - Client-side extraction logs
- payload.json - Full payload sent to server
- server-logs.json - Server processing logs
- config-used.json - Site-specific config (if any)
- article.epub - Generated EPUB file
- email-content.html - Email sent to Kindle
`;
  }
}

module.exports = GitHubDirectCommit;