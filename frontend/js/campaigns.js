/* ============================================================
   CAMPAIGNS.JS - SmartSaaS Analytics
   Retention Campaigns Management
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // DOM REFERENCES
    // ============================================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Sidebar
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    const menuToggle = $('#menuToggle');

    // Stats
    const totalCampaignsEl = $('#totalCampaigns');
    const activeCampaignsEl = $('#activeCampaigns');
    const totalBudgetEl = $('#totalBudget');
    const avgConversionRateEl = $('#avgConversionRate');

    // Table
    const tableBody = $('#tableBody');
    const resultCount = $('#resultCount');

    // States
    const loadingEl = $('#loadingIndicator');
    const emptyEl = $('#emptyState');
    const errorEl = $('#errorState');
    const errorMessage = $('#errorMessage');
    const retryBtn = $('#retryBtn');

    // Pagination
    const pagination = $('#pagination');
    const paginationInfo = $('#paginationInfo');
    const prevBtn = $('#prevPage');
    const nextBtn = $('#nextPage');
    const pageNumbers = $('#pageNumbers');

    // Controls
    const refreshBtn = $('#refreshBtn');
    const newCampaignBtn = $('#newCampaignBtn');
    const statusFilter = $('#statusFilter');

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        campaigns: [],
        stats: null,
        currentPage: 1,
        pageSize: 20,
        total: 0,
        statusFilter: '',
        isLoading: false
    };

    // ============================================================
    // SHOW / HIDE STATES
    // ============================================================
    function showLoading() {
        loadingEl.style.display = 'block';
        emptyEl.style.display = 'none';
        errorEl.style.display = 'none';
        tableBody.style.display = 'none';
        pagination.style.display = 'none';
    }

    function hideLoading() {
        loadingEl.style.display = 'none';
    }

    function showEmpty() {
        emptyEl.style.display = 'block';
        errorEl.style.display = 'none';
        loadingEl.style.display = 'none';
        tableBody.style.display = 'none';
        pagination.style.display = 'none';
    }

    function showError(message) {
        errorEl.style.display = 'block';
        emptyEl.style.display = 'none';
        loadingEl.style.display = 'none';
        tableBody.style.display = 'none';
        pagination.style.display = 'none';
        errorMessage.textContent = message || 'An error occurred while fetching campaigns.';
    }

    function showTable() {
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'none';
        errorEl.style.display = 'none';
        tableBody.style.display = '';
        pagination.style.display = '';
    }

    // ============================================================
    // FETCH DATA
    // ============================================================
    async function fetchCampaigns() {
        try {
            const params = {
                page: state.currentPage,
                page_size: state.pageSize
            };
            if (state.statusFilter) {
                params.status = state.statusFilter;
            }

            const result = await window.api.get('/campaigns', params);
            state.campaigns = result.data || [];
            state.total = result.total || 0;
            return true;
        } catch (error) {
            console.warn('[Campaigns] Fetch failed:', error.message);
            return false;
        }
    }

    async function fetchStats() {
        try {
            const result = await window.api.get('/campaigns');
            const all = result.data || [];
            
            const active = all.filter(c => c.status === 'active').length;
            const totalBudget = all.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0);
            
            // Calculate average conversion rate
            let totalConversions = 0;
            let totalSent = 0;
            all.forEach(c => {
                const metrics = c.metrics || {};
                totalSent += (metrics.sent || 0);
                totalConversions += (metrics.converted || 0);
            });
            const avgConversion = totalSent > 0 ? ((totalConversions / totalSent) * 100).toFixed(1) : 0;

            state.stats = {
                total: all.length,
                active: active,
                totalBudget: totalBudget,
                avgConversion: avgConversion
            };
            return true;
        } catch (error) {
            console.warn('[Campaigns] Stats fetch failed:', error.message);
            return false;
        }
    }

    // ============================================================
    // RENDER TABLE
    // ============================================================
    function renderTable() {
        tableBody.innerHTML = '';

        if (!state.campaigns || state.campaigns.length === 0) {
            showEmpty();
            return;
        }

        showTable();

        state.campaigns.forEach(c => {
            const name = c.name || 'Unnamed Campaign';
            const type = c.campaign_type || 'email';
            const status = c.status || 'draft';
            const budget = parseFloat(c.budget) || 0;
            const spent = parseFloat(c.spent) || 0;
            const metrics = c.metrics || {};

            const statusBadge = status === 'active' ? 'badge--active'
                : status === 'completed' ? 'badge--completed'
                : status === 'scheduled' ? 'badge--scheduled'
                : status === 'paused' ? 'badge--paused'
                : 'badge--draft';

            const spendPercentage = budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${name}</strong>
                </td>
                <td>
                    <span class="badge badge--${type}">${type}</span>
                </td>
                <td>
                    <span class="badge ${statusBadge}">${status}</span>
                </td>
                <td>$${budget.toLocaleString()}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; background: #DFE6E9; border-radius: 4px; height: 6px; overflow: hidden;">
                            <div style="height: 100%; background: #6C5CE7; width: ${Math.min(spendPercentage, 100)}%;"></div>
                        </div>
                        <span style="font-size: 12px; color: #636E72;">$${spent.toLocaleString()} (${spendPercentage}%)</span>
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px;">
                        <span>📤 ${metrics.sent || 0}</span> |
                        <span>👁️ ${metrics.opened || 0}</span> |
                        <span>✅ ${metrics.converted || 0}</span>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm" style="margin-right: 4px;">Edit</button>
                    <button class="btn btn-sm btn-outline">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // ============================================================
    // UPDATE STATS
    // ============================================================
    function updateStats() {
        if (state.stats) {
            totalCampaignsEl.textContent = state.stats.total || 0;
            activeCampaignsEl.textContent = state.stats.active || 0;
            totalBudgetEl.textContent = '$' + (state.stats.totalBudget || 0).toLocaleString('en-US', {maximumFractionDigits: 0});
            avgConversionRateEl.textContent = (state.stats.avgConversion || 0) + '%';
        }
    }

    // ============================================================
    // PAGINATION
    // ============================================================
    function updatePagination() {
        const totalPages = Math.ceil(state.total / state.pageSize);
        paginationInfo.textContent = `Showing ${(state.currentPage - 1) * state.pageSize + 1} to ${Math.min(state.currentPage * state.pageSize, state.total)} of ${state.total}`;
        
        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage >= totalPages;

        pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages && i <= 5; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === state.currentPage ? 'active' : '';
            btn.addEventListener('click', () => {
                state.currentPage = i;
                loadAllData();
            });
            pageNumbers.appendChild(btn);
        }
    }

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    async function loadAllData() {
        showLoading();
        try {
            const [campaignsSuccess, statsSuccess] = await Promise.all([
                fetchCampaigns(),
                fetchStats()
            ]);

            if (campaignsSuccess && statsSuccess) {
                updateStats();
                renderTable();
                updatePagination();
            } else {
                showError('Failed to load campaigns. Please try again.');
            }
        } catch (error) {
            console.error('[Campaigns] Error:', error);
            showError('An unexpected error occurred.');
        }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    
    // Sidebar toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            state.currentPage = 1;
            loadAllData();
        });
    }

    // Filter by status
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            state.statusFilter = e.target.value;
            state.currentPage = 1;
            loadAllData();
        });
    }

    // New campaign button
    if (newCampaignBtn) {
        newCampaignBtn.addEventListener('click', () => {
            alert('Create campaign feature coming soon!');
        });
    }

    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', loadAllData);
    }

    // Pagination
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                loadAllData();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(state.total / state.pageSize);
            if (state.currentPage < totalPages) {
                state.currentPage++;
                loadAllData();
            }
        });
    }

    // ============================================================
    // INITIAL LOAD
    // ============================================================
    loadAllData();
})();
