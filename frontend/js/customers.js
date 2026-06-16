/* ============================================================
   CUSTOMERS.JS - SmartSaaS Analytics
   Fetch API, Search, Filter, Pagination
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // DOM REFERENCES
    // ============================================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Sidebar / Header
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    const menuToggle = $('#menuToggle');

    // Stats
    const totalCustomersEl = $('#totalCustomers');
    const activeCustomersEl = $('#activeCustomers');
    const inactiveCustomersEl = $('#inactiveCustomers');
    const industriesCountEl = $('#industriesCount');

    // Search & Filters
    const searchInput = $('#searchCustomer');
    const searchClear = $('#searchClear');
    const filterStatus = $('#filterStatus');
    const filterIndustry = $('#filterIndustry');
    const filterSort = $('#filterSort');

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
    const pageSizeSelect = $('#pageSize');

    // Buttons
    const refreshBtn = $('#refreshBtn');
    const exportBtn = $('#exportBtn');

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        customers: [],
        industries: [],
        stats: null,
        currentPage: 1,
        pageSize: 20,
        total: 0,
        searchQuery: '',
        statusFilter: '',
        industryFilter: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
        isLoading: false
    };

    // ============================================================
    // API - Using centralized API from api.js
    // ============================================================
    async function fetchAPI(endpoint, params = {}) {
        return window.api.get(endpoint, params);
    }

    // ============================================================
    // SHOW / HIDE STATES
    // ============================================================
    function showLoading() {
        loadingEl.classList.add('active');
        emptyEl.classList.remove('active');
        errorEl.classList.remove('active');
        tableBody.style.display = 'none';
        pagination.style.display = 'none';
    }

    function hideLoading() {
        loadingEl.classList.remove('active');
    }

    function showEmpty() {
        emptyEl.classList.add('active');
        errorEl.classList.remove('active');
        tableBody.style.display = 'none';
        pagination.style.display = 'none';
    }

    function showError(message) {
        errorEl.classList.add('active');
        emptyEl.classList.remove('active');
        loadingEl.classList.remove('active');
        tableBody.style.display = 'none';
        pagination.style.display = 'none';
        errorMessage.textContent = message || 'An error occurred while fetching data.';
    }

    function showTable() {
        loadingEl.classList.remove('active');
        emptyEl.classList.remove('active');
        errorEl.classList.remove('active');
        tableBody.style.display = '';
        pagination.style.display = '';
    }

    // ============================================================
    // RENDER TABLE ROWS
    // ============================================================
    function renderTable() {
        tableBody.innerHTML = '';

        if (!state.customers || state.customers.length === 0) {
            showEmpty();
            return;
        }

        showTable();

        state.customers.forEach(c => {
            const initials = c.contact_name
                ? c.contact_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : '??';
            const name = c.company_name || 'Unknown Company';
            const contactName = c.contact_name || '--';
            const email = c.email || '--';
            const phone = c.phone || '';
            const industry = c.industry || '--';
            const country = c.country || '--';
            const status = c.status || 'unknown';
            const created = c.created_at ? formatDate(c.created_at) : '--';

            const statusBadge = status === 'active' ? 'badge--active'
                : status === 'inactive' ? 'badge--inactive'
                : status === 'pending' ? 'badge--pending'
                : status === 'suspended' ? 'badge--suspended'
                : 'badge--inactive';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="customer-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C5CE7&color=fff&size=36"
                             alt="${name}" class="customer-avatar"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22><rect width=%2236%22 height=%2236%22 rx=%2218%22 fill=%22%236C5CE7%22/><text x=%2218%22 y=%2221%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2212%22 font-weight=%22600%22>${initials}</text></svg>'">
                        <div>
                            <span class="customer-name">${escapeHtml(name)}</span>
                            <span class="customer-company">${escapeHtml(industry)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-cell">
                        <span class="contact-email">${escapeHtml(email)}</span>
                        ${phone ? `<span class="contact-phone">${escapeHtml(phone)}</span>` : ''}
                    </div>
                </td>
                <td>${escapeHtml(industry)}</td>
                <td>
                    <span class="country-badge">
                        <i class="fas fa-map-marker-alt"></i>
                        ${escapeHtml(country)}
                    </span>
                </td>
                <td><span class="badge ${statusBadge}">${escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))}</span></td>
                <td><span class="date-cell">${created}</span></td>
            `;
            // Click row to navigate to customer detail
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                window.location.href = `customer-detail.html?id=${c.id}`;
            });
            tableBody.appendChild(row);
        });
    }

    // ============================================================
    // RENDER PAGINATION
    // ============================================================
    function renderPagination() {
        const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
        const currentPage = state.currentPage;

        paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        // Update result count
        const start = (currentPage - 1) * state.pageSize + 1;
        const end = Math.min(currentPage * state.pageSize, state.total);
        resultCount.textContent = `Showing ${start}-${end} of ${state.total} customers`;

        // Previous / Next buttons
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        // Generate page numbers
        pageNumbers.innerHTML = '';
        const maxVisible = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // First page + ellipsis
        if (startPage > 1) {
            const firstBtn = createPageBtn(1);
            pageNumbers.appendChild(firstBtn);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'cust-page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = createPageBtn(i);
            if (i === currentPage) btn.classList.add('active');
            pageNumbers.appendChild(btn);
        }

        // Last page + ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'cust-page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            }
            const lastBtn = createPageBtn(totalPages);
            pageNumbers.appendChild(lastBtn);
        }
    }

    function createPageBtn(page) {
        const btn = document.createElement('button');
        btn.className = 'cust-page-num';
        btn.textContent = page;
        btn.addEventListener('click', () => goToPage(page));
        return btn;
    }

    function goToPage(page) {
        if (page < 1 || page > Math.ceil(state.total / state.pageSize)) return;
        if (page === state.currentPage) return;
        state.currentPage = page;
        loadCustomers();
    }

    // ============================================================
    // UPDATE STATS
    // ============================================================
    function updateStats(stats) {
        if (!stats) return;
        totalCustomersEl.textContent = (stats.total_customers || 0).toLocaleString();
        activeCustomersEl.textContent = (stats.active_count || 0).toLocaleString();
        inactiveCustomersEl.textContent = (stats.inactive_count || 0).toLocaleString();
        industriesCountEl.textContent = (stats.industry_count || 0).toLocaleString();
    }

    // ============================================================
    // LOAD INDUSTRIES FOR FILTER
    // ============================================================
    async function loadIndustries() {
        try {
            const data = await fetchAPI('/customers/industries');
            state.industries = Array.isArray(data) ? data : [];
            renderIndustryOptions();
        } catch (err) {
            console.warn('Failed to load industries:', err.message);
        }
    }

    function renderIndustryOptions() {
        const select = filterIndustry;
        // Keep the first "All Industries" option
        select.innerHTML = '<option value="">All Industries</option>';
        state.industries.forEach(ind => {
            const name = ind.industry || ind.name || ind;
            const count = ind.count || '';
            const option = document.createElement('option');
            option.value = typeof name === 'string' ? name.toLowerCase() : name;
            option.textContent = typeof name === 'string'
                ? name.charAt(0).toUpperCase() + name.slice(1) + (count ? ` (${count})` : '')
                : name;
            select.appendChild(option);
        });
    }

    // ============================================================
    // MAIN DATA LOADER
    // ============================================================
    async function loadCustomers() {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        try {
            // Build sort params
            let sortBy = 'created_at';
            let sortOrder = 'desc';
            if (state.sortBy === 'company_name') {
                sortBy = 'company_name';
                sortOrder = state.sortOrder;
            } else {
                sortBy = 'created_at';
                sortOrder = state.sortOrder;
            }

            const params = {
                page: state.currentPage,
                page_size: state.pageSize,
                search: state.searchQuery || null,
                status: state.statusFilter || null,
                industry: state.industryFilter || null,
                sort_by: sortBy,
                sort_order: sortOrder
            };

            const data = await fetchAPI('/customers', params);

            state.total = data.total || 0;
            state.customers = data.data || [];

            hideLoading();
            renderTable();
            renderPagination();
        } catch (err) {
            hideLoading();
            showError(err.message);
            console.error('Failed to load customers:', err);
        } finally {
            state.isLoading = false;
        }
    }

    // ============================================================
    // LOAD STATS
    // ============================================================
    async function loadStats() {
        try {
            const data = await fetchAPI('/customers/stats');
            state.stats = data;
            updateStats(data);
        } catch (err) {
            console.warn('Failed to load stats:', err);
        }
    }

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    async function loadAll() {
        state.currentPage = 1;
        await Promise.all([
            loadStats(),
            loadIndustries(),
            loadCustomers()
        ]);
    }

    // ============================================================
    // SEARCH WITH DEBOUNCE
    // ============================================================
    let searchTimeout = null;
    searchInput.addEventListener('input', function () {
        const query = this.value.trim();
        searchClear.classList.toggle('visible', query.length > 0);

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = query;
            state.currentPage = 1;
            loadCustomers();
        }, 400);
    });

    searchClear.addEventListener('click', function () {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        state.searchQuery = '';
        state.currentPage = 1;
        loadCustomers();
        searchInput.focus();
    });

    // ============================================================
    // FILTER EVENTS
    // ============================================================
    filterStatus.addEventListener('change', function () {
        state.statusFilter = this.value;
        state.currentPage = 1;
        loadCustomers();
    });

    filterIndustry.addEventListener('change', function () {
        state.industryFilter = this.value;
        state.currentPage = 1;
        loadCustomers();
    });

    filterSort.addEventListener('change', function () {
        const value = this.value;
        const parts = value.split('_');
        if (parts.length >= 3) {
            state.sortBy = parts[0] + '_' + parts[1];
            state.sortOrder = parts[2];
        } else if (parts.length === 2) {
            state.sortBy = parts[0];
            state.sortOrder = parts[1];
        }
        state.currentPage = 1;
        loadCustomers();
    });

    // ============================================================
    // PAGE SIZE CHANGE
    // ============================================================
    pageSizeSelect.addEventListener('change', function () {
        state.pageSize = parseInt(this.value, 10);
        state.currentPage = 1;
        loadCustomers();
    });

    // ============================================================
    // PAGINATION BUTTONS
    // ============================================================
    prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            goToPage(state.currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.total / state.pageSize);
        if (state.currentPage < totalPages) {
            goToPage(state.currentPage + 1);
        }
    });

    // ============================================================
    // REFRESH BUTTON
    // ============================================================
    refreshBtn.addEventListener('click', function () {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        this.disabled = true;
        loadAll().finally(() => {
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            this.disabled = false;
            showToast('Success', 'Customer data refreshed!');
        });
    });

    // ============================================================
    // EXPORT BUTTON
    // ============================================================
    exportBtn.addEventListener('click', function () {
        showToast('Export', 'Exporting customer data as CSV...');
        setTimeout(() => {
            // Build CSV from current data
            if (!state.customers || state.customers.length === 0) {
                showToast('Warning', 'No data to export');
                return;
            }
            exportToCSV();
            showToast('Success', 'Customer data exported!');
        }, 500);
    });

    function exportToCSV() {
        const headers = ['Company Name', 'Contact Name', 'Email', 'Phone', 'Industry', 'Country', 'Status', 'Created'];
        const rows = state.customers.map(c => [
            c.company_name || '',
            c.contact_name || '',
            c.email || '',
            c.phone || '',
            c.industry || '',
            c.country || '',
            c.status || '',
            c.created_at || ''
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(val => `"${val.replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ============================================================
    // RETRY
    // ============================================================
    retryBtn.addEventListener('click', function () {
        loadAll();
    });

    // ============================================================
    // SIDEBAR TOGGLE (Mobile)
    // ============================================================
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSidebar();
    });

    // Keyboard shortcut: Escape to clear search
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
        }
    });

    // ============================================================
    // TOAST NOTIFICATION (reused from dashboard)
    // ============================================================
    let toastTimeout = null;

    function showToast(title, message) {
        const existing = document.querySelector('.toast-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `
            <div class="toast">
                <div class="toast-icon">
                    <i class="${title === 'Success' ? 'fas fa-check-circle' : title === 'Warning' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'}"></i>
                </div>
                <div class="toast-content">
                    <p class="toast-title">${title}</p>
                    <p class="toast-message">${message}</p>
                </div>
                <button class="toast-close"><i class="fas fa-times"></i></button>
            </div>
        `;
        document.body.appendChild(container);

        requestAnimationFrame(() => {
            container.classList.add('toast-visible');
        });

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            container.classList.remove('toast-visible');
            setTimeout(() => container.remove(), 300);
        }, 3000);

        container.querySelector('.toast-close').addEventListener('click', function () {
            container.classList.remove('toast-visible');
            setTimeout(() => container.remove(), 300);
        });
    }

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    function formatDate(dateStr) {
        if (!dateStr) return '--';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        } catch {
            return dateStr;
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============================================================
    // NOTIFICATION BUTTON
    // ============================================================
    const notifBtn = $('#notifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', function () {
            showToast('Notifications', 'You have 3 unread notifications');
        });
    }

    // ============================================================
    // GLOBAL SEARCH (header search)
    // ============================================================
    const globalSearch = document.querySelector('.header-search input');
    if (globalSearch) {
        globalSearch.addEventListener('input', function () {
            const query = this.value.trim();
            if (query.length > 2) {
                showToast('Search', `Searching for: "${query}"`);
            }
        });
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        loadAll();
        console.log('%c SmartSaaS Analytics ', 'background: #6C5CE7; color: white; font-size: 14px; padding: 8px 16px; border-radius: 4px; font-weight: 600;');
        console.log('%c Customers page initialized! ', 'color: #00B894; font-size: 12px;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();