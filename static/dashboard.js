/**
 * Article Library Dashboard
 * Main JavaScript file that handles all dashboard functionality
 */

class Dashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.charts = {};
        
        this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
        this.setupEventListeners();
        this.setupAutoRefresh();
        await this.loadInitialData();
        await this.checkSystemHealth();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshCurrentPage();
        });

        // Add article modal
        document.getElementById('add-article-btn').addEventListener('click', () => {
            this.showAddArticleModal();
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideAddArticleModal();
        });

        document.getElementById('cancel-add').addEventListener('click', () => {
            this.hideAddArticleModal();
        });

        document.getElementById('add-article-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddArticle();
        });

        // Article filters
        document.getElementById('article-status-filter').addEventListener('change', () => {
            this.loadArticles();
        });

        const articleSearch = document.getElementById('article-search');
        articleSearch.addEventListener('input', apiClient.debounce(() => {
            this.loadArticles();
        }, 300));

        // Archive filters
        document.getElementById('email-type-filter').addEventListener('change', () => {
            this.loadArchivedEmails();
        });

        document.getElementById('sender-filter').addEventListener('input', apiClient.debounce(() => {
            this.loadArchivedEmails();
        }, 300));

        document.getElementById('days-back-filter').addEventListener('change', () => {
            this.loadArchivedEmails();
        });

        // Batch replay
        document.getElementById('batch-replay-btn').addEventListener('click', () => {
            this.handleBatchReplay();
        });

        // Testing controls
        document.getElementById('run-tests-btn').addEventListener('click', () => {
            this.runAutomatedTests();
        });

        document.getElementById('validate-system-btn').addEventListener('click', () => {
            this.validateSystem();
        });

        document.getElementById('send-test-email-btn').addEventListener('click', () => {
            this.sendTestEmail();
        });

        // Close modal on outside click
        document.getElementById('add-article-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-article-modal') {
                this.hideAddArticleModal();
            }
        });
    }

    /**
     * Setup auto refresh
     */
    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.refreshCurrentPage(false); // Silent refresh
                this.checkSystemHealth();
            }
        }, 30000); // Refresh every 30 seconds
    }

    /**
     * Navigate to a specific page
     */
    async navigateTo(page) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            articles: 'Articles',
            archive: 'Email Archive',
            testing: 'Testing',
            analytics: 'Analytics',
            system: 'System Health'
        };
        document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

        // Show/hide page content
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        this.currentPage = page;

        // Load page-specific data
        await this.loadPageData(page);
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        await this.loadDashboardData();
    }

    /**
     * Load data for specific page
     */
    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'articles':
                await this.loadArticles();
                break;
            case 'archive':
                await this.loadArchivedEmails();
                break;
            case 'testing':
                await this.loadTestingData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'system':
                await this.loadSystemData();
                break;
        }
    }

    /**
     * Refresh current page
     */
    async refreshCurrentPage(showToast = true) {
        if (showToast) {
            this.showToast('Refreshing data...', 'info');
        }
        await this.loadPageData(this.currentPage);
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            // Load statistics for cards
            await Promise.all([
                this.loadDashboardStats(),
                this.loadRecentArticles(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Error loading dashboard data', 'error');
        }
    }

    /**
     * Load dashboard statistics
     */
    async loadDashboardStats() {
        try {
            const [articles, archiveStats] = await Promise.all([
                apiClient.getArticles({ limit: 1000 }), // Get all for counting
                apiClient.getArchiveStatistics()
            ]);

            const totalArticles = articles.length;
            const processedArticles = articles.filter(a => a.processed).length;
            const kindleSent = articles.filter(a => a.sent_to_kindle).length;
            const archivedEmails = archiveStats.total_emails || 0;

            document.getElementById('total-articles').textContent = totalArticles;
            document.getElementById('processed-articles').textContent = processedArticles;
            document.getElementById('archived-emails').textContent = archivedEmails;
            document.getElementById('kindle-sent').textContent = kindleSent;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            document.getElementById('total-articles').textContent = 'Error';
            document.getElementById('processed-articles').textContent = 'Error';
            document.getElementById('archived-emails').textContent = 'Error';
            document.getElementById('kindle-sent').textContent = 'Error';
        }
    }

    /**
     * Load recent articles for dashboard
     */
    async loadRecentArticles() {
        const container = document.getElementById('recent-articles');
        apiClient.showLoading(container, 'Loading recent articles...');

        try {
            const articles = await apiClient.getArticles({ limit: 5 });
            
            if (articles.length === 0) {
                apiClient.showEmpty(container, 'No articles found');
                return;
            }

            container.innerHTML = articles.map(article => `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${apiClient.truncateText(article.title)}</div>
                            <div class="list-item-meta">
                                <span>From: ${apiClient.extractDomain(article.url)}</span>
                                <span>•</span>
                                <span>${apiClient.formatRelativeTime(article.created_at)}</span>
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <span class="${apiClient.getStatusBadgeClass(article.processed)}">
                                ${apiClient.getStatusText(article.processed)}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent articles:', error);
            apiClient.showError(container, error);
        }
    }

    /**
     * Load recent email activity for dashboard
     */
    async loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        apiClient.showLoading(container, 'Loading recent activity...');

        try {
            const activity = await apiClient.getRecentArchiveActivity();
            
            if (activity.recent_emails_count === 0) {
                apiClient.showEmpty(container, 'No recent email activity');
                return;
            }

            const activityHtml = Object.entries(activity.activity_by_type)
                .map(([type, count]) => `
                    <div class="activity-item">
                        <div class="activity-type">${type}</div>
                        <div class="activity-count">${count} emails</div>
                    </div>
                `).join('');

            container.innerHTML = `
                <div class="activity-summary">
                    <div class="activity-period">Last 7 days: ${activity.recent_emails_count} emails</div>
                    <div class="activity-breakdown">
                        ${activityHtml}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading recent activity:', error);
            apiClient.showError(container, error);
        }
    }

    /**
     * Load articles page
     */
    async loadArticles() {
        const container = document.getElementById('articles-list');
        apiClient.showLoading(container, 'Loading articles...');

        try {
            const statusFilter = document.getElementById('article-status-filter').value;
            const searchQuery = document.getElementById('article-search').value;

            const filters = { limit: 50 };
            if (statusFilter !== '') {
                filters.processed = statusFilter === 'true';
            }

            const articles = await apiClient.getArticles(filters);
            
            // Client-side search filtering (since API doesn't support it)
            let filteredArticles = articles;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredArticles = articles.filter(article => 
                    article.title.toLowerCase().includes(query) ||
                    article.url.toLowerCase().includes(query) ||
                    (article.author && article.author.toLowerCase().includes(query))
                );
            }

            if (filteredArticles.length === 0) {
                apiClient.showEmpty(container, 'No articles found');
                return;
            }

            container.innerHTML = filteredArticles.map(article => `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">
                                <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                                    ${article.title}
                                </a>
                            </div>
                            <div class="list-item-meta">
                                <span>From: ${apiClient.extractDomain(article.url)}</span>
                                ${article.author ? `<span>•</span><span>By: ${article.author}</span>` : ''}
                                <span>•</span>
                                <span>${apiClient.formatRelativeTime(article.created_at)}</span>
                                ${article.tags ? `<span>•</span><span>Tags: ${article.tags}</span>` : ''}
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <span class="${apiClient.getStatusBadgeClass(article.processed)}">
                                ${apiClient.getStatusText(article.processed)}
                            </span>
                            ${article.processed && !article.sent_to_kindle ? 
                                `<button class="btn btn-primary btn-sm" onclick="dashboard.sendToKindle(${article.id})">
                                    <i class="fas fa-tablet-alt"></i>
                                    Send to Kindle
                                </button>` : ''
                            }
                            ${article.sent_to_kindle ? 
                                `<span class="status-badge processed">
                                    <i class="fas fa-check"></i> Sent to Kindle
                                </span>` : ''
                            }
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading articles:', error);
            apiClient.showError(container, error);
        }
    }

    /**
     * Load archived emails
     */
    async loadArchivedEmails() {
        const container = document.getElementById('archive-list');
        apiClient.showLoading(container, 'Loading archived emails...');

        try {
            const emailType = document.getElementById('email-type-filter').value;
            const sender = document.getElementById('sender-filter').value;
            const daysBack = document.getElementById('days-back-filter').value;

            const filters = { limit: 50 };
            if (emailType) filters.email_type = emailType;
            if (sender) filters.sender = sender;
            if (daysBack) filters.days_back = parseInt(daysBack);

            const result = await apiClient.getArchivedEmails(filters);
            const emails = result.emails || [];

            if (emails.length === 0) {
                apiClient.showEmpty(container, 'No archived emails found');
                return;
            }

            container.innerHTML = emails.map(email => `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${email.subject || 'No Subject'}</div>
                            <div class="list-item-meta">
                                <span>From: ${email.sender}</span>
                                <span>•</span>
                                <span>Type: ${email.email_type || 'unknown'}</span>
                                <span>•</span>
                                <span>${apiClient.formatRelativeTime(email.received_at)}</span>
                                ${email.replay_count > 0 ? `<span>•</span><span>Replayed ${email.replay_count} times</span>` : ''}
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-secondary btn-sm" onclick="dashboard.viewEmailDetails(${email.id})">
                                <i class="fas fa-eye"></i>
                                View
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="dashboard.replayEmail(${email.id})">
                                <i class="fas fa-play"></i>
                                Replay
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="dashboard.viewEmailDebug(${email.id})">
                                <i class="fas fa-bug"></i>
                                Debug
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading archived emails:', error);
            apiClient.showError(container, error);
        }
    }

    /**
     * Load testing data
     */
    async loadTestingData() {
        try {
            await Promise.all([
                this.loadTestResults(),
                this.loadTestEmailTypes()
            ]);
        } catch (error) {
            console.error('Error loading testing data:', error);
            this.showToast('Error loading testing data', 'error');
        }
    }

    /**
     * Load test results
     */
    async loadTestResults() {
        const container = document.getElementById('test-results');
        apiClient.showLoading(container, 'Loading test results...');

        try {
            const results = await apiClient.getTestResults();
            
            container.innerHTML = `
                <div class="test-results-summary">
                    <div class="test-result-item">
                        <div class="test-result-label">Last Run:</div>
                        <div class="test-result-value">${results.last_run || 'Never'}</div>
                    </div>
                    <div class="test-result-item">
                        <div class="test-result-label">Status:</div>
                        <div class="test-result-value ${results.status || 'unknown'}">${results.status || 'Unknown'}</div>
                    </div>
                    <div class="test-result-item">
                        <div class="test-result-label">Tests Passed:</div>
                        <div class="test-result-value">${results.tests_passed || 0}</div>
                    </div>
                    <div class="test-result-item">
                        <div class="test-result-label">Tests Failed:</div>
                        <div class="test-result-value">${results.tests_failed || 0}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading test results:', error);
            apiClient.showError(container, error);
        }
    }

    /**
     * Load test email types
     */
    async loadTestEmailTypes() {
        try {
            const types = await apiClient.getTestEmailTypes();
            const select = document.getElementById('test-email-type');
            
            select.innerHTML = '<option value="">Select test type...</option>' +
                types.available_types.map(type => 
                    `<option value="${type.type}">${type.type} - ${type.description}</option>`
                ).join('');
        } catch (error) {
            console.error('Error loading test email types:', error);
        }
    }

    /**
     * Load analytics data
     */
    async loadAnalyticsData() {
        try {
            await Promise.all([
                this.loadArticlesChart(),
                this.loadEmailTypesChart(),
                this.loadDetailedStats()
            ]);
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showToast('Error loading analytics data', 'error');
        }
    }

    /**
     * Load articles chart
     */
    async loadArticlesChart() {
        try {
            const articles = await apiClient.getArticles({ limit: 1000 });
            
            // Group articles by date
            const dateGroups = {};
            articles.forEach(article => {
                const date = new Date(article.created_at).toDateString();
                dateGroups[date] = (dateGroups[date] || 0) + 1;
            });

            const dates = Object.keys(dateGroups).sort();
            const counts = dates.map(date => dateGroups[date]);

            const ctx = document.getElementById('articles-chart').getContext('2d');
            
            if (this.charts.articles) {
                this.charts.articles.destroy();
            }

            this.charts.articles = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates.map(date => new Date(date).toLocaleDateString()),
                    datasets: [{
                        label: 'Articles Added',
                        data: counts,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading articles chart:', error);
        }
    }

    /**
     * Load email types chart
     */
    async loadEmailTypesChart() {
        try {
            const stats = await apiClient.getArchiveStatistics();
            
            if (!stats.email_types) {
                return;
            }

            const types = Object.keys(stats.email_types);
            const counts = Object.values(stats.email_types);

            const ctx = document.getElementById('email-types-chart').getContext('2d');
            
            if (this.charts.emailTypes) {
                this.charts.emailTypes.destroy();
            }

            this.charts.emailTypes = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: types,
                    datasets: [{
                        data: counts,
                        backgroundColor: [
                            '#2563eb',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } catch (error) {
            console.error('Error loading email types chart:', error);
        }
    }

    /**
     * Load detailed statistics
     */
    async loadDetailedStats() {
        const container = document.getElementById('detailed-stats');
        apiClient.showLoading(container, 'Loading detailed statistics...');

        try {
            const [articles, archiveStats] = await Promise.all([
                apiClient.getArticles({ limit: 1000 }),
                apiClient.getArchiveStatistics()
            ]);

            const processedCount = articles.filter(a => a.processed).length;
            const kindleCount = articles.filter(a => a.sent_to_kindle).length;
            
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Processing Rate</div>
                        <div class="stat-value">${articles.length > 0 ? Math.round((processedCount / articles.length) * 100) : 0}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Kindle Delivery Rate</div>
                        <div class="stat-value">${processedCount > 0 ? Math.round((kindleCount / processedCount) * 100) : 0}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Total Emails Archived</div>
                        <div class="stat-value">${archiveStats.total_emails || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Most Common Email Type</div>
                        <div class="stat-value">${archiveStats.most_common_type || 'N/A'}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading detailed stats:', error);
            apiClient.showError(container, error);
        }
    }

    /**
     * Load system health data
     */
    async loadSystemData() {
        const statusContainer = document.getElementById('health-status');
        const infoContainer = document.getElementById('system-info');
        
        apiClient.showLoading(statusContainer, 'Checking system health...');
        apiClient.showLoading(infoContainer, 'Loading system information...');

        try {
            const [health, testStatus] = await Promise.all([
                apiClient.getHealth(),
                apiClient.getTestStatus()
            ]);

            // Health status
            statusContainer.innerHTML = `
                <div class="health-indicator">
                    <div class="health-indicator-label">Database</div>
                    <div class="health-indicator-status ${health.database === 'connected' ? 'healthy' : 'unhealthy'}">
                        <i class="fas fa-circle"></i>
                        ${health.database}
                    </div>
                </div>
                <div class="health-indicator">
                    <div class="health-indicator-label">API Service</div>
                    <div class="health-indicator-status ${health.status === 'healthy' ? 'healthy' : 'unhealthy'}">
                        <i class="fas fa-circle"></i>
                        ${health.status}
                    </div>
                </div>
                <div class="health-indicator">
                    <div class="health-indicator-label">Testing Framework</div>
                    <div class="health-indicator-status ${testStatus.automated_testing_available ? 'healthy' : 'unhealthy'}">
                        <i class="fas fa-circle"></i>
                        ${testStatus.automated_testing_available ? 'Available' : 'Unavailable'}
                    </div>
                </div>
                <div class="health-indicator">
                    <div class="health-indicator-label">Email Service</div>
                    <div class="health-indicator-status ${testStatus.test_email_service_available ? 'healthy' : 'unhealthy'}">
                        <i class="fas fa-circle"></i>
                        ${testStatus.test_email_service_available ? 'Available' : 'Unavailable'}
                    </div>
                </div>
            `;

            // System info
            infoContainer.innerHTML = `
                <div class="system-detail">
                    <div class="system-detail-label">Service Name</div>
                    <div class="system-detail-value">${health.service}</div>
                </div>
                <div class="system-detail">
                    <div class="system-detail-label">Available Test Types</div>
                    <div class="system-detail-value">${testStatus.available_test_types?.length || 0}</div>
                </div>
                <div class="system-detail">
                    <div class="system-detail-label">Testing Endpoints</div>
                    <div class="system-detail-value">${testStatus.testing_endpoints?.length || 0}</div>
                </div>
                <div class="system-detail">
                    <div class="system-detail-label">Last Health Check</div>
                    <div class="system-detail-value">${apiClient.formatDate(new Date().toISOString())}</div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading system data:', error);
            apiClient.showError(statusContainer, error);
            apiClient.showError(infoContainer, error);
        }
    }

    /**
     * Check system health and update indicator
     */
    async checkSystemHealth() {
        try {
            const health = await apiClient.getHealth();
            const indicator = document.getElementById('system-status');
            
            if (health.status === 'healthy') {
                indicator.className = 'status-indicator healthy';
                indicator.innerHTML = '<i class="fas fa-circle"></i><span>Healthy</span>';
            } else {
                indicator.className = 'status-indicator unhealthy';
                indicator.innerHTML = '<i class="fas fa-circle"></i><span>Issues Detected</span>';
            }
        } catch (error) {
            const indicator = document.getElementById('system-status');
            indicator.className = 'status-indicator unhealthy';
            indicator.innerHTML = '<i class="fas fa-circle"></i><span>Connection Error</span>';
        }
    }

    // ====== ACTION HANDLERS ======

    /**
     * Show add article modal
     */
    showAddArticleModal() {
        document.getElementById('add-article-modal').classList.add('active');
        document.getElementById('article-url').focus();
    }

    /**
     * Hide add article modal
     */
    hideAddArticleModal() {
        document.getElementById('add-article-modal').classList.remove('active');
        document.getElementById('add-article-form').reset();
    }

    /**
     * Handle add article form submission
     */
    async handleAddArticle() {
        const url = document.getElementById('article-url').value;
        const tags = document.getElementById('article-tags').value;
        const sendToKindle = document.getElementById('send-to-kindle').checked;

        if (!apiClient.isValidUrl(url)) {
            this.showToast('Please enter a valid URL', 'error');
            return;
        }

        try {
            const result = await apiClient.processUrl(url, sendToKindle, tags);
            this.showToast(result.message, 'success');
            this.hideAddArticleModal();
            
            // Refresh articles if on articles page
            if (this.currentPage === 'articles') {
                await this.loadArticles();
            }
        } catch (error) {
            console.error('Error adding article:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Send article to Kindle
     */
    async sendToKindle(articleId) {
        try {
            const result = await apiClient.sendToKindle(articleId);
            this.showToast(result.message, 'success');
            
            // Refresh articles
            if (this.currentPage === 'articles') {
                await this.loadArticles();
            }
        } catch (error) {
            console.error('Error sending to Kindle:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * View email details
     */
    async viewEmailDetails(archiveId) {
        try {
            const details = await apiClient.getArchivedEmailDetails(archiveId);
            
            // Create a simple modal or alert with email details
            const detailsText = `
Subject: ${details.subject || 'No Subject'}
From: ${details.sender}
Type: ${details.email_type || 'unknown'}
Received: ${apiClient.formatDate(details.received_at)}
Processed: ${details.processed ? 'Yes' : 'No'}
Replay Count: ${details.replay_count}

Preview:
${apiClient.truncateText(details.body_text || 'No text content', 500)}
            `;
            
            alert(detailsText); // Simple implementation - could be enhanced with a proper modal
        } catch (error) {
            console.error('Error viewing email details:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Replay email
     */
    async replayEmail(archiveId) {
        try {
            const result = await apiClient.replayArchivedEmail(archiveId);
            this.showToast(result.message, 'success');
        } catch (error) {
            console.error('Error replaying email:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * View email debug info
     */
    async viewEmailDebug(archiveId) {
        try {
            const debug = await apiClient.getEmailDebugInfo(archiveId);
            
            const debugText = `
=== DEBUG INFO ===
ID: ${debug.basic_info.id}
Subject: ${debug.basic_info.subject}
Sender: ${debug.basic_info.sender}
Type: ${debug.basic_info.email_type}

=== PROCESSING ===
Processed: ${debug.processing_info.processed}
Replay Count: ${debug.processing_info.replay_count}
Result: ${debug.processing_info.processing_result || 'None'}

=== CONTENT ANALYSIS ===
Has HTML: ${debug.content_analysis.has_html}
Has Text: ${debug.content_analysis.has_text}
Text Length: ${debug.content_analysis.text_length}
HTML Length: ${debug.content_analysis.html_length}
Attachments: ${debug.content_analysis.attachment_count}

=== RAW EMAIL PREVIEW ===
${debug.raw_email_preview}
            `;
            
            alert(debugText); // Simple implementation
        } catch (error) {
            console.error('Error viewing debug info:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Handle batch replay
     */
    async handleBatchReplay() {
        const emailType = document.getElementById('email-type-filter').value;
        const sender = document.getElementById('sender-filter').value;
        
        if (!emailType && !sender) {
            this.showToast('Please set filters before batch replay', 'warning');
            return;
        }

        try {
            const filters = { limit: 10 };
            if (emailType) filters.email_type = emailType;
            if (sender) filters.sender = sender;

            const result = await apiClient.batchReplayEmails(filters);
            this.showToast(result.message, 'success');
        } catch (error) {
            console.error('Error in batch replay:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Run automated tests
     */
    async runAutomatedTests() {
        try {
            const result = await apiClient.runAutomatedTests();
            this.showToast(result.message, 'success');
            
            // Refresh test results after a delay
            setTimeout(() => {
                this.loadTestResults();
            }, 5000);
        } catch (error) {
            console.error('Error running tests:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Validate system
     */
    async validateSystem() {
        try {
            const result = await apiClient.validateEmailProcessing();
            const status = result.overall_status === 'healthy' ? 'success' : 'warning';
            this.showToast(`System validation: ${result.overall_status}`, status);
            
            // Show recommendations if any
            if (result.recommendations && result.recommendations.length > 0) {
                setTimeout(() => {
                    alert('Recommendations:\n' + result.recommendations.join('\n'));
                }, 1000);
            }
        } catch (error) {
            console.error('Error validating system:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Send test email
     */
    async sendTestEmail() {
        const testType = document.getElementById('test-email-type').value;
        
        if (!testType) {
            this.showToast('Please select a test type', 'warning');
            return;
        }

        try {
            const result = await apiClient.sendTestEmail(testType);
            this.showToast(result.message, 'success');
        } catch (error) {
            console.error('Error sending test email:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}