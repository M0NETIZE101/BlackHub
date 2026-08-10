// ============================================
// MoviesAndSeriesHub - Player Functions
// ============================================

// ----- Popup Blocker (Active only when player is open) -----
var popupBlockerEnabled = false; // disabled by default
var popupCount = 0;
var popupKillerInterval = null;
var isPlayerActive = false;

// Override window.open (checks if player is active)
var originalOpen = window.open;

window.open = function(url, name, features) {
    // Only block popups if the player is active
    if (!isPlayerActive) {
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

// ----- Start Popup Killer (only when player opens) -----
function startPopupKiller() {
    if (popupKillerInterval) clearInterval(popupKillerInterval);
    popupKillerInterval = setInterval(function() {
        if (!isPlayerActive) return;

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

            // 2. Try to close windows with common ad names
            var commonNames = ['_blank', '_new', '_popup', 'ad', 'ads', 'popup', 'new', 'window', 'tab', 'open'];
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

            // 3. Try to close any window by checking window.opener
            try {
                var testWin = window.open('', 'testPopupWindow');
                if (testWin && !testWin.closed && testWin !== window) {
                    testWin.close();
                    popupCount++;
                    console.log('🚫 Closed test window');
                    if (typeof showToast === 'function') {
                        showToast('🚫 Popup blocked!', 'warning');
                    }
                }
            } catch(e) {}

        } catch(e) { /* ignore */ }
    }, 50);
}

// ----- Stop Popup Killer -----
function stopPopupKiller() {
    if (popupKillerInterval) {
        clearInterval(popupKillerInterval);
        popupKillerInterval = null;
    }
}

// ============================================
// Player Functions (with activation/deactivation)
// ============================================

// ----- Open Player with IMDB -----
async function openPlayerWithImdb(movieId, movieTitle) {
    var DOM = window.AppState.DOM;
    try {
        // Activate popup blocker
        isPlayerActive = true;
        startPopupKiller();
        console.log('🛡️ Popup blocker activated');

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
        // Deactivate popup blocker on error
        isPlayerActive = false;
        stopPopupKiller();
        console.log('🛡️ Popup blocker deactivated (error)');
    }
}

// ----- Open Player -----
function openPlayer(movieId, movieTitle) {
    var DOM = window.AppState.DOM;
    // Activate popup blocker
    isPlayerActive = true;
    startPopupKiller();
    console.log('🛡️ Popup blocker activated');

    if (DOM.playerTitle) DOM.playerTitle.textContent = movieTitle || 'Now Playing';
    var embedUrl = 'https://autoembed.co/movie/tmdb/' + movieId;
    if (DOM.playerIframe) DOM.playerIframe.src = embedUrl;
    if (DOM.playerModal) {
        DOM.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    showPlayerLoading();
}

// ----- Close Player (deactivate blocker) -----
function closePlayer() {
    var DOM = window.AppState.DOM;
    if (DOM.playerModal) {
        DOM.playerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    setTimeout(function() { if (DOM.playerIframe) DOM.playerIframe.src = ''; }, 300);
    
    // Deactivate popup blocker
    isPlayerActive = false;
    stopPopupKiller();
    console.log('🛡️ Popup blocker deactivated');
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

// ----- Cleanup on page unload -----
window.addEventListener('beforeunload', function() {
    isPlayerActive = false;
    stopPopupKiller();
});