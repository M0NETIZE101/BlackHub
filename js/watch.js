// js/watch.js — Watch page logic
// Requires js/config.js, js/embed-config.js

// ===== URL PARAMS =====
var params = new URLSearchParams(window.location.search);
var mediaId = parseInt(params.get('id'));
var mediaType = params.get('type') || 'movie';
var currentSeason = parseInt(params.get('season')) || 1;
var currentEpisode = parseInt(params.get('episode')) || 1;

if (!mediaId || (mediaType !== 'movie' && mediaType !== 'tv')) {
    window.location.replace('landing.html');
}

// ===== POPUP BLOCKER =====
var popupBlockerEnabled = true;
var isPlayerActive = true;
var popupKillerInterval = null;
var originalOpen = window.open;

window.open = function(url, name, features) {
    if (!isPlayerActive || !popupBlockerEnabled) {
        return originalOpen.call(window, url, name, features);
    }
    if (url && !url.startsWith('about:') && !url.startsWith('data:')) {
        console.log('🚫 Popup blocked:', url);
        return null;
    }
    return originalOpen.call(window, url, name, features);
};

function startPopupKiller() {
    if (popupKillerInterval) clearInterval(popupKillerInterval);
    popupKillerInterval = setInterval(function() {
        if (!isPlayerActive || !popupBlockerEnabled) return;
        try {
            var names = ['_blank', '_new', '_popup', 'ad', 'ads', 'popup', 'new', 'window', 'testPopupWindow'];
            names.forEach(function(name) {
                try {
                    var w = window.open('', name);
                    if (w && !w.closed && w !== window) {
                        w.close();
                        console.log('🚫 Killed popup window:', name);
                    }
                } catch(e) {}
            });
        } catch(e) {}
    }, 50);
}

// ===== TMDB FETCH =====
async function tmdb(path) {
    var res = await fetch(API_BASE + path + '?language=en-US', {
        headers: {
            'Authorization': 'Bearer ' + API_KEY,
            'Accept': 'application/json'
        }
    });
    if (!res.ok) throw new Error('TMDB ' + res.status);
    return res.json();
}

// ===== DOM =====
var watchTitle = document.getElementById('watchTitle');
var watchLoading = document.getElementById('watchLoading');
var watchIframe = document.getElementById('watchIframe');
var watchTvControls = document.getElementById('watchTvControls');
var seasonSelect = document.getElementById('watchSeasonSelect');
var episodeSelect = document.getElementById('watchEpisodeSelect');
var watchPoster = document.getElementById('watchPoster');
var watchInfoTitle = document.getElementById('watchInfoTitle');
var watchMeta = document.getElementById('watchMeta');
var watchOverview = document.getElementById('watchOverview');
var watchUpNext = document.getElementById('watchUpNext');
var watchUpNextGrid = document.getElementById('watchUpNextGrid');

// ===== STATE =====
var currentData = null;
var seasonsCache = {};

// ===== HELPERS =====
function placeholderImg() {
    return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22%3E%3Crect fill=%22%231a1a2e%22 width=%22300%22 height=%22450%22/%3E%3Ctext x=%22150%22 y=%22225%22 fill=%22%23666%22 font-family=%22Arial%22 font-size=%2218%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';
}

function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.style.cssText = 'padding:12px 20px;background:#1a1a2e;color:#fff;border-radius:8px;border-left:4px solid ' +
        (type === 'error' ? '#e50914' : type === 'success' ? '#46d369' : '#0071eb') +
        ';box-shadow:0 8px 32px rgba(0,0,0,0.8);font-size:14px;max-width:340px;';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
}

function saveHistory(id, title, type, poster, progress) {
    var history = {};
    try { history = JSON.parse(localStorage.getItem('watchHistory')) || {}; } catch(e) {}
    var posterPath = poster || null;
    if (posterPath && posterPath.startsWith('http')) {
        var parts = posterPath.split('/t/p/');
        posterPath = parts.length > 1 ? '/' + parts[1] : posterPath;
    }
    history[id] = {
        id: id,
        title: title,
        name: title,
        type: type,
        poster_path: posterPath,
        progress: progress || 0,
        lastWatched: Date.now(),
        watched: false
    };
    localStorage.setItem('watchHistory', JSON.stringify(history));
}

