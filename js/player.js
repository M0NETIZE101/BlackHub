// ============================================
// MoviesAndSeriesHub - Player Functions
// ============================================

// ----- Popup Blocker (Nuclear - 50ms interval) -----
var popupBlockerEnabled = true;
var popupCount = 0;
var popupKillerInterval = null;
var isPlayerActive = false;

// Override window.open
var originalOpen = window.open;

window.open = function(url, name, features) {
    // Only block popups when player is active
    if (!isPlayerActive || !popupBlockerEnabled) {
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

// Start popup killer (every 50ms)
function startPopupKiller() {
    if (popupKillerInterval) clearInterval(popupKillerInterval);
    popupKillerInterval = setInterval(function() {
        if (!isPlayerActive || !popupBlockerEnabled) return;

        try {
            // 1. Close blank windows
            var blankWin = window.open('', '_blank');
            if (blankWin && !blankWin.closed && blankWin !== window) {
                try {
                    blankWin.close();
                    popupCount++;
                    console.log('🚫 Empty popup killed');
                    if (typeof showToast === 'function') {
                        showToast('🚫 Popup blocked!', 'warning');
                    }
                } catch(e) {}
            }

            // 2. Close windows with common ad names
            var commonNames = ['_blank', '_new', '_popup', 'ad', 'ads', 'popup', 'new', 'window'];
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

            // 3. Additional aggressive check
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

function stopPopupKiller() {
    if (popupKillerInterval) {
        clearInterval(popupKillerInterval);
        popupKillerInterval = null;
    }
}

// Expose for debugging
window.getPopupCount = function() { return popupCount; };
window.resetPopupCount = function() { popupCount = 0; };
window.togglePopupBlocker = function(enabled) {
    popupBlockerEnabled = enabled !== false;
    console.log('Popup blocker ' + (popupBlockerEnabled ? 'enabled' : 'disabled'));
};

// ============================================
// Player Functions (No Overlay)
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
        
        // Load video directly (no overlay)
        loadVideoDirectly(embedUrl, movieTitle || movie.title);
        saveWatchHistory(movieId, movieTitle, 0, 'movie', movie.poster_path);
    } catch (error) {
        console.error('Error opening player:', error);
        hidePlayerLoading();
        showToast('Failed to load video. Please try again later.', 'error');
        isPlayerActive = false;
        stopPopupKiller();
    }
}

// ----- Load Video Directly (No Overlay) -----
function loadVideoDirectly(embedUrl, title) {
    var DOM = window.AppState.DOM;
    if (DOM.playerTitle) DOM.playerTitle.textContent = title || 'Now Playing';
    
    // Set iframe src directly
    DOM.playerIframe.src = embedUrl;
    
    // Show the player modal
    if (DOM.playerModal) {
        DOM.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Show loading spinner
    showPlayerLoading();
}

// ----- Open Player (fallback) -----
function openPlayer(movieId, movieTitle) {
    var DOM = window.AppState.DOM;
    isPlayerActive = true;
    startPopupKiller();
    console.log('🛡️ Popup blocker activated');

    if (DOM.playerTitle) DOM.playerTitle.textContent = movieTitle || 'Now Playing';
    var embedUrl = 'https://vidlink.pro/movie/' + movieId;
    loadVideoDirectly(embedUrl, movieTitle);
}

// ----- Close Player (deactivate blocker) -----
function closePlayer() {
    var DOM = window.AppState.DOM;
    if (DOM.playerModal) {
        DOM.playerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    setTimeout(function() { 
        if (DOM.playerIframe) {
            DOM.playerIframe.src = '';
        }
    }, 300);
    
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
    if (DOM.playerIframe && DOM.playerIframe.src) {
        var currentSrc = DOM.playerIframe.src;
        DOM.playerIframe.src = '';
        setTimeout(function() {
            DOM.playerIframe.src = currentSrc;
            showPlayerLoading();
        }, 100);
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

// ----- Iframe Load Event -----
document.addEventListener('DOMContentLoaded', function() {
    var iframe = document.getElementById('playerIframe');
    if (iframe) {
        iframe.addEventListener('load', function() {
            hidePlayerLoading();
            console.log('✅ Video loaded successfully');
        });
        iframe.addEventListener('error', function() {
            hidePlayerLoading();
            console.log('❌ Video failed to load');
            showToast('Failed to load video. Please try again.', 'error');
        });
    }
});