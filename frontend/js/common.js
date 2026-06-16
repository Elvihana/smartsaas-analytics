/* ============================================================
   COMMON.JS - SmartSaaS Analytics
   Shared Utilities & Functions
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // USER PROFILE MANAGEMENT
    // ============================================================

    /**
     * Load and display user profile in header
     */
    async function loadUserProfile() {
        try {
            const userProfile = await window.api.get('/user/profile');
            updateProfileInHeader(userProfile);
            return userProfile;
        } catch (error) {
            console.warn('[Common] Failed to load user profile:', error.message);
            // Use defaults if API fails
            updateProfileInHeader({
                name: 'User',
                email: 'user@smartsaas.local',
                role: 'Administrator'
            });
            return null;
        }
    }

    /**
     * Update profile display in page header
     */
    function updateProfileInHeader(profile) {
        // Profile name
        const profileNameEl = document.getElementById('profileName');
        if (profileNameEl) {
            profileNameEl.textContent = profile.name || 'User';
        }

        // Profile role
        const profileRoleEl = document.getElementById('profileRole');
        if (profileRoleEl) {
            profileRoleEl.textContent = profile.role || 'Administrator';
        }

        // Profile avatar
        const profileAvatarEl = document.getElementById('profileAvatar');
        if (profileAvatarEl) {
            const name = encodeURIComponent(profile.name || 'User');
            profileAvatarEl.src = `https://ui-avatars.com/api/?name=${name}&background=6C5CE7&color=fff&size=40`;
            profileAvatarEl.alt = profile.name || 'Profile';
        }

        // Notification badges
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            notifBadge.textContent = '0';  // Default to 0 notifications
        }

        const messageBadge = document.getElementById('messageBadge');
        if (messageBadge) {
            messageBadge.textContent = '0';  // Default to 0 messages
        }
    }

    /**
     * Format currency value
     */
    function formatCurrency(value, decimals = 2) {
        return '$' + Number(value).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * Format percentage value
     */
    function formatPercentage(value, decimals = 1) {
        return Number(value).toFixed(decimals) + '%';
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString || '--';
        }
    }

    /**
     * Format date and time
     */
    function formatDateTime(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString || '--';
        }
    }

    /**
     * Get status badge class
     */
    function getStatusBadgeClass(status) {
        const statusMap = {
            'active': 'badge--active',
            'inactive': 'badge--inactive',
            'pending': 'badge--pending',
            'suspended': 'badge--suspended',
            'draft': 'badge--draft',
            'scheduled': 'badge--scheduled',
            'completed': 'badge--completed',
            'paused': 'badge--paused',
            'open': 'badge--open',
            'in_progress': 'badge--inprogress',
            'resolved': 'badge--resolved',
            'closed': 'badge--closed'
        };
        return statusMap[status?.toLowerCase()] || 'badge--default';
    }

    /**
     * Show toast notification
     */
    function showToast(title, message, type = 'info') {
        // Simple toast implementation - can be replaced with a proper toast library
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 20px;
            background: #2D3436;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        toast.innerHTML = `<strong>${title}</strong><br><span style="color: #B2BEC3;">${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Add CSS for animations
     */
    function addAnimationStyles() {
        if (!document.getElementById('common-animations')) {
            const style = document.createElement('style');
            style.id = 'common-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============================================================
    // EXPOSE TO GLOBAL SCOPE
    // ============================================================
    window.SmartSaaS = {
        user: {
            loadProfile: loadUserProfile,
            updateProfile: updateProfileInHeader
        },
        format: {
            currency: formatCurrency,
            percentage: formatPercentage,
            date: formatDate,
            dateTime: formatDateTime,
            statusBadge: getStatusBadgeClass
        },
        ui: {
            showToast: showToast
        }
    };

    // Load animations on page load
    document.addEventListener('DOMContentLoaded', addAnimationStyles);
    addAnimationStyles();

    // Load user profile when script loads
    loadUserProfile();
})();