function loadIframe(url) {
    watchIframe.src = url;
    watchIframe.style.display = 'block';
    watchLoading.style.display = 'none';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    startPopupKiller();

    document.getElementById('watchReloadBtn').addEventListener('click', function() {
        if (!watchIframe.src) return;
        var src = watchIframe.src;
        watchIframe.src = '';
        setTimeout(function() { watchIframe.src = src; }, 100);
    });

    document.getElementById('watchFsBtn').addEventListener('click', function() {
        var wrapper = document.getElementById('watchPlayerWrapper');
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(function(e) { console.warn(e); });
        } else {
            document.exitFullscreen();
        }
    });

    window.addEventListener('pagehide', function() {
        if (popupKillerInterval) clearInterval(popupKillerInterval);
    });

    if (mediaType === 'movie') {
        initMovie();
    } else {
        initTvShow();
    }
});

// ===== MOVIE =====
async function initMovie() {
    try {
        var movie = await tmdb('/movie/' + mediaId);
        currentData = movie;
        document.title = movie.title + ' - MoviesAndSeriesHub';
        watchTitle.textContent = movie.title;
        watchInfoTitle.textContent = movie.title;

        watchPoster.src = movie.poster_path ? IMAGE_BASE + '/w300' + movie.poster_path : placeholderImg();
        watchPoster.onerror = function() { this.src = placeholderImg(); };

        watchMeta.innerHTML =
            '<span>⭐ ' + (movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A') + '</span>' +
            '<span>' + (movie.release_date ? movie.release_date.substring(0, 4) : 'N/A') + '</span>' +
            '<span>' + (movie.runtime ? movie.runtime + ' min' : 'N/A') + '</span>' +
            (movie.genres ? '<span>' + movie.genres.map(function(g) { return g.name; }).slice(0, 3).join(', ') + '</span>' : '');

        watchOverview.textContent = movie.overview || 'No description available.';

        var embedUrl = getEmbedUrl(movie.imdb_id, mediaId, 'movie');
        if (!embedUrl) throw new Error('No embed URL available');
        loadIframe(embedUrl);

        saveHistory(mediaId, movie.title, 'movie', movie.poster_path, 0);

        loadUpNextMovies(mediaId);
    } catch (e) {
        console.error('Movie load error:', e);
        watchTitle.textContent = 'Failed to load';
        watchLoading.innerHTML = '<p style="color:var(--primary);">❌ Could not load video. Try again later.</p>';
    }
}

// ===== TV SHOW =====
async function initTvShow() {
    try {
        var show = await tmdb('/tv/' + mediaId);
        currentData = show;
        document.title = show.name + ' - MoviesAndSeriesHub';
        watchTitle.textContent = show.name;
        watchInfoTitle.textContent = show.name;

        watchPoster.src = show.poster_path ? IMAGE_BASE + '/w300' + show.poster_path : placeholderImg();
        watchPoster.onerror = function() { this.src = placeholderImg(); };

        watchMeta.innerHTML =
            '<span>⭐ ' + (show.vote_average ? show.vote_average.toFixed(1) : 'N/A') + '</span>' +
            '<span>' + (show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A') + '</span>' +
            '<span>' + (show.number_of_seasons || '?') + ' seasons</span>' +
            '<span>' + (show.number_of_episodes || '?') + ' episodes</span>';

        watchOverview.textContent = show.overview || 'No description available.';

        var validSeasons = (show.seasons || []).filter(function(s) { return s.season_number > 0; });
        if (validSeasons.length === 0) throw new Error('No seasons available');

        seasonSelect.innerHTML = validSeasons.map(function(s) {
            return '<option value="' + s.season_number + '">Season ' + s.season_number + '</option>';
        }).join('');
        seasonSelect.value = currentSeason;

        seasonSelect.addEventListener('change', function() {
            currentSeason = parseInt(seasonSelect.value);
            currentEpisode = 1;
            loadEpisodes(currentSeason, true);
        });

        await loadEpisodes(currentSeason, true);
        watchTvControls.style.display = 'flex';
    } catch (e) {
        console.error('TV load error:', e);
        watchTitle.textContent = 'Failed to load';
        watchLoading.innerHTML = '<p style="color:var(--primary);">❌ Could not load show. Try again later.</p>';
    }
}

async function loadEpisodes(seasonNum, autoPlay) {
    episodeSelect.innerHTML = '<option>Loading…</option>';
    try {
        var seasonData = seasonsCache[seasonNum];
        if (!seasonData) {
            seasonData = await tmdb('/tv/' + mediaId + '/season/' + seasonNum);
            seasonsCache[seasonNum] = seasonData;
        }
        var episodes = seasonData.episodes || [];
        if (episodes.length === 0) {
            episodeSelect.innerHTML = '<option>No episodes</option>';
            return;
        }

        episodeSelect.innerHTML = episodes.map(function(ep) {
            var name = (ep.name || '').substring(0, 30);
            return '<option value="' + ep.episode_number + '">E' + ep.episode_number + ' — ' + name + '</option>';
        }).join('');

        var nums = episodes.map(function(e) { return e.episode_number; });
        if (nums.indexOf(currentEpisode) === -1) currentEpisode = nums[0];
        episodeSelect.value = currentEpisode;

        episodeSelect.onchange = function() {
            currentEpisode = parseInt(episodeSelect.value);
            playEpisode(currentSeason, currentEpisode);
        };

        if (autoPlay) {
            await playEpisode(currentSeason, currentEpisode);
        }
    } catch (e) {
        console.error('Episodes load error:', e);
        episodeSelect.innerHTML = '<option>Error loading</option>';
    }
}

async function playEpisode(season, episode) {
    try {
        watchLoading.style.display = 'flex';
        watchIframe.style.display = 'none';

        var seasonData = seasonsCache[season];
        if (!seasonData) {
            seasonData = await tmdb('/tv/' + mediaId + '/season/' + season);
            seasonsCache[season] = seasonData;
        }
        var epData = (seasonData.episodes || []).find(function(e) { return e.episode_number === episode; });
        var epName = epData && epData.name ? ' — ' + epData.name : '';

        watchTitle.textContent = currentData.name + ' — S' + season + 'E' + episode + epName;

        var embedUrl = getTvEmbedUrl(null, mediaId, season, episode);
        if (!embedUrl) throw new Error('No embed URL');
        loadIframe(embedUrl);

        var newUrl = 'watch.html?id=' + mediaId + '&type=tv&season=' + season + '&episode=' + episode;
        history.replaceState(null, '', newUrl);

        saveHistory(mediaId, currentData.name, 'tv', currentData.poster_path, 0);

        loadUpNextTv(season, episode);
    } catch (e) {
        console.error('Play episode error:', e);
        showToast('Failed to load episode.', 'error');
    }
}

// ===== UP NEXT =====
async function loadUpNextMovies(id) {
    try {
        var data = await tmdb('/movie/' + id + '/recommendations');
        var items = (data.results || []).slice(0, 8);
        if (items.length === 0) return;

        watchUpNext.style.display = 'block';
        watchUpNextGrid.innerHTML = items.map(function(m) {
            var img = m.poster_path ? IMAGE_BASE + '/w300' + m.poster_path : placeholderImg();
            var title = (m.title || m.name || '').replace(/"/g, '&quot;');
            return '<div class="up-next-card" onclick="window.location.href=\'watch.html?id=' + m.id + '&type=movie\'">' +
                '<img src="' + img + '" alt="' + title + '" loading="lazy" onerror="this.src=\'' + placeholderImg() + '\'">' +
                '<div class="up-next-title">' + title + '</div>' +
                '</div>';
        }).join('');
    } catch(e) { console.warn('Up next (movies) failed:', e); }
}

async function loadUpNextTv(season, episode) {
    try {
        var seasonData = seasonsCache[season];
        if (!seasonData) {
            seasonData = await tmdb('/tv/' + mediaId + '/season/' + season);
            seasonsCache[season] = seasonData;
        }
        var eps = seasonData.episodes || [];
        var idx = eps.findIndex(function(e) { return e.episode_number === episode; });
        var next = eps[idx + 1];

        if (!next) {
            watchUpNext.style.display = 'none';
            return;
        }

        watchUpNext.style.display = 'block';
        var img = next.still_path ? IMAGE_BASE + '/w300' + next.still_path : placeholderImg();
        var name = (next.name || '').replace(/"/g, '&quot;');
        watchUpNextGrid.innerHTML =
            '<div class="up-next-card" onclick="playEpisode(' + season + ',' + next.episode_number + ')">' +
            '<img src="' + img + '" alt="E' + next.episode_number + '" loading="lazy" onerror="this.src=\'' + placeholderImg() + '\'">' +
            '<div class="up-next-title">E' + next.episode_number + ' — ' + name + '</div>' +
            '</div>';
    } catch(e) { console.warn('Up next (TV) failed:', e); }
}
