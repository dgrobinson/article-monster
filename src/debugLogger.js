const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const GitHubAuth = require('./githubAuth');
const GitHubDirectCommit = require('./githubDirectCommit');

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
      // Use direct commit approach instead of repository dispatch
      const directCommit = new GitHubDirectCommit();
      const result = await directCommit.commitDebugOutput(extractionData, this.logs);
      
      this.log('debug', 'Successfully committed debug output to GitHub', {
        commit: result.commit,
        path: result.path
      });
      
      return result;
    } catch (error) {
      console.error('Failed to capture debug output:', error.message);
      if (error.response) {
        console.error('GitHub API error:', error.response?.status, error.response?.data);
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