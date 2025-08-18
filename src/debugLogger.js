const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const GitHubAuth = require('./githubAuth');

class DebugLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
    this.enabled = process.env.ENABLE_DEBUG_CAPTURE === 'true';
  }

  log(category, message, data = {}) {
    const entry = {
      timestamp: Date.now() - this.startTime,
      category,
      message,
      data,
      time: new Date().toISOString()
    };
    this.logs.push(entry);
    
    // Also log to console for local debugging
    console.log(`[${category}] ${message}`, data);
  }

  async captureToGitHub(extractionData) {
    if (!this.enabled) {
      console.log('Debug capture disabled (set ENABLE_DEBUG_CAPTURE=true to enable)');
      return;
    }

    const githubAuth = new GitHubAuth();
    
    if (!githubAuth.authMethod) {
      console.warn('No GitHub authentication configured, skipping debug capture');
      return;
    }

    try {
      // If using SSH deploy key, use direct git operations
      // Disabled for now due to SSH issues in DigitalOcean environment
      // if (await githubAuth.canUseSSH()) {
      //   await githubAuth.pushWithSSH({
      //     ...extractionData,
      //     server_logs: this.logs
      //   });
      //   this.log('debug', 'Pushed debug output via SSH deploy key');
      //   return;
      // }
      // Prepare the payload - GitHub limits to 65535 bytes
      // Truncate large fields if necessary
      const truncateField = (field, maxLength = 10000) => {
        if (!field) return '';
        if (typeof field === 'string' && field.length > maxLength) {
          return field.substring(0, maxLength) + '... [truncated]';
        }
        return field;
      };
      
      // GitHub limits to 10 properties in client_payload
      const payload = {
        url: extractionData.url,
        title: extractionData.title || 'Unknown',
        success: extractionData.success,
        status: `${extractionData.kindle_status}/${extractionData.zotero_status}`,
        timestamp: new Date().toISOString(),
        // Combine all debug data into a single JSON string
        debug_data: JSON.stringify({
          commit_sha: process.env.GITHUB_SHA || 'local',
          extraction_status: extractionData.extraction_status,
          bookmarklet_log: (extractionData.bookmarklet_log || []).slice(0, 20),
          server_logs: this.logs.slice(-30),
          config_used: extractionData.config_used ? 'yes' : 'no',
          payload: extractionData.payload,
          email_content: truncateField(extractionData.email_content, 5000),
          epub_base64: extractionData.epub_base64 || ''
        })
      };

      // Get auth headers for API call
      const headers = await githubAuth.getAuthHeaders();
      
      // Trigger GitHub Action via repository dispatch
      const response = await axios.post(
        `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/dispatches`,
        {
          event_type: 'extraction-debug',
          client_payload: payload
        },
        {
          headers
        }
      );

      this.log('debug', 'Triggered GitHub Action for debug capture', {
        status: response.status,
        repository: process.env.GITHUB_REPOSITORY
      });
    } catch (error) {
      console.error('Failed to trigger debug capture:', error.message);
      if (error.response) {
        console.error('GitHub API error:', error.response.status, error.response.data);
      }
      
      // Fallback: save locally if in development
      if (process.env.NODE_ENV !== 'production') {
        await this.saveLocally(extractionData);
      }
    }
  }

  async saveLocally(extractionData) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const debugDir = path.join(__dirname, '..', 'debug-outputs', timestamp);
      
      await fs.mkdir(debugDir, { recursive: true });
      
      // Save all debug data
      await fs.writeFile(
        path.join(debugDir, 'server-logs.json'),
        JSON.stringify(this.logs, null, 2)
      );
      
      await fs.writeFile(
        path.join(debugDir, 'extraction-data.json'),
        JSON.stringify(extractionData, null, 2)
      );
      
      this.log('debug', 'Saved debug output locally', { dir: debugDir });
    } catch (error) {
      console.error('Failed to save debug output locally:', error);
    }
  }

  getFormattedLogs() {
    return this.logs.map(log => {
      const time = new Date(this.startTime + log.timestamp).toISOString();
      return `[${time}] [${log.category}] ${log.message}`;
    }).join('\n');
  }
}

module.exports = DebugLogger;