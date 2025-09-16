const axios = require('axios');

class GitHubIssues {
  constructor() {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is required to create GitHub issues');
    }
    if (!process.env.GITHUB_REPOSITORY) {
      throw new Error('GITHUB_REPOSITORY (e.g., owner/repo) is required');
    }

    this.baseUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
    this.headers = {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
  }

  async createIssue({ title, body, labels, assignees }) {
    const payload = {
      title,
      body,
      labels: Array.isArray(labels) ? labels : undefined,
      assignees: Array.isArray(assignees) ? assignees : undefined
    };

    const response = await axios.post(`${this.baseUrl}/issues`, payload, { headers: this.headers });
    return response.data;
  }
}

module.exports = GitHubIssues;


