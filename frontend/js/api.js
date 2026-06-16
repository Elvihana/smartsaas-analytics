/* ============================================================
   API.JS - SmartSaaS Analytics
   Centralized API Configuration & Helper Functions
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // API BASE URL - Auto-detect environment
    // ============================================================
    // In production (Vercel), use environment variable
    // In development, use localhost
    const API_BASE = (function () {
        // Check if running on Vercel / production
        if (window.__ENV && window.__ENV.API_URL) {
            return window.__ENV.API_URL;
        }
        // Check hostname for production patterns
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // Production: Frontend on Vercel, Backend on Render
            return 'https://smartsaas-analytics.onrender.com/api';
        }
        // Development
        return 'http://localhost:8000/api';
    })();

    // ============================================================
    // EXPOSE TO GLOBAL SCOPE
    // ============================================================
    window.API_BASE = API_BASE;

    /**
     * Generic API fetch helper
     * @param {string} endpoint - API endpoint (e.g., '/dashboard')
     * @param {Object} options - fetch options (method, body, params, etc.)
     * @returns {Promise<any>}
     */
    window.apiFetch = async function (endpoint, options = {}) {
        const { params, method = 'GET', body, headers = {} } = options;

        // Build URL with query params
        const url = new URL(`${API_BASE}${endpoint}`);
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    url.searchParams.set(key, params[key]);
                }
            });
        }

        // Build fetch config
        const config = {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        // Execute fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        config.signal = controller.signal;

        try {
            const response = await fetch(url.toString(), config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection.');
            }
            throw error;
        }
    };

    /**
     * Convenience methods
     */
    window.api = {
        get: (endpoint, params) => window.apiFetch(endpoint, { method: 'GET', params }),
        post: (endpoint, body) => window.apiFetch(endpoint, { method: 'POST', body }),
        patch: (endpoint, body) => window.apiFetch(endpoint, { method: 'PATCH', body }),
        delete: (endpoint) => window.apiFetch(endpoint, { method: 'DELETE' }),
    };

    console.log(`[API] Configured base URL: ${API_BASE}`);
})();