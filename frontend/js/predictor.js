/* ============================================================
   PREDICTOR.JS - SmartSaaS Analytics
   AI Churn Prediction - Form Handling & API Integration
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
    const predictForm = $('#predictForm');
    const predictBtn = $('#predictBtn');
    const btnSpinner = $('#btnSpinner');
    const resultsEmpty = $('#resultsEmpty');
    const resultsContent = $('#resultsContent');
    const gaugeArc = $('#gaugeArc');
    const riskPercentage = $('#riskPercentage');
    const predictionBadge = $('#predictionBadge');
    const predictionIcon = $('#predictionIcon');
    const predictionText = $('#predictionText');
    const recommendationText = $('#recommendationText');
    const shapChart = $('#shapChart');
    const exampleChips = $$('.example-chip');

    // ============================================================
    // API - Using centralized API from api.js (URL is http://localhost:8000/api)
    // ============================================================

    // ============================================================
    // SIDEBAR TOGGLE
    // ============================================================
    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('sidebar-collapsed');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('sidebar-collapsed');
            overlay.classList.remove('active');
        });
    }

    // ============================================================
    // EXAMPLE DATA PRESETS
    // ============================================================
    const exampleData = {
        'low-risk': {
            company_size: 200,
            login_frequency: 25,
            days_since_last_activity: 2,
            support_ticket_count: 1,
            subscription_length: 720
        },
        'medium-risk': {
            company_size: 50,
            login_frequency: 8,
            days_since_last_activity: 14,
            support_ticket_count: 3,
            subscription_length: 180
        },
        'high-risk': {
            company_size: 10,
            login_frequency: 2,
            days_since_last_activity: 45,
            support_ticket_count: 8,
            subscription_length: 30
        }
    };

    // ============================================================
    // QUICK FILL EXAMPLES
    // ============================================================
    exampleChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            const type = chip.getAttribute('data-example');
            const data = exampleData[type];
            if (!data) return;

            // Fill form fields
            $('#company_size').value = data.company_size;
            $('#login_frequency').value = data.login_frequency;
            $('#days_since_last_activity').value = data.days_since_last_activity;
            $('#support_ticket_count').value = data.support_ticket_count;
            $('#subscription_length').value = data.subscription_length;

            // Highlight active chip
            exampleChips.forEach(function (c) { c.classList.remove('active'); });
            chip.classList.add('active');

            // Optional auto-submit after delay
            // Uncomment to auto-submit: setTimeout(function() { predictForm.dispatchEvent(new Event('submit')); }, 300);
        });
    });

    // ============================================================
    // SVG CIRCUMFERENCE CALC
    // ============================================================
    const CIRCUMFERENCE = 2 * Math.PI * 54; // ~339.292

    function setGaugeValue(percent) {
        var clamped = Math.max(0, Math.min(100, percent));
        var offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
        gaugeArc.setAttribute('stroke-dashoffset', offset);

        // Color based on risk level
        var color;
        if (clamped <= 30) {
            color = '#00B894'; // success green
        } else if (clamped <= 60) {
            color = '#FDCB6E'; // warning yellow
        } else {
            color = '#FF6B6B'; // danger red
        }
        gaugeArc.setAttribute('stroke', color);
        riskPercentage.style.color = color;

        // Animate count-up
        animateValue(riskPercentage, 0, clamped, 800);
    }

    function animateValue(el, start, end, duration) {
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            var current = Math.round(start + (end - start) * eased);
            el.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    // ============================================================
    // SHAP CHART RENDERER
    // ============================================================
    function renderShapBars(shapValues) {
        if (!shapChart) return;

        // Sort by absolute shap value descending
        var sorted = shapValues.slice().sort(function (a, b) {
            return Math.abs(b.shap_value) - Math.abs(a.shap_value);
        });

        // Find max absolute shap value for scaling
        var maxAbs = 0;
        sorted.forEach(function (s) {
            var abs = Math.abs(s.shap_value);
            if (abs > maxAbs) maxAbs = abs;
        });
        if (maxAbs === 0) maxAbs = 1;

        var html = '';
        sorted.forEach(function (item) {
            var absVal = Math.abs(item.shap_value);
            var widthPercent = (absVal / maxAbs) * 100;
            var isPositive = item.impact === 'positive';
            var barClass = isPositive ? 'positive' : 'negative';
            var displayValue = item.shap_value.toFixed(4);
            var label = formatFeatureName(item.feature);

            html += '<div class="shap-bar-item">';
            html += '  <div class="shap-bar-header">';
            html += '    <span class="shap-bar-label">' + label + '</span>';
            html += '    <span class="shap-bar-value">' + displayValue + '</span>';
            html += '  </div>';
            html += '  <div class="shap-bar-track">';
            html += '    <div class="shap-bar-fill ' + barClass + '" style="width: ' + widthPercent + '%;">';
            html +=       isPositive ? 'Increases risk' : 'Decreases risk';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
        });

        shapChart.innerHTML = html;
    }

    function formatFeatureName(name) {
        var map = {
            'company_size': 'Company Size',
            'login_frequency': 'Login Frequency',
            'days_since_last_activity': 'Days Since Last Activity',
            'support_ticket_count': 'Support Ticket Count',
            'subscription_length': 'Subscription Length'
        };
        return map[name] || name.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    }

    // ============================================================
    // DISPLAY RESULTS
    // ============================================================
    function displayResults(data) {
        // Hide empty state, show results
        resultsEmpty.style.display = 'none';
        resultsContent.style.display = 'block';

        // 1. Risk Score Gauge
        setGaugeValue(data.risk_percentage);

        // 2. Prediction Badge
        var isChurn = data.prediction.toLowerCase() === 'churn';
        predictionBadge.className = 'prediction-badge ' + (isChurn ? 'churn' : 'no-churn');
        predictionIcon.className = 'fas ' + (isChurn ? 'fa-exclamation-triangle' : 'fa-check-circle');
        predictionText.textContent = isChurn ? 'Customer is likely to CHURN' : 'Customer is likely to STAY';

        // 3. Recommendation
        recommendationText.textContent = data.recommendation || 'No recommendation available.';

        // 4. SHAP Values
        if (data.shap_values && data.shap_values.length > 0) {
            renderShapBars(data.shap_values);
        } else {
            shapChart.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No SHAP explanation available.</p>';
        }
    }

    // ============================================================
    // FORM SUBMISSION
    // ============================================================
    predictForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Gather form data
        var payload = {
            company_size: parseFloat($('#company_size').value) || 0,
            login_frequency: parseFloat($('#login_frequency').value) || 0,
            days_since_last_activity: parseFloat($('#days_since_last_activity').value) || 0,
            support_ticket_count: parseFloat($('#support_ticket_count').value) || 0,
            subscription_length: parseFloat($('#subscription_length').value) || 0
        };

        // Validation
        if (payload.company_size <= 0) {
            showError('Company Size must be greater than 0.');
            return;
        }
        if (payload.subscription_length <= 0) {
            showError('Subscription Length must be greater than 0.');
            return;
        }

        predictChurn(payload);
    });

    // ============================================================
    // API CALL (using centralized api.js)
    // ============================================================
    function predictChurn(payload) {
        // Show loading state
        predictBtn.classList.add('loading');
        predictBtn.disabled = true;

        // Use centralized API
        window.api.post('/predict-churn', payload)
            .then(function (data) {
                displayResults(data);
            })
            .catch(function (error) {
                showError(error.message || 'Network error. Please ensure the backend server is running.');
            })
            .finally(function () {
                predictBtn.classList.remove('loading');
                predictBtn.disabled = false;
            });
    }

    // ============================================================
    // ERROR HANDLING
    // ============================================================
    function showError(message) {
        // Remove existing error toast
        var existing = $('.predictor-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'predictor-toast predictor-toast--error';
        toast.innerHTML =
            '<div class="toast-icon"><i class="fas fa-exclamation-circle"></i></div>' +
            '<div class="toast-content">' +
            '  <p class="toast-title">Error</p>' +
            '  <p class="toast-message">' + message + '</p>' +
            '</div>' +
            '<button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';

        document.body.appendChild(toast);

        // Auto remove after 6 seconds
        setTimeout(function () {
            if (toast.parentElement) toast.remove();
        }, 6000);
    }

    // ============================================================
    // TOAST STYLES (injected dynamically)
    // ============================================================
    (function injectToastStyles() {
        if (document.getElementById('predictor-toast-styles')) return;
        var style = document.createElement('style');
        style.id = 'predictor-toast-styles';
        style.textContent =
            '.predictor-toast {' +
            '  position: fixed;' +
            '  top: 24px;' +
            '  right: 24px;' +
            '  z-index: 9999;' +
            '  display: flex;' +
            '  align-items: center;' +
            '  gap: 14px;' +
            '  padding: 14px 20px;' +
            '  background: #fff;' +
            '  border-radius: 12px;' +
            '  box-shadow: 0 8px 32px rgba(0,0,0,0.12);' +
            '  border-left: 4px solid #FF6B6B;' +
            '  max-width: 420px;' +
            '  animation: toastSlideIn 0.3s ease;' +
            '}' +
            '@keyframes toastSlideIn {' +
            '  from { opacity: 0; transform: translateX(40px); }' +
            '  to { opacity: 1; transform: translateX(0); }' +
            '}' +
            '.predictor-toast--error .toast-icon {' +
            '  width: 36px; height: 36px;' +
            '  border-radius: 50%;' +
            '  background: rgba(255,107,107,0.1);' +
            '  display: flex;' +
            '  align-items: center;' +
            '  justify-content: center;' +
            '  color: #FF6B6B;' +
            '  font-size: 1.1rem;' +
            '  flex-shrink: 0;' +
            '}' +
            '.predictor-toast .toast-content { flex: 1; }' +
            '.predictor-toast .toast-title {' +
            '  font-size: 0.85rem; font-weight: 600; color: #2D3436; margin-bottom: 2px;' +
            '}' +
            '.predictor-toast .toast-message {' +
            '  font-size: 0.8rem; color: #636E72; line-height: 1.4;' +
            '}' +
            '.predictor-toast .toast-close {' +
            '  background: none; border: none; color: #B2BEC3; cursor: pointer;' +
            '  font-size: 1rem; padding: 4px; transition: color 0.2s;' +
            '}' +
            '.predictor-toast .toast-close:hover { color: #2D3436; }';
        document.head.appendChild(style);
    })();

})();