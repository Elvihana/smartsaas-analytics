/* ============================================================
   SETTINGS.JS - SmartSaaS Analytics
   User Settings Management
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

    // Settings Menu
    const settingsMenuItems = $$('.settings-menu-item');
    const settingsPanels = $$('.settings-panel');

    // Account Settings
    const fullNameEl = $('#fullName');
    const emailAddressEl = $('#emailAddress');
    const timeZoneEl = $('#timeZone');
    const languageEl = $('#language');
    const saveAccountBtn = $('#saveAccountBtn');

    // Organization Settings
    const orgNameEl = $('#orgName');
    const orgIndustryEl = $('#orgIndustry');
    const companySizeEl = $('#companySize');
    const websiteEl = $('#website');
    const saveOrgBtn = $('#saveOrgBtn');

    // Notification Preferences
    const emailNotifEl = $('#emailNotifications');
    const dashboardNotifEl = $('#dashboardNotifications');
    const weeklyReportsEl = $('#weeklyReports');
    const alertNotifEl = $('#alertNotifications');
    const saveNotifBtn = $('#saveNotifBtn');

    // Security
    const twoFactorAuthEl = $('#twoFactorAuth');
    const currentPasswordEl = $('#currentPassword');
    const newPasswordEl = $('#newPassword');
    const confirmPasswordEl = $('#confirmPassword');
    const changePasswordBtn = $('#changePasswordBtn');

    // API Keys
    const apiKeysListEl = $('#apiKeysList');
    const generateApiKeyBtn = $('#generateApiKeyBtn');

    // ============================================================
    // LOCAL STORAGE MANAGEMENT
    // ============================================================
    function loadSettings() {
        const saved = localStorage.getItem('smartsaas_settings');
        return saved ? JSON.parse(saved) : {};
    }

    function saveSettings(settings) {
        localStorage.setItem('smartsaas_settings', JSON.stringify(settings));
    }

    function loadProfile() {
        const saved = localStorage.getItem('smartsaas_profile');
        return saved ? JSON.parse(saved) : {};
    }

    function saveProfile(profile) {
        localStorage.setItem('smartsaas_profile', JSON.stringify(profile));
    }

    // ============================================================
    // LOAD USER DATA
    // ============================================================
    function loadUserData() {
        const settings = loadSettings();
        const profile = loadProfile();

        // Account settings
        if (fullNameEl) fullNameEl.value = profile.fullName || 'User';
        if (emailAddressEl) emailAddressEl.value = profile.email || 'user@example.com';
        if (timeZoneEl) timeZoneEl.value = settings.timeZone || 'UTC';
        if (languageEl) languageEl.value = settings.language || 'en';

        // Organization settings
        if (orgNameEl) orgNameEl.value = settings.orgName || '';
        if (orgIndustryEl) orgIndustryEl.value = settings.orgIndustry || '';
        if (companySizeEl) companySizeEl.value = settings.companySize || '';
        if (websiteEl) websiteEl.value = settings.website || '';

        // Notification preferences
        if (emailNotifEl) emailNotifEl.checked = settings.emailNotif !== false;
        if (dashboardNotifEl) dashboardNotifEl.checked = settings.dashboardNotif !== false;
        if (weeklyReportsEl) weeklyReportsEl.checked = settings.weeklyReports !== false;
        if (alertNotifEl) alertNotifEl.checked = settings.alertNotif !== false;

        // Security
        if (twoFactorAuthEl) twoFactorAuthEl.checked = settings.twoFactorAuth || false;
    }

    // ============================================================
    // MENU SWITCHING
    // ============================================================
    function switchSection(sectionId) {
        // Hide all panels
        settingsPanels.forEach(panel => {
            panel.classList.remove('active');
        });

        // Deactivate all menu items
        settingsMenuItems.forEach(item => {
            item.classList.remove('active');
        });

        // Show selected panel
        const selectedPanel = $(`#${sectionId}`);
        if (selectedPanel) {
            selectedPanel.classList.add('active');
        }

        // Activate selected menu item
        const selectedItem = $(`[data-section="${sectionId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    // ============================================================
    // SAVE HANDLERS
    // ============================================================
    function handleSaveAccount() {
        const settings = loadSettings();
        
        settings.timeZone = timeZoneEl?.value || 'UTC';
        settings.language = languageEl?.value || 'en';

        saveSettings(settings);
        showSuccessMessage('Account settings saved successfully!');
    }

    function handleSaveOrganization() {
        const settings = loadSettings();
        
        settings.orgName = orgNameEl?.value || '';
        settings.orgIndustry = orgIndustryEl?.value || '';
        settings.companySize = companySizeEl?.value || '';
        settings.website = websiteEl?.value || '';

        saveSettings(settings);
        showSuccessMessage('Organization settings saved successfully!');
    }

    function handleSaveNotifications() {
        const settings = loadSettings();
        
        settings.emailNotif = emailNotifEl?.checked || false;
        settings.dashboardNotif = dashboardNotifEl?.checked || false;
        settings.weeklyReports = weeklyReportsEl?.checked || false;
        settings.alertNotif = alertNotifEl?.checked || false;

        saveSettings(settings);
        showSuccessMessage('Notification preferences saved!');
    }

    function handleChangePassword() {
        const current = currentPasswordEl?.value;
        const newPass = newPasswordEl?.value;
        const confirm = confirmPasswordEl?.value;

        if (!current || !newPass || !confirm) {
            showErrorMessage('Please fill in all password fields');
            return;
        }

        if (newPass !== confirm) {
            showErrorMessage('New passwords do not match');
            return;
        }

        if (newPass.length < 8) {
            showErrorMessage('Password must be at least 8 characters');
            return;
        }

        // In real app, send to API
        showSuccessMessage('Password changed successfully!');
        currentPasswordEl.value = '';
        newPasswordEl.value = '';
        confirmPasswordEl.value = '';
    }

    function handleGenerateApiKey() {
        // Generate mock API key
        const apiKey = 'sk_' + Math.random().toString(36).substr(2, 32);
        
        if (apiKeysListEl) {
            const keyDiv = document.createElement('div');
            keyDiv.style.cssText = 'padding: 12px; background: #F5F6FA; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;';
            keyDiv.innerHTML = `
                <div style="flex: 1;">
                    <p style="margin: 0; font-weight: 600; font-size: 12px; color: #636E72;">API Key</p>
                    <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 12px; color: #2D3436;">${apiKey}</p>
                </div>
                <button class="btn btn-sm btn-outline" onclick="navigator.clipboard.writeText('${apiKey}'); alert('Copied!');">
                    <i class="fas fa-copy"></i> Copy
                </button>
            `;
            apiKeysListEl.appendChild(keyDiv);
            showSuccessMessage('API key generated and added!');
        }
    }

    // ============================================================
    // MESSAGE HANDLERS
    // ============================================================
    function showSuccessMessage(message) {
        alert('✓ ' + message);
    }

    function showErrorMessage(message) {
        alert('✗ ' + message);
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

    // Settings menu
    settingsMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Save buttons
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener('click', handleSaveAccount);
    }

    if (saveOrgBtn) {
        saveOrgBtn.addEventListener('click', handleSaveOrganization);
    }

    if (saveNotifBtn) {
        saveNotifBtn.addEventListener('click', handleSaveNotifications);
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', handleChangePassword);
    }

    if (generateApiKeyBtn) {
        generateApiKeyBtn.addEventListener('click', handleGenerateApiKey);
    }

    // ============================================================
    // INITIAL LOAD
    // ============================================================
    document.addEventListener('DOMContentLoaded', loadUserData);
    loadUserData();
})();
