/**
 * API Client for Article Library Dashboard
 * Handles all communication with the FastAPI backend
 */

class APIClient {
    constructor(baseURL = '/api/v1') {
        this.baseURL = baseURL;
    }

    /**
     * Generic request handler with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle no-content responses
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams(params);
        const queryString = searchParams.toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ====== HEALTH ENDPOINTS ======

    /**
     * Check system health
     */
    async getHealth() {
        return this.get('/health');
    }

    // ====== ARTICLE ENDPOINTS ======

    /**
     * Get list of articles with optional filters
     */
    async getArticles(filters = {}) {
        const params = {};
        if (filters.skip !== undefined) params.skip = filters.skip;
        if (filters.limit !== undefined) params.limit = filters.limit;
        if (filters.processed !== undefined) params.processed = filters.processed;
        
        return this.get('/articles', params);
    }

    /**
     * Get a specific article by ID
     */
    async getArticle(articleId) {
        return this.get(`/articles/${articleId}`);
    }

    /**
     * Create a new article
     */
    async createArticle(articleData) {
        return this.post('/articles', articleData);
    }

    /**
     * Process URL and create article
     */
    async processUrl(url, sendToKindle = false, tags = null) {
        const data = {
            url: url,
            send_to_kindle: sendToKindle
        };
        if (tags) data.tags = tags;
        
        return this.post('/articles/process-url', data);
    }

    /**
     * Send article to Kindle
     */
    async sendToKindle(articleId) {
        return this.post(`/articles/${articleId}/send-to-kindle`);
    }

    // ====== EMAIL ARCHIVE ENDPOINTS ======

    /**
     * Get archived emails with filters
     */
    async getArchivedEmails(filters = {}) {
        const params = {};
        if (filters.limit !== undefined) params.limit = filters.limit;
        if (filters.email_type) params.email_type = filters.email_type;
        if (filters.sender) params.sender = filters.sender;
        if (filters.days_back !== undefined) params.days_back = filters.days_back;
        
        return this.get('/archive/emails', params);
    }

    /**
     * Get detailed information about a specific archived email
     */
    async getArchivedEmailDetails(archiveId) {
        return this.get(`/archive/emails/${archiveId}`);
    }

    /**
     * Replay an archived email through the processing pipeline
     */
    async replayArchivedEmail(archiveId) {
        return this.post(`/archive/emails/${archiveId}/replay`);
    }

    /**
     * Add tags to an archived email
     */
    async addTagsToEmail(archiveId, tags) {
        return this.post(`/archive/emails/${archiveId}/tags`, { tags });
    }

    /**
     * Get archive statistics
     */
    async getArchiveStatistics() {
        return this.get('/archive/statistics');
    }

    /**
     * Get available email types for filtering
     */
    async getEmailTypes() {
        return this.get('/archive/email-types');
    }

    /**
     * Batch replay multiple emails
     */
    async batchReplayEmails(filters = {}) {
        const params = {};
        if (filters.email_type) params.email_type = filters.email_type;
        if (filters.sender) params.sender = filters.sender;
        if (filters.limit !== undefined) params.limit = filters.limit;
        
        return this.post('/archive/batch-replay', {}, params);
    }

    /**
     * Get recent archive activity
     */
    async getRecentArchiveActivity() {
        return this.get('/archive/recent-activity');
    }

    /**
     * Get debug information for an archived email
     */
    async getEmailDebugInfo(archiveId) {
        return this.get(`/archive/debug-info/${archiveId}`);
    }

    // ====== TESTING ENDPOINTS ======

    /**
     * Run automated tests
     */
    async runAutomatedTests() {
        return this.post('/testing/run-automated-tests');
    }

    /**
     * Get test results
     */
    async getTestResults() {
        return this.get('/testing/test-results');
    }

    /**
     * Send a test email
     */
    async sendTestEmail(testType = null, customData = null) {
        const data = {};
        if (testType) data.test_type = testType;
        if (customData) data.custom_data = customData;
        
        return this.post('/testing/send-test-email', data);
    }

    /**
     * Get available test email types
     */
    async getTestEmailTypes() {
        return this.get('/testing/test-email-types');
    }

    /**
     * Start continuous testing
     */
    async startContinuousTesting(intervalMinutes = 60) {
        return this.post('/testing/continuous-testing', {
            start_continuous: true,
            interval_minutes: intervalMinutes
        });
    }

    /**
     * Test synthetic newsletter generation
     */
    async testSyntheticNewsletters() {
        return this.get('/testing/synthetic-newsletter-test');
    }

    /**
     * Test RSS processing
     */
    async testRssProcessing() {
        return this.post('/testing/test-rss-processing');
    }

    /**
     * Get testing status
     */
    async getTestStatus() {
        return this.get('/testing/test-status');
    }

    /**
     * Validate email processing pipeline
     */
    async validateEmailProcessing() {
        return this.post('/testing/validate-email-processing');
    }

    // ====== NEWSLETTER ENDPOINTS ======
    // Note: These might exist based on the router imports but weren't in the files I read

    /**
     * Get newsletters (if endpoint exists)
     */
    async getNewsletters() {
        try {
            return this.get('/newsletters');
        } catch (error) {
            console.warn('Newsletter endpoint may not be implemented:', error);
            return { newsletters: [] };
        }
    }

    // ====== UTILITY METHODS ======

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Format relative time (e.g., "2 minutes ago")
     */
    formatRelativeTime(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
            return this.formatDate(dateString);
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Truncate text to specified length
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Get status badge class based on status
     */
    getStatusBadgeClass(processed, hasError = false) {
        if (hasError) return 'status-badge error';
        if (processed) return 'status-badge processed';
        return 'status-badge unprocessed';
    }

    /**
     * Get status text
     */
    getStatusText(processed, hasError = false) {
        if (hasError) return 'Error';
        if (processed) return 'Processed';
        return 'Processing';
    }

    /**
     * Parse tags string into array
     */
    parseTags(tagsString) {
        if (!tagsString) return [];
        return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    /**
     * Format tags array into string
     */
    formatTags(tagsArray) {
        if (!tagsArray || tagsArray.length === 0) return '';
        return tagsArray.join(', ');
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (error) {
            return url;
        }
    }

    /**
     * Check if URL is valid
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Debounce function for search inputs
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Show loading state in element
     */
    showLoading(element, message = 'Loading...') {
        element.innerHTML = `<div class="loading">${message}</div>`;
    }

    /**
     * Show error state in element
     */
    showError(element, error) {
        const errorMessage = error.message || 'An error occurred';
        element.innerHTML = `<div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${errorMessage}</span>
        </div>`;
    }

    /**
     * Show empty state in element
     */
    showEmpty(element, message = 'No data available') {
        element.innerHTML = `<div class="empty-state">
            <i class="fas fa-inbox"></i>
            <span>${message}</span>
        </div>`;
    }
}

// Create global API client instance
const apiClient = new APIClient();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}