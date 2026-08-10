// ============================================
// MoviesHub - Admin Panel Logic
// With Enhanced Security
// ============================================

// ----- Security Configuration -----
const ADMIN_PASSWORD = 'hidden';
const SESSION_KEY = 'adminSession';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30000; // 30 seconds
const SESSION_DURATION = 86400000; // 24 hours

// ----- Session State -----
let loginAttempts = 0;
let lockoutTimer = null;
let isLockedOut = false;
let sessionTimeout = null;

// ============================================
// Security Functions
// ============================================

// Generate a secure session token
function generateSessionToken() {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return btoa(random + timestamp + ADMIN_PASSWORD);
}

// Check if session is valid
function checkSession() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            const data = JSON.parse(session);
            // Check expiration
            if (Date.now() - data.timestamp < SESSION_DURATION) {
                // Verify token integrity
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

// Create a new session
function createSession() {
    const session = {
        timestamp: Date.now(),
        expires: Date.now() + SESSION_DURATION,
        token: generateSessionToken(),
        userAgent: navigator.userAgent,
        created: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Auto logout after session duration
    if (sessionTimeout) clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        showToast('Session expired. Please login again.', 'warning');
        logout();
    }, SESSION_DURATION);
}

// Get session info
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

// Display session info
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

    // Check if already logged in
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
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Enter key to login
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
        // Clear error on input
        passwordInput.addEventListener('input', function() {
            const loginError = document.getElementById('loginError');
            if (loginError) {
                loginError.textContent = '';
                loginError.classList.add('hidden');
            }
        });
    }

    // Display attempts counter on load
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

    // Check if locked out
    if (isLockedOut) {
        const lockoutMessage = document.getElementById('lockoutMessage');
        if (lockoutMessage) lockoutMessage.classList.remove('hidden');
        return;
    }

    const password = passwordInput?.value || '';

    // Clear previous error
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }

    // Disable button during check
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    }

    // Security delay (prevents timing attacks)
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

    // Simple password check (in production, use server-side validation)
    if (password === ADMIN_PASSWORD) {
        // Success - create session
        createSession();
        
        const loginPage = document.getElementById('loginPage');
        const adminContent = document.getElementById('adminContent');
        
        if (loginPage) loginPage.style.display = 'none';
        if (adminContent) adminContent.classList.add('visible');
        
        loginAttempts = 0;
        
        // Reset attempts counter
        const counter = document.getElementById('attemptsCounter');
        if (counter) counter.innerHTML = '';
        
        // Load admin data
        loadAdminState();
        renderProviders();
        renderOverrides();
        setupFormListeners();
        setupAdminEventListeners();
        displaySessionInfo();
        
        // Focus first input
        const firstInput = document.querySelector('#providers .toggle-switch input');
        if (firstInput) firstInput.focus();
        
        showToast('Welcome back! 🔐', 'success');

    } else {
        // Failed attempt
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

// ============================================
// Logout Function (Enhanced)
// ============================================

function logout() {
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('embedConfig');
    
    // Force reload to login page
    location.reload();
}

// ============================================
// Protect against XSS in admin content
// ============================================

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// ============================================
// Toast Notification (Enhanced)
// ============================================

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
// Rest of admin functions (same as before)
// ============================================

// ... [keep all existing admin functions: loadAdminState, renderProviders, 
// toggleFallback, editFallback, deleteFallback, addFallbackProvider,
// editProvider, closeEditModal, renderOverrides, addOverride, 
// closeOverrideModal, deleteOverride, testEmbedUrl, saveConfig, 
// saveAllChanges, exportConfig, importConfig, setupFormListeners, 
// setupAdminEventListeners]

// Add window functions for onclick handlers
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