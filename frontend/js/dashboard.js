/* ============================================================
   DASHBOARD.JS - SmartSaaS Analytics
   Chart.js Integration, Live API Data, Interactivity
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // DOM REFERENCES
    // ============================================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    const menuToggle = $('#menuToggle');
    const refreshBtn = $('#refreshBtn');
    const exportBtn = $('#exportBtn');
    const datePresets = $$('.date-preset');
    const chartPeriods = $$('.chart-period');
    const tabBtns = $$('.tab-btn');
    const activityList = $('#activityList');
    const tableBody = $('#tableBody');

    // Stat elements
    const totalCustomersEl = $('#totalCustomers');
    const activeCustomersEl = $('#activeSubscriptions');
    const churnRateEl = $('#churnRate');
    const monthlyRevenueEl = $('#monthlyRevenue');

    // ============================================================
    // STATE (Live data from API)
    // ============================================================
    let dashboardData = null;
    let customerList = [];

    // ============================================================
    // FETCH DASHBOARD DATA
    // ============================================================
    async function fetchDashboardData() {
        try {
            const data = await window.api.get('/dashboard');
            dashboardData = data;
            return data;
        } catch (error) {
            console.warn('[Dashboard] API fetch failed:', error.message);
            return {
                total_customers: 0,
                active_customers: 0,
                inactive_customers: 0,
                industry_distribution: [],
                country_distribution: [],
                customer_growth: { labels: [], data: [] },
                revenue_data: { labels: [], data: [] },
                plan_distribution: []
            };
        }
    }

    async function fetchCustomers() {
        try {
            const result = await window.api.get('/customers', { page: 1, page_size: 5 });
            customerList = result.data || [];
            return customerList;
        } catch (error) {
            console.warn('[Dashboard] Customer fetch failed:', error.message);
            return [];
        }
    }

    async function fetchReport() {
        try {
            const revenue = await window.api.get('/reports/revenue');
            const churn = await window.api.get('/reports/churn-summary');
            return { revenue, churn };
        } catch (error) {
            console.warn('[Dashboard] Report fetch failed:', error.message);
            return { 
                revenue: { total_revenue: 0, active_subscriptions: 0 }, 
                churn: { churn_rate: 0 } 
            };
        }
    }

    // ============================================================
    // CHARTS
    // ============================================================
    let revenueChart = null;
    let customerChart = null;
    let distributionChart = null;

    function formatCurrency(value) {
        return '$' + Number(value).toLocaleString();
    }

    function renderCharts() {
        // --- REVENUE CHART (Bar) ---
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        if (revenueChart) revenueChart.destroy();

        const revenueData = dashboardData?.revenue_data;
        if (!revenueData || !revenueData.labels || !revenueData.data) {
            // Show "No Data Available" for revenue chart
            revenueChart = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                },
                plugins: [{
                    id: 'noData',
                    afterDraw: function(chart) {
                        const ctx = chart.ctx;
                        const width = chart.width;
                        const height = chart.height;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '16px Inter, sans-serif';
                        ctx.fillStyle = '#636E72';
                        ctx.fillText('No Data Available', width / 2, height / 2);
                    }
                }]
            });
            return;
        }

        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.data,
                    backgroundColor: function (context) {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(108, 92, 231, 0.6)';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(108, 92, 231, 0.15)');
                        gradient.addColorStop(0.5, 'rgba(108, 92, 231, 0.5)');
                        gradient.addColorStop(1, 'rgba(108, 92, 231, 0.85)');
                        return gradient;
                    },
                    borderColor: '#6C5CE7',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E1E2D',
                        titleColor: '#fff',
                        bodyColor: '#A2A3B7',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return 'Revenue: $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#B2BEC3', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                        ticks: {
                            color: '#B2BEC3',
                            font: { size: 11 },
                            callback: function (value) {
                                return '$' + (value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });

        // --- CUSTOMER GROWTH CHART (Line) ---
        const customerCtx = document.getElementById('customerChart').getContext('2d');
        if (customerChart) customerChart.destroy();

        const customerGrowthData = dashboardData?.customer_growth;
        if (!customerGrowthData || !customerGrowthData.labels || !customerGrowthData.data) {
            // Show "No Data Available" for customer chart
            customerChart = new Chart(customerCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                },
                plugins: [{
                    id: 'noData',
                    afterDraw: function(chart) {
                        const ctx = chart.ctx;
                        const width = chart.width;
                        const height = chart.height;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '16px Inter, sans-serif';
                        ctx.fillStyle = '#636E72';
                        ctx.fillText('No Data Available', width / 2, height / 2);
                    }
                }]
            });
            return;
        }

        customerChart = new Chart(customerCtx, {
            type: 'line',
            data: {
                labels: customerGrowthData.labels,
                datasets: [{
                    label: 'Customers',
                    data: customerGrowthData.data,
                    fill: true,
                    backgroundColor: function (context) {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(0, 184, 148, 0.1)';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(0, 184, 148, 0)');
                        gradient.addColorStop(0.5, 'rgba(0, 184, 148, 0.15)');
                        gradient.addColorStop(1, 'rgba(0, 184, 148, 0.35)');
                        return gradient;
                    },
                    borderColor: '#00B894',
                    borderWidth: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#00B894',
                    pointBorderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E1E2D',
                        titleColor: '#fff',
                        bodyColor: '#A2A3B7',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return 'Customers: ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#B2BEC3', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                        ticks: {
                            color: '#B2BEC3',
                            font: { size: 11 },
                            callback: function (value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });

        // --- DISTRIBUTION CHART (Doughnut) ---
        const distCtx = document.getElementById('distributionChart').getContext('2d');
        if (distributionChart) distributionChart.destroy();

        const distData = buildDistributionData();

        distributionChart = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: distData.labels,
                datasets: [{
                    data: distData.data,
                    backgroundColor: ['#A29BFE', '#6C5CE7', '#5A4BD1', '#00B894', '#FDCB6E'],
                    borderColor: '#FFFFFF',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            color: '#636E72',
                            font: { size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1E1E2D',
                        titleColor: '#fff',
                        bodyColor: '#A2A3B7',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function (chart) {
                    const { width, height, ctx } = chart;
                    ctx.save();
                    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const text = total.toString();
                    const x = width / 2;
                    const y = height / 2 - 8;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold 28px Inter, sans-serif';
                    ctx.fillStyle = '#2D3436';
                    ctx.fillText(text, x, y);
                    ctx.font = '12px Inter, sans-serif';
                    ctx.fillStyle = '#636E72';
                    ctx.fillText('Total', x, y + 24);
                    ctx.restore();
                }
            }]
        });
    }

    function buildDistributionData() {
        if (dashboardData && dashboardData.industry_distribution && dashboardData.industry_distribution.length > 0) {
            const labels = dashboardData.industry_distribution.map(d => d.industry);
            const data = dashboardData.industry_distribution.map(d => d.count);
            return { labels, data };
        }
        return { labels: [], data: [] };
    }

    // ============================================================
    // UPDATE STATS
    // ============================================================
    function updateStats(reportData) {
        // Total Customers - from customers table
        const totalCustomers = dashboardData?.total_customers || 0;
        totalCustomersEl.textContent = totalCustomers.toLocaleString();

        // Active Subscriptions - from subscriptions table
        const activeSubscriptions = reportData?.revenue?.active_subscriptions || 0;
        activeCustomersEl.textContent = activeSubscriptions.toLocaleString();

        // Churn Rate - from query calculation
        const churnRate = reportData?.churn?.churn_rate || 0;
        churnRateEl.textContent = churnRate + '%';

        // Monthly Revenue - from subscriptions table
        const monthlyRevenue = reportData?.revenue?.total_revenue || 0;
        monthlyRevenueEl.textContent = '$' + monthlyRevenue.toLocaleString();
    }

    // ============================================================
    // RENDER CUSTOMER TABLE
    // ============================================================
    function renderTable() {
        tableBody.innerHTML = '';
        const customers = customerList.length > 0 ? customerList : [];

        if (customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#636E72;">No Data Available</td></tr>';
            return;
        }

        customers.forEach(c => {
            const name = c.company_name || c.contact_name || 'Unknown';
            const email = c.email || '—';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const status = c.status || 'unknown';
            const statusBadge = status === 'Active' ? 'badge--active' : status === 'Inactive' ? 'badge--inactive' : 'badge--pending';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="customer-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C5CE7&color=fff&size=34" alt="${name}" class="customer-avatar">
                        <div>
                            <span class="customer-name">${name}</span>
                            <span class="customer-email">${email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge">${c.industry || '—'}</span></td>
                <td><span class="badge ${statusBadge}">${status}</span></td>
                <td><strong>${c.company_size || '—'}</strong></td>
                <td><span class="risk-label risk-label--low">—</span></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    async function loadAllData() {
        try {
            const [dashboardResult, customersResult, reportResult] = await Promise.all([
                fetchDashboardData(),
                fetchCustomers(),
                fetchReport()
            ]);

            updateStats(reportResult);
            renderTable();
            renderCharts();
        } catch (error) {
            console.error('[Dashboard] Error loading data:', error);
            updateStats({ revenue: { total_revenue: 0, active_subscriptions: 0 }, churn: { churn_rate: 0 } });
            renderTable();
            renderCharts();
        }
    }

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

    // ============================================================
    // DATE PRESETS
    // ============================================================
    datePresets.forEach(btn => {
        btn.addEventListener('click', function () {
            datePresets.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            showToast('Info', 'Data updated for: ' + this.textContent.trim());
        });
    });

    // ============================================================
    // CHART PERIOD TOGGLE
    // ============================================================
    chartPeriods.forEach(btn => {
        btn.addEventListener('click', function () {
            const parent = this.closest('.chart-actions');
            parent.querySelectorAll('.chart-period').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            showToast('Info', 'Switched to ' + this.textContent.trim() + ' view');
        });
    });

    // ============================================================
    // TAB BUTTONS (Distribution)
    // ============================================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const parent = this.closest('.card-header-tabs');
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            showToast('Info', 'Viewing: ' + this.textContent.trim());
        });
    });

    // ============================================================
    // REFRESH BUTTON
    // ============================================================
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            loadAllData().finally(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                showToast('Success', 'Dashboard data refreshed!');
            });
        });
    }

    // ============================================================
    // EXPORT BUTTON
    // ============================================================
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            showToast('Export', 'Exporting report as PDF...');
            setTimeout(() => {
                showToast('Success', 'Report exported successfully!');
            }, 1500);
        });
    }

    // ============================================================
    // SEARCH FUNCTIONALITY
    // ============================================================
    const searchInput = $('#searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase().trim();
            if (query.length > 0) {
                showToast('Search', 'Searching for: "' + query + '"');
            }
        });
    }

    const tableSearchInput = document.querySelector('.table-search input');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase().trim();
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    // ============================================================
    // TOAST NOTIFICATION SYSTEM
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
                    <i class="${title === 'Success' ? 'fas fa-check-circle' : 'fas fa-info-circle'}"></i>
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
    // NOTIFICATION BUTTON
    // ============================================================
    const notifBtn = $('#notifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', function () {
            showToast('Notifications', 'No notifications available');
        });
    }

    // ============================================================
    // WINDOW RESIZE HANDLER
    // ============================================================
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderCharts();
        }, 200);
    });

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        loadAllData();
        console.log('%c SmartSaaS Analytics Dashboard ', 'background: #6C5CE7; color: white; font-size: 14px; padding: 8px 16px; border-radius: 4px; font-weight: 600;');
        console.log('%c Dashboard connecting to live API... ', 'color: #00B894; font-size: 12px;');
    }

    // Run after DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();