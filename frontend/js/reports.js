/* ============================================================
   REPORTS.JS - SmartSaaS Analytics
   Reports Generation & Analytics
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

    // Tabs
    const reportTabs = $$('.tab-btn');
    const reportSections = $$('.report-section');

    // Controls
    const refreshBtn = $('#refreshBtn');
    const exportBtn = $('#exportBtn');

    // States
    const loadingEl = $('#loadingIndicator');
    const errorEl = $('#errorState');
    const errorMessage = $('#errorMessage');
    const retryBtn = $('#retryBtn');

    // Charts
    let revenueByPlanChart = null;
    let industryChart = null;
    let priorityChart = null;
    let plansChart = null;

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        currentReport: 'churn',
        reportData: {}
    };

    // ============================================================
    // FETCH REPORTS DATA
    // ============================================================
    async function fetchChurnReport() {
        try {
            const data = await window.api.get('/reports/churn-summary');
            const churnRate = data.churn_rate || 0;
            
            $('#churnTotalCustomers').textContent = (data.total_customers || 0).toLocaleString();
            $('#churnActiveCustomers').textContent = (data.active_customers || 0).toLocaleString();
            $('#churnInactiveCustomers').textContent = (data.inactive_customers || 0).toLocaleString();
            $('#churnRate').textContent = churnRate.toFixed(1) + '%';
            
            state.reportData.churn = data;
            return true;
        } catch (error) {
            console.warn('[Reports] Churn fetch failed:', error.message);
            return false;
        }
    }

    async function fetchRevenueReport() {
        try {
            const data = await window.api.get('/reports/revenue');
            
            $('#revenueTotal').textContent = '$' + (data.total_revenue || 0).toLocaleString();
            $('#revenueActiveSubscriptions').textContent = (data.active_subscriptions || 0).toLocaleString();
            
            state.reportData.revenue = data;
            renderRevenueByPlanChart(data.by_plan || []);
            return true;
        } catch (error) {
            console.warn('[Reports] Revenue fetch failed:', error.message);
            return false;
        }
    }

    async function fetchIndustryReport() {
        try {
            const data = await window.api.get('/reports/industry');
            state.reportData.industry = data;
            renderIndustryChart(data.industries || []);
            return true;
        } catch (error) {
            console.warn('[Reports] Industry fetch failed:', error.message);
            return false;
        }
    }

    async function fetchSupportReport() {
        try {
            const data = await window.api.get('/reports/support-tickets');
            
            $('#supportTotalTickets').textContent = (data.total || 0).toLocaleString();
            $('#supportOpenTickets').textContent = (data.open || 0).toLocaleString();
            $('#supportClosedTickets').textContent = (data.closed || 0).toLocaleString();
            
            state.reportData.support = data;
            renderPriorityChart(data.by_priority || []);
            return true;
        } catch (error) {
            console.warn('[Reports] Support fetch failed:', error.message);
            return false;
        }
    }

    async function fetchPlansReport() {
        try {
            const data = await window.api.get('/reports/plan-distribution');
            state.reportData.plans = data;
            renderPlansChart(data.plans || []);
            return true;
        } catch (error) {
            console.warn('[Reports] Plans fetch failed:', error.message);
            return false;
        }
    }

    // ============================================================
    // RENDER CHARTS
    // ============================================================
    function renderRevenueByPlanChart(data) {
        const ctx = document.getElementById('revenueByPlanCanvas');
        if (!ctx) return;

        if (revenueByPlanChart) revenueByPlanChart.destroy();

        const labels = data.map(d => d.plan);
        const revenues = data.map(d => d.revenue);
        const colors = ['#6C5CE7', '#A29BFE', '#5A4BD1', '#00B894', '#FDCB6E'];

        revenueByPlanChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: revenues,
                    backgroundColor: colors.slice(0, labels.length),
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => '$' + (value / 1000) + 'k'
                        }
                    }
                }
            }
        });
    }

    function renderIndustryChart(data) {
        const ctx = document.getElementById('industryChart');
        if (!ctx) return;

        if (industryChart) industryChart.destroy();

        const labels = data.map(d => d.industry);
        const counts = data.map(d => d.count);

        industryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#6C5CE7', '#A29BFE', '#5A4BD1', '#00B894', '#FDCB6E', '#FF6B6B', '#FFA06B'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function renderPriorityChart(data) {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        if (priorityChart) priorityChart.destroy();

        const labels = data.map(d => d.priority);
        const counts = data.map(d => d.count);

        priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tickets',
                    data: counts,
                    backgroundColor: ['#FF6B6B', '#FDCB6E', '#00B894', '#6C5CE7'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function renderPlansChart(data) {
        const ctx = document.getElementById('plansChart');
        if (!ctx) return;

        if (plansChart) plansChart.destroy();

        const labels = data.map(d => d.plan);
        const counts = data.map(d => d.count);

        plansChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#6C5CE7', '#00B894', '#FDCB6E', '#FF6B6B'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // ============================================================
    // SWITCH REPORTS
    // ============================================================
    function switchReport(reportType) {
        // Hide all sections
        reportSections.forEach(section => {
            section.style.display = 'none';
        });

        // Update active tab
        reportTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected section
        const selectedSection = $(`#${reportType}-report`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }

        // Mark tab as active
        const selectedTab = $(`[data-report="${reportType}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        state.currentReport = reportType;
    }

    // ============================================================
    // LOAD ALL REPORTS
    // ============================================================
    async function loadAllReports() {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        try {
            await Promise.all([
                fetchChurnReport(),
                fetchRevenueReport(),
                fetchIndustryReport(),
                fetchSupportReport(),
                fetchPlansReport()
            ]);
            loadingEl.style.display = 'none';
        } catch (error) {
            console.error('[Reports] Error:', error);
            errorEl.style.display = 'block';
            errorMessage.textContent = 'Failed to load reports. Please try again.';
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

    // Report tabs
    reportTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const reportType = tab.getAttribute('data-report');
            switchReport(reportType);
        });
    });

    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAllReports);
    }

    // Export
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Export feature coming soon!');
        });
    }

    // Retry
    if (retryBtn) {
        retryBtn.addEventListener('click', loadAllReports);
    }

    // ============================================================
    // INITIAL LOAD
    // ============================================================
    loadAllReports();
})();
