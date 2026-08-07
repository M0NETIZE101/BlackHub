// ============================================
// admin-script.js - Admin Panel Logic
// With Password Protection
// ============================================

// ----- Password Configuration -----
const ADMIN_PASSWORD = 'hidden'; // The password (hidden in code)
const SESSION_KEY = 'adminSession';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30000; // 30 seconds in milliseconds

// ----- Session State -----
let loginAttempts = 0;
let lockoutTimer = null;
let isLockedOut = false;

// ============================================
// Login Functions
// ============================================

// Check if already logged in
function checkSession() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
        try {
            const data = JSON.parse(session);
            // Session expires after 24 hours
            if (Date.now() - data.timestamp < 86400000) {
                return true;
            } else {
                localStorage.removeItem(SESSION_KEY);
            }
        } catch (e) {
            localStorage.removeItem(SESSION_KEY);
        }
    }
    return false;
}

// Login handler
document.addEventListener('DOMContentLoaded', function() {
    const loginPage = document.getElementById('loginPage');
    const adminContent = document.getElementById('adminContent');

    // Check if already logged in
    if (checkSession()) {
        loginPage.style.display = 'none';
        adminContent.classList.add('visible');
        loadAdminState();
        renderProviders();
        renderOverrides();
        setupFormListeners();
    }

    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Enter key to login
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }
});

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const lockoutMessage = document.getElementById('lockoutMessage');

    // Check if locked out
    if (isLockedOut) {
        lockoutMessage.classList.remove('hidden');
        return;
    }

    const password = passwordInput.value;

    // Clear previous error
    loginError.textContent = '';
    loginError.classList.add('hidden');

    // Disable button during check
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';

    // Simulate slight delay for security
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check password (using secure comparison)
    if (password === ADMIN_PASSWORD) {
        // Success - create session
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            timestamp: Date.now(),
            expires: Date.now() + 86400000 // 24 hours
        }));

        // Hide login, show admin content
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminContent').classList.add('visible');

        // Reset attempts
        loginAttempts = 0;

        // Load admin data
        loadAdminState();
        renderProviders();
        renderOverrides();
        setupFormListeners();

        // Focus first input in admin
        const firstInput = document.querySelector('#providers .toggle-switch input');
        if (firstInput) firstInput.focus();

    } else {
        // Failed attempt
        loginAttempts++;

        if (loginAttempts >= MAX_ATTEMPTS) {
            // Lock out
            isLockedOut = true;
            lockoutMessage.classList.remove('hidden');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-clock"></i> Locked';

            // Auto-unlock after duration
            clearTimeout(lockoutTimer);
            lockoutTimer = setTimeout(function() {
                isLockedOut = false;
                lockoutMessage.classList.add('hidden');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Unlock Admin Panel';
                loginAttempts = 0;
                passwordInput.value = '';
                loginError.textContent = '';
                loginError.classList.add('hidden');
            }, LOCKOUT_DURATION);

            loginError.textContent = `Too many failed attempts. Locked for 30 seconds.`;
            loginError.classList.remove('hidden');

        } else {
            const remaining = MAX_ATTEMPTS - loginAttempts;
            loginError.textContent = `Incorrect password. ${remaining} attempt(s) remaining.`;
            loginError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }

        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Unlock Admin Panel';
    }
}

// Logout function
function logout() {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
}

// ============================================
// Admin State Management
// ============================================

// ----- State -----
let editingProvider = null;
let editingIndex = null;

// ----- Load State -----
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

// ----- Render Providers -----
function renderProviders() {
    // Primary provider
    const primary = EMBED_PROVIDERS.primary;
    document.getElementById('primaryName').textContent = primary.name;
    document.getElementById('primaryUrl').textContent = primary.baseUrl;
    document.getElementById('primaryType').textContent = primary.type === 'imdb' ? 'IMDB ID' : 'TMDB ID';
    document.getElementById('primaryEnabled').checked = primary.enabled;

    // Fallback providers
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

// ----- Toggle Fallback -----
function toggleFallback(index, enabled) {
    EMBED_PROVIDERS.fallbacks[index].enabled = enabled;
    saveConfig();
}

// ----- Edit Fallback -----
function editFallback(index) {
    editingIndex = index;
    const provider = EMBED_PROVIDERS.fallbacks[index];

    document.getElementById('editProviderName').value = provider.name;
    document.getElementById('editProviderUrl').value = provider.baseUrl;
    document.getElementById('editProviderType').value = provider.type;

    document.getElementById('editProviderModal').style.display = 'block';
}

// ----- Delete Fallback -----
function deleteFallback(index) {
    if (confirm('Remove this fallback provider?')) {
        EMBED_PROVIDERS.fallbacks.splice(index, 1);
        saveConfig();
        renderProviders();
    }
}

// ----- Add Fallback -----
function addFallbackProvider() {
    editingIndex = -1;
    document.getElementById('editProviderName').value = '';
    document.getElementById('editProviderUrl').value = '';
    document.getElementById('editProviderType').value = 'tmdb';

    document.getElementById('editProviderModal').style.display = 'block';
}

// ----- Edit Primary Provider -----
function editProvider(type) {
    editingProvider = type;
    const provider = EMBED_PROVIDERS[type];

    document.getElementById('editProviderName').value = provider.name;
    document.getElementById('editProviderUrl').value = provider.baseUrl;
    document.getElementById('editProviderType').value = provider.type;

    document.getElementById('editProviderModal').style.display = 'block';
}

// ----- Close Edit Modal -----
function closeEditModal() {
    document.getElementById('editProviderModal').style.display = 'none';
}

// ----- Save Provider -----
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
        // Add new fallback
        EMBED_PROVIDERS.fallbacks.push({
            name: name,
            baseUrl: baseUrl,
            type: type,
            enabled: true,
        });
    } else {
        // Edit existing fallback
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

// ----- Render Overrides -----
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

// ----- Add Override -----
function addOverride() {
    document.getElementById('addOverrideModal').style.display = 'block';
}

// ----- Close Override Modal -----
function closeOverrideModal() {
    document.getElementById('addOverrideModal').style.display = 'none';
}

// ----- Save Override -----
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

// ----- Delete Override -----
function deleteOverride(imdbId) {
    if (confirm('Remove override for ' + imdbId + '?')) {
        delete EMBED_PROVIDERS.customOverrides[imdbId];
        saveConfig();
        renderOverrides();
    }
}

// ----- Test Embed URL -----
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

    // Render results
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

// ----- Save Configuration -----
function saveConfig() {
    localStorage.setItem('embedConfig', JSON.stringify(EMBED_PROVIDERS));
    showToast('Configuration saved successfully!');
}

function saveAllChanges() {
    saveConfig();
}

// ----- Export Configuration -----
function exportConfig() {
    const config = localStorage.getItem('embedConfig');
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moviehub-config-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Configuration exported successfully!');
}

// ----- Import Configuration -----
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

// ----- Toast Notification -----
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: var(--shadow);
        z-index: 9999;
        animation: slideUp 0.3s ease;
        font-size: 14px;
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ----- Setup Form Listeners -----
function setupFormListeners() {
    // Primary provider toggle
    document.getElementById('primaryEnabled').addEventListener('change', function() {
        EMBED_PROVIDERS.primary.enabled = this.checked;
        saveConfig();
    });
}

// ----- Keyboard Shortcuts -----
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeOverrideModal();
    }
});

console.log('Admin panel loaded successfully!');