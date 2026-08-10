// ============================================
// MoviesAndSeriesHub - Theme Functions
// ============================================

// ----- Load Theme -----
function loadTheme() {
    var savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    var DOM = window.AppState.DOM;
    if (DOM.themeToggle) {
        DOM.themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

// ----- Toggle Theme -----
function toggleTheme() {
    var html = document.documentElement;
    var currentTheme = html.getAttribute('data-theme');
    var newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    var DOM = window.AppState.DOM;
    if (DOM.themeToggle) {
        DOM.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
    showToast('Theme switched to ' + newTheme, 'info');
}