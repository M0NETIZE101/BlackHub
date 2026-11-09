// ============================================
// MoviesAndSeriesHub - Utility Functions
// ============================================

// ----- Toast System -----
function showToast(message, type) {
    if (type === undefined) type = 'info';
    var container = document.getElementById('toastContainer') || createToastContainer();
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'info': 'fas fa-info-circle',
        'warning': 'fas fa-exclamation-triangle'
    };
    toast.innerHTML = '<i class="' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
}

function createToastContainer() {
    var container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ----- Scroll Listener -----
function setupScrollListener() {
    var header = document.querySelector('.header');
    var DOM = window.AppState.DOM;
    window.addEventListener('scroll', function() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (header) {
            if (scrollTop > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }
        if (DOM.backToTop) {
            if (scrollTop > 500) {
                DOM.backToTop.classList.add('visible');
                DOM.backToTop.style.display = 'block';
            } else {
                DOM.backToTop.classList.remove('visible');
                DOM.backToTop.style.display = 'none';
            }
        }
    });
}

// ----- Keyboard Shortcuts -----
function setupKeyboardShortcuts() {
    var DOM = window.AppState.DOM;
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closePlayer();
            closeTrailer();
            closeSeasonsModal();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (DOM.searchInput) DOM.searchInput.focus();
        }
        if (e.key === 'f' && DOM.playerModal && DOM.playerModal.classList.contains('active')) {
            e.preventDefault();
            toggleFullscreen();
        }
        if (e.key === 'r' && DOM.playerModal && DOM.playerModal.classList.contains('active')) {
            e.preventDefault();
            reloadPlayer();
        }
    });
}

// ----- Continue Watching ROW -----
// Cards now navigate to watch.html instead of opening modal player.
function renderContinueWatching() {
    var state = window.AppState;
    var container = document.getElementById('continueWatching');
    if (!container) return;

    var history = Object.values(state.watchHistory)
        .filter(function(item) { return !item.watched; })
        .sort(function(a, b) { return b.lastWatched - a.lastWatched; })
        .slice(0, 10);

    if (history.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    var grid = container.querySelector('.continue-grid');
    if (!grid) return;
    grid.innerHTML = '';

    history.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'continue-card';

        var posterUrl = PLACEHOLDER_IMAGE;
        if (item.poster_path) {
            posterUrl = IMAGE_BASE + '/w200' + item.poster_path;
        }

        var progress = Math.round(item.progress || 0);
        var isTv = item.type === 'tv';
        var title = item.title || item.name || 'Unknown';

        card.innerHTML = `
            <div class="continue-poster-wrapper">
                <img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="continue-progress-bar"><div class="continue-progress-fill" style="width: ${progress}%"></div></div>
                <div class="continue-play-overlay"><i class="fas fa-play-circle"></i></div>
                ${isTv ? '<span class="badge badge-tv" style="position:absolute;top:8px;left:8px;z-index:3;"><i class="fas fa-tv"></i> TV</span>' : ''}
            </div>
            <div class="continue-info">
                <div class="continue-title">${title}</div>
                <div class="continue-meta">${progress}% watched</div>
            </div>
        `;

        // Continue Watching → navigate to watch.html
        card.addEventListener('click', function() {
            if (isTv) {
                window.location.href = 'watch.html?id=' + item.id + '&type=tv&season=1&episode=1';
            } else {
                window.location.href = 'watch.html?id=' + item.id + '&type=movie';
            }
        });
        grid.appendChild(card);
    });
}

// ----- Expose functions to global scope -----
window.showToast = showToast;
window.setupScrollListener = setupScrollListener;
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
window.renderContinueWatching = renderContinueWatching;