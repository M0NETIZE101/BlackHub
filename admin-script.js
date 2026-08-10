// ============================================
// MoviesAndSeriesHub - Admin Panel Logic
// With Enhanced Security
// ============================================

// ----- Security Configuration -----
const ADMIN_PASSWORD = 'hidden';
const SESSION_KEY = 'adminSession';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30000;
const SESSION_DURATION = 86400000;

// ----- Session State -----
let loginAttempts = 0;
let lockoutTimer = null;
let isLockedOut = false;
let sessionTimeout = null;

// ============================================
// Security Functions
// ============================================

function generateSessionToken() {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return btoa(random + timestamp + ADMIN_PASSWORD);
}

function checkSession() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            const data = JSON.parse(session);
            if (Date.now() - data.timestamp < SESSION_DURATION) {
                if (data.token && data.token.length > 10) {
                    return true;
                }
            }
            localStorage.removeItem(SESSION_KEY);
        }
    } catch (e) {
        localStorage.removeItem(SESSION_KEY);
    }
    return false;
}

function createSession() {
    const session = {
        timestamp: Date.now(),
        expires: Date.now() + SESSION_DURATION,
        token: generateSessionToken(),
        userAgent: navigator.userAgent,
        created: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    if (sessionTimeout) clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        showToast('Session expired. Please login again.', 'warning');
        logout();
    }, SESSION_DURATION);
}

function getSessionInfo() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            const data = JSON.parse(session);
            const remaining = Math.max(0, Math.floor((data.timestamp + SESSION_DURATION - Date.now()) / 60000));
            return {
                created: data.created,
                remaining: remaining,
                userAgent: data.userAgent
            };
        }
    } catch (e) {}
    return null;
}

function displaySessionInfo() {
    const info = getSessionInfo();
    const container = document.getElementById('sessionInfo');
    if (container && info) {
        container.innerHTML = `
            <i class="fas fa-clock"></i> Session expires in ${info.remaining} minutes
        `;
    }
}

// ============================================
// Brute Force Protection
// ============================================

function handleFailedAttempt() {
    loginAttempts++;
    const remaining = MAX_ATTEMPTS - loginAttempts;
    const counter = document.getElementById('attemptsCounter');
    if (counter) {
        if (remaining > 0) {
            counter.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: var(--primary);"></i> ${remaining} attempt(s) remaining`;
            counter.style.color = remaining <= 2 ? 'var(--primary)' : 'var(--text-muted)';
        } else {
            counter.innerHTML = '';
        }
    }
    
    if (loginAttempts >= MAX_ATTEMPTS) {
        lockout();
    }
}

function lockout() {
    isLockedOut = true;
    const lockoutMessage = document.getElementById('lockoutMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    if (lockoutMessage) lockoutMessage.classList.remove('hidden');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-clock"></i> Locked';
    }
    
    clearTimeout(lockoutTimer);
    lockoutTimer = setTimeout(() => {
        unlock();
    }, LOCKOUT_DURATION);
}

function unlock() {
    isLockedOut = false;
    const lockoutMessage = document.getElementById('lockoutMessage');
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    
    if (lockoutMessage) lockoutMessage.classList.add('hidden');
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Unlock Admin Panel';
    }
    if (passwordInput) passwordInput.value = '';
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }
    loginAttempts = 0;
    
    const counter = document.getElementById('attemptsCounter');
    if (counter) counter.innerHTML = '';
}

// ============================================
// Login Handler (Enhanced)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const loginPage = document.getElementById('loginPage');
    const adminContent = document.getElementById('adminContent');

    if (checkSession()) {
        if (loginPage) loginPage.style.display = 'none';
        if (adminContent) adminContent.classList.add('visible');
        loadAdminState();
        renderProviders();
        renderOverrides();
        setupFormListeners();
        setupAdminEventListeners();
        displaySessionInfo();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
        passwordInput.addEventListener('input', function() {
            const loginError = document.getElementById('loginError');
            if (loginError) {
                loginError.textContent = '';
                loginError.classList.add('hidden');
            }
        });
    }

    const counter = document.getElementById('attemptsCounter');
    if (counter && !isLockedOut) {
        counter.innerHTML = `<i class="fas fa-shield-alt" style="color: var(--text-muted);"></i> ${MAX_ATTEMPTS} attempts allowed`;
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

    if (isLockedOut) {
        const lockoutMessage = document.getElementById('lockoutMessage');
        if (lockoutMessage) lockoutMessage.classList.remove('hidden');
        return;
    }

    const password = passwordInput?.value || '';

    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    }

    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

    if (password === ADMIN_PASSWORD) {
        createSession();
        
        const loginPage = document.getElementById('loginPage');
        const adminContent = document.getElementById('adminContent');
        
        if (loginPage) loginPage.style.display = 'none';
        if (adminContent) adminContent.classList.add('visible');
        
        loginAttempts = 0;
        
        const counter = document.getElementById('attemptsCounter');
        if (counter) counter.innerHTML = '';
        
        loadAdminState();
        renderProviders();
        renderOverrides();
        setupFormListeners();
        setupAdminEventListeners();
        displaySessionInfo();
        
        const firstInput = document.querySelector('#providers .toggle-switch input');
        if (firstInput) firstInput.focus();
        
        showToast('Welcome back! 🔐', 'success');

    } else {
        handleFailedAttempt();
        
        if (loginError) {
            const remaining = MAX_ATTEMPTS - loginAttempts;
            if (remaining > 0) {
                loginError.textContent = `Incorrect password. ${remaining} attempt(s) remaining.`;
                loginError.classList.remove('hidden');
            } else {
                loginError.textContent = 'Too many failed attempts. Locked for 30 seconds.';
                loginError.classList.remove('hidden');
            }
        }
        
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
            passwordInput.select();
        }
    }

    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Unlock Admin Panel';
    }
}

function logout() {
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('embedConfig');
    location.reload();
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 14px 24px;
        border-radius: 8px;
        border-left: 4px solid ${type === 'success' ? '#46d369' : type === 'error' ? 'var(--primary)' : '#0071eb'};
        box-shadow: var(--shadow);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️',
        'warning': '⚠️'
    };
    
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => { toast.remove(); }, 300);
    }, 4000);
}

// ============================================
// Admin State Management
// ============================================

let editingProvider = null;
let editingIndex = null;

function loadAdminState() {
    const saved = localStorage.getItem('embedConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            Object.assign(EMBED_PROVIDERS, config);
        } catch (e) {
            console.error('Error loading config:', e);
        }
    }
}

function renderProviders() {
    const primary = EMBED_PROVIDERS.primary;
    document.getElementById('primaryName').textContent = primary.name;
    document.getElementById('primaryUrl').textContent = primary.baseUrl;
    document.getElementById('primaryType').textContent = primary.type === 'imdb' ? 'IMDB ID' : 'TMDB ID';
    document.getElementById('primaryEnabled').checked = primary.enabled;

    const container = document.getElementById('fallbackProviders');
    container.innerHTML = '';

    EMBED_PROVIDERS.fallbacks.forEach((provider, index) => {
        const div = document.createElement('div');
        div.className = 'provider-card';
        div.innerHTML = `
            <div class="provider-info">
                <div class="provider-name">${provider.name}</div>
                <div class="provider-url">${provider.baseUrl}</div>
                <div class="provider-type">${provider.type === 'imdb' ? 'IMDB ID' : 'TMDB ID'}</div>
            </div>
            <div class="provider-controls">
                <label class="toggle-switch">
                    <input type="checkbox" ${provider.enabled ? 'checked' : ''} onchange="toggleFallback(${index}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <button onclick="editFallback(${index})" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteFallback(${index})" class="edit-btn" style="color: var(--text-muted);">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleFallback(index, enabled) {
    EMBED_PROVIDERS.fallbacks[index].enabled = enabled;
    saveConfig();
}

function editFallback(index) {
    editingIndex = index;
    const provider = EMBED_PROVIDERS.fallbacks[index];

    document.getElementById('editProviderName').value = provider.name;
    document.getElementById('editProviderUrl').value = provider.baseUrl;
    document.getElementById('editProviderType').value = provider.type;

    document.getElementById('editProviderModal').style.display = 'block';
}

function deleteFallback(index) {
    if (confirm('Remove this fallback provider?')) {
        EMBED_PROVIDERS.fallbacks.splice(index, 1);
        saveConfig();
        renderProviders();
    }
}

function addFallbackProvider() {
    editingIndex = -1;
    document.getElementById('editProviderName').value = '';
    document.getElementById('editProviderUrl').value = '';
    document.getElementById('editProviderType').value = 'tmdb';

    document.getElementById('editProviderModal').style.display = 'block';
}

function editProvider(type) {
    editingProvider = type;
    const provider = EMBED_PROVIDERS[type];

    document.getElementById('editProviderName').value = provider.name;
    document.getElementById('editProviderUrl').value = provider.baseUrl;
    document.getElementById('editProviderType').value = provider.type;

    document.getElementById('editProviderModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editProviderModal').style.display = 'none';
}

document.getElementById('editProviderForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('editProviderName').value.trim();
    const baseUrl = document.getElementById('editProviderUrl').value.trim();
    const type = document.getElementById('editProviderType').value;

    if (!name || !baseUrl) {
        alert('Please fill in all fields');
        return;
    }

    if (editingProvider === 'primary') {
        EMBED_PROVIDERS.primary.name = name;
        EMBED_PROVIDERS.primary.baseUrl = baseUrl;
        EMBED_PROVIDERS.primary.type = type;
    } else if (editingIndex === -1) {
        EMBED_PROVIDERS.fallbacks.push({
            name: name,
            baseUrl: baseUrl,
            type: type,
            enabled: true,
        });
    } else {
        EMBED_PROVIDERS.fallbacks[editingIndex] = {
            ...EMBED_PROVIDERS.fallbacks[editingIndex],
            name: name,
            baseUrl: baseUrl,
            type: type,
        };
    }

    saveConfig();
    renderProviders();
    closeEditModal();
});

function renderOverrides() {
    const container = document.getElementById('overrideList');
    container.innerHTML = '';

    const overrides = EMBED_PROVIDERS.customOverrides || {};
    const keys = Object.keys(overrides);

    if (keys.length === 0) {
        container.innerHTML = `
            <div style="color: var(--text-muted); padding: 20px; text-align: center;">
                No custom overrides configured.
            </div>
        `;
        return;
    }

    keys.forEach(function(imdbId) {
        const div = document.createElement('div');
        div.className = 'override-item';
        div.innerHTML = `
            <div>
                <div class="imdb-id">${imdbId}</div>
                <div class="override-url">${overrides[imdbId]}</div>
            </div>
            <button onclick="deleteOverride('${imdbId}')" class="delete-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function addOverride() {
    document.getElementById('addOverrideModal').style.display = 'block';
}

function closeOverrideModal() {
    document.getElementById('addOverrideModal').style.display = 'none';
}

document.getElementById('addOverrideForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const imdbId = document.getElementById('overrideImdbId').value.trim();
    const url = document.getElementById('overrideUrl').value.trim();

    if (!imdbId || !url) {
        alert('Please fill in all fields');
        return;
    }

    if (!EMBED_PROVIDERS.customOverrides) {
        EMBED_PROVIDERS.customOverrides = {};
    }

    EMBED_PROVIDERS.customOverrides[imdbId] = url;

    saveConfig();
    renderOverrides();
    closeOverrideModal();
});

function deleteOverride(imdbId) {
    if (confirm('Remove override for ' + imdbId + '?')) {
        delete EMBED_PROVIDERS.customOverrides[imdbId];
        saveConfig();
        renderOverrides();
    }
}

async function testEmbedUrl() {
    const imdbId = document.getElementById('testImdbId').value.trim();
    const resultsContainer = document.getElementById('testResults');

    if (!imdbId) {
        resultsContainer.innerHTML = '<div style="color: var(--primary);">Please enter an IMDB ID</div>';
        return;
    }

    resultsContainer.innerHTML = '<div style="color: var(--text-secondary);">Testing...</div>';

    const providers = getEnabledProviders();
    const results = [];

    for (const provider of providers) {
        const id = provider.type === 'imdb' ? imdbId : imdbId.replace('tt', '');
        const url = provider.baseUrl + id;

        try {
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            results.push({
                name: provider.name,
                url: url,
                working: true,
                isPrimary: provider.isPrimary,
            });
        } catch (error) {
            results.push({
                name: provider.name,
                url: url,
                working: false,
                isPrimary: provider.isPrimary,
                error: error.message,
            });
        }
    }

    resultsContainer.innerHTML = results.map(function(result) {
        return `
            <div class="test-result-item">
                <div>
                    <strong>${result.name}</strong>
                    ${result.isPrimary ? '<span style="color: var(--primary); font-size: 11px;"> (Primary)</span>' : ''}
                    <div style="font-size: 12px; color: var(--text-muted);">${result.url}</div>
                </div>
                <div class="${result.working ? 'status-success' : 'status-fail'}">
                    ${result.working ? '✅ Working' : '❌ Failed'}
                    ${result.error ? '<div style="font-size: 11px;">' + result.error + '</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function saveConfig() {
    localStorage.setItem('embedConfig', JSON.stringify(EMBED_PROVIDERS));
    showToast('Configuration saved successfully!');
}

function saveAllChanges() {
    saveConfig();
}

function exportConfig() {
    const config = localStorage.getItem('embedConfig');
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moviesandserieshub-config-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Configuration exported successfully!');
}

function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            localStorage.setItem('embedConfig', JSON.stringify(config));
            loadAdminState();
            renderProviders();
            renderOverrides();
            showToast('Configuration imported successfully!');
        } catch (error) {
            alert('Invalid configuration file');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function setupFormListeners() {
    document.getElementById('primaryEnabled').addEventListener('change', function() {
        EMBED_PROVIDERS.primary.enabled = this.checked;
        saveConfig();
    });
}

function setupAdminEventListeners() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEditModal();
            closeOverrideModal();
        }
    });
}

window.toggleFallback = toggleFallback;
window.editFallback = editFallback;
window.deleteFallback = deleteFallback;
window.addFallbackProvider = addFallbackProvider;
window.editProvider = editProvider;
window.closeEditModal = closeEditModal;
window.addOverride = addOverride;
window.closeOverrideModal = closeOverrideModal;
window.deleteOverride = deleteOverride;
window.testEmbedUrl = testEmbedUrl;
window.exportConfig = exportConfig;
window.importConfig = importConfig;
window.saveAllChanges = saveAllChanges;
window.logout = logout;

console.log('✅ Admin panel loaded with enhanced security!');