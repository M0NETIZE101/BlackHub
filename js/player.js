// ============================================
// MoviesAndSeriesHub - Player Functions
// ============================================

// ----- Popup Blocker (Ultra-Aggressive) -----
var popupBlockerEnabled = true;
var popupCount = 0;
var popupKillerInterval = null;

// Override window.open
var originalOpen = window.open;

window.open = function(url, name, features) {
    if (!popupBlockerEnabled) {
        return originalOpen.call(window, url, name, features);
    }

    // Block any popup that is not a user-initiated about:blank
    if (url && !url.startsWith('about:') && !url.startsWith('data:')) {
        popupCount++;
        console.log('🚫 Popup blocked (window.open):', url);
        if (typeof showToast === 'function') {
            showToast('🚫 Popup blocked!', 'warning');
        }
        return null;
    }
    return originalOpen.call(window, url, name, features);
};

// ----- Ultra-Aggressive Popup Killer (every 100ms) -----
function startPopupKiller() {
    if (popupKillerInterval) clearInterval(popupKillerInterval);
    popupKillerInterval = setInterval(function() {
        if (!popupBlockerEnabled) return;

        // Try to close any window that is not the main window
        try {
            // 1. Try to close the generic blank window
            var blankWin = window.open('', '_blank');
            if (blankWin && !blankWin.closed && blankWin !== window) {
                try {
                    blankWin.close();
                    popupCount++;
                    console.log('🚫 Closed blank window');
                    if (typeof showToast === 'function') {
                        showToast('🚫 Popup blocked!', 'warning');
                    }
                } catch(e) {}
            }

            // 2. Try to close windows with common names
            var commonNames = ['_blank', '_new', '_popup', 'ad', 'ads', 'popup', 'new'];
            commonNames.forEach(function(name) {
                try {
                    var win = window.open('', name);
                    if (win && !win.closed && win !== window) {
                        win.close();
                        popupCount++;
                        console.log('🚫 Closed window with name:', name);
                        if (typeof showToast === 'function') {
                            showToast('🚫 Popup blocked!', 'warning');
                        }
                    }
                } catch(e) {}
            });

            // 3. Try to close any window that has an opener
            // (can't enumerate directly, but we can try to close windows that we can reference)
            // We'll try to close windows by using window.open with a unique name and see if it's already open.
            // This is a hack: we try to open a window with a random name; if it returns a window that is not the main one, we close it.
            // But that might not work because if the window doesn't exist, it will create one.
            // Instead, we just rely on the above.
        } catch(e) { /* ignore */ }
    }, 100); // Run every 100ms
}

// Initialize popup killer
startPopupKiller();

// Expose for debugging
window.getPopupCount = function() { return popupCount; };
window.resetPopupCount = function() { popupCount = 0; };
window.togglePopupBlocker = function(enabled) {
    popupBlockerEnabled = enabled !== false;
    console.log('Popup blocker ' + (popupBlockerEnabled ? 'enabled' : 'disabled'));
};

// ----- Also try to intercept clicks on the iframe to prevent popups -----
// We can add a click listener on the iframe to prevent default actions?
// Not directly, but we can try to add a blur event to close any popup.
// We'll also add a mutation observer to detect new windows? Not possible.

// ============================================
// Player Functions
// ============================================

// ----- Open Player with IMDB -----
async function openPlayerWithImdb(movieId, movieTitle) {
    var DOM = window.AppState.DOM;
    try {
        showPlayerLoading();
        var url = API_BASE + '/movie/' + movieId + '?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch movie details');
        var movie = await response.json();
        
        console.log('Movie poster_path from API:', movie.poster_path);
        
        var imdbId = movie.imdb_id;
        if (!imdbId) { 
            openPlayer(movieId, movieTitle); 
            return; 
        }
        var embedUrl = getEmbedUrl(imdbId, movieId, 'movie');
        if (!embedUrl) throw new Error('No embed providers available');
        if (DOM.playerTitle) DOM.playerTitle.textContent = movieTitle || movie.title;
        if (DOM.playerIframe) DOM.playerIframe.src = embedUrl;
        if (DOM.playerModal) {
            DOM.playerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        saveWatchHistory(movieId, movieTitle, 0, 'movie', movie.poster_path);
    } catch (error) {
        console.error('Error opening player:', error);
        hidePlayerLoading();
        showToast('Failed to load video. Please try again later.', 'error');
    }
}

// ----- Open Player -----
function openPlayer(movieId, movieTitle) {
    var DOM = window.AppState.DOM;
    if (DOM.playerTitle) DOM.playerTitle.textContent = movieTitle || 'Now Playing';
    var embedUrl = 'https://autoembed.co/movie/tmdb/' + movieId;
    if (DOM.playerIframe) DOM.playerIframe.src = embedUrl;
    if (DOM.playerModal) {
        DOM.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    showPlayerLoading();
}

// ----- Close Player -----
function closePlayer() {
    var DOM = window.AppState.DOM;
    if (DOM.playerModal) {
        DOM.playerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    setTimeout(function() { if (DOM.playerIframe) DOM.playerIframe.src = ''; }, 300);
}

// ----- Toggle Fullscreen -----
function toggleFullscreen() {
    var container = document.querySelector('.player-container');
    if (!document.fullscreenElement) {
        if (container) container.requestFullscreen().catch(function(err) { console.log('Fullscreen error:', err); });
    } else {
        document.exitFullscreen();
    }
}

// ----- Reload Player -----
function reloadPlayer() {
    var DOM = window.AppState.DOM;
    if (DOM.playerIframe) {
        var currentSrc = DOM.playerIframe.src;
        DOM.playerIframe.src = '';
        setTimeout(function() { DOM.playerIframe.src = currentSrc; }, 100);
    }
}

// ----- Player Loading States -----
function showPlayerLoading() {
    var DOM = window.AppState.DOM;
    if (DOM.playerLoading) DOM.playerLoading.style.display = 'flex';
}

function hidePlayerLoading() {
    var DOM = window.AppState.DOM;
    if (DOM.playerLoading) DOM.playerLoading.style.display = 'none';
}