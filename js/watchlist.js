// ============================================
// MoviesAndSeriesHub - Watchlist & History
// ============================================

// ----- Load Watchlist -----
function loadWatchlist() {
    var state = window.AppState;
    try {
        state.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    } catch (e) {
        state.watchlist = [];
    }
}

// ----- Toggle Watchlist -----
function toggleWatchlist(id) {
    var state = window.AppState;
    var index = state.watchlist.indexOf(id);
    if (index === -1) {
        state.watchlist.push(id);
        showToast('Added to watchlist! ❤️', 'success');
    } else {
        state.watchlist.splice(index, 1);
        showToast('Removed from watchlist', 'info');
    }
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
    document.querySelectorAll('.watchlist-btn[data-id="' + id + '"]').forEach(function(btn) {
        var inList = state.watchlist.includes(id);
        btn.innerHTML = inList ? '<i class="fas fa-check"></i> In Watchlist' : '<i class="fas fa-plus"></i> Add to Watchlist';
        btn.style.color = inList ? '#46d369' : '';
    });
}

// ----- Check if in Watchlist -----
function isInWatchlist(id) {
    var state = window.AppState;
    return state.watchlist.includes(id);
}

// ----- Load Watch History -----
function loadWatchHistory() {
    var state = window.AppState;
    try {
        state.watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || {};
        console.log('Loaded watch history:', Object.keys(state.watchHistory).length, 'items');
        // Debug: log first item to see structure
        var keys = Object.keys(state.watchHistory);
        if (keys.length > 0) {
            console.log('First item structure:', state.watchHistory[keys[0]]);
        }
    } catch (e) {
        state.watchHistory = {};
    }
}

// ----- Save Watch History (FIXED) -----
function saveWatchHistory(id, title, progress, type, poster) {
    var state = window.AppState;
    if (progress === undefined) progress = 0;
    if (type === undefined) type = 'movie';
    
    console.log('Saving watch history - poster received:', poster);
    
    // Make sure we store the poster path correctly
    var posterPath = null;
    if (poster) {
        // If it's already a full URL, extract just the path
        if (poster.startsWith('http')) {
            var parts = poster.split('/t/p/');
            if (parts.length > 1) {
                posterPath = '/' + parts[1];
            } else {
                posterPath = poster;
            }
        } else if (!poster.startsWith('/')) {
            posterPath = '/' + poster;
        } else {
            posterPath = poster;
        }
    }
    
    state.watchHistory[id] = {
        id: id,
        title: title,
        name: title,
        progress: progress,
        type: type,
        poster_path: posterPath,
        lastWatched: Date.now(),
        watched: progress >= 95
    };
    localStorage.setItem('watchHistory', JSON.stringify(state.watchHistory));
    console.log('Saved watch history with poster:', posterPath);
    renderContinueWatching();
}

// ----- Get Watch Progress -----
function getWatchProgress(id) {
    var state = window.AppState;
    return state.watchHistory[id] ? state.watchHistory[id].progress : 0;
}
// ============================================
// MoviesAndSeriesHub - Watchlist & History
// ============================================

// ----- Load Watchlist -----
function loadWatchlist() {
    var state = window.AppState;
    try {
        state.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    } catch (e) {
        state.watchlist = [];
    }
}

// ----- Toggle Watchlist -----
function toggleWatchlist(id) {
    var state = window.AppState;
    var index = state.watchlist.indexOf(id);
    if (index === -1) {
        state.watchlist.push(id);
        showToast('Added to watchlist! ❤️', 'success');
    } else {
        state.watchlist.splice(index, 1);
        showToast('Removed from watchlist', 'info');
    }
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
    document.querySelectorAll('.watchlist-btn[data-id="' + id + '"]').forEach(function(btn) {
        var inList = state.watchlist.includes(id);
        btn.innerHTML = inList ? '<i class="fas fa-check"></i> In Watchlist' : '<i class="fas fa-plus"></i> Add to Watchlist';
        btn.style.color = inList ? '#46d369' : '';
    });
}

// ----- Check if in Watchlist -----
function isInWatchlist(id) {
    var state = window.AppState;
    return state.watchlist.includes(id);
}

// ----- Load Watch History -----
function loadWatchHistory() {
    var state = window.AppState;
    try {
        state.watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || {};
        console.log('Loaded watch history:', Object.keys(state.watchHistory).length, 'items');
        
        // Check if items have poster_path, if not log warning
        var keys = Object.keys(state.watchHistory);
        if (keys.length > 0) {
            var firstItem = state.watchHistory[keys[0]];
            console.log('First item structure:', firstItem);
            if (!firstItem.poster_path) {
                console.warn('⚠️ Watch history items are missing poster_path!');
                console.warn('To fix: Watch a new movie to save with poster, or clear localStorage');
            }
        }
    } catch (e) {
        state.watchHistory = {};
    }
}

// ----- Save Watch History (FIXED) -----
function saveWatchHistory(id, title, progress, type, poster) {
    var state = window.AppState;
    if (progress === undefined) progress = 0;
    if (type === undefined) type = 'movie';
    
    console.log('Saving watch history - poster received:', poster);
    console.log('Saving watch history - title:', title);
    
    // Make sure we store the poster path correctly
    var posterPath = null;
    if (poster) {
        // If it's already a full URL, extract just the path
        if (typeof poster === 'string') {
            if (poster.startsWith('http')) {
                var parts = poster.split('/t/p/');
                if (parts.length > 1) {
                    posterPath = '/' + parts[1];
                } else {
                    posterPath = poster;
                }
            } else if (!poster.startsWith('/')) {
                posterPath = '/' + poster;
            } else {
                posterPath = poster;
            }
        }
    }
    
    console.log('Final poster_path to save:', posterPath);
    
    state.watchHistory[id] = {
        id: id,
        title: title,
        name: title,
        progress: progress,
        type: type,
        poster_path: posterPath,
        lastWatched: Date.now(),
        watched: progress >= 95
    };
    localStorage.setItem('watchHistory', JSON.stringify(state.watchHistory));
    console.log('✅ Saved watch history with poster:', posterPath);
    renderContinueWatching();
}

// ----- Get Watch Progress -----
function getWatchProgress(id) {
    var state = window.AppState;
    return state.watchHistory[id] ? state.watchHistory[id].progress : 0;
}

// ----- CLEAR WATCH HISTORY (Use only for testing) -----
function clearWatchHistory() {
    if (confirm('Clear all watch history?')) {
        localStorage.removeItem('watchHistory');
        window.AppState.watchHistory = {};
        renderContinueWatching();
        console.log('✅ Watch history cleared');
        showToast('Watch history cleared', 'info');
    }
}

// Expose clear function for debugging
window.clearWatchHistory = clearWatchHistory;