// ============================================
// MoviesAndSeriesHub - Modal Functions
// ============================================

// ----- Open Movie Modal -----
async function openMovieModal(movieId) {
    var DOM = window.AppState.DOM;
    try {
        var url = API_BASE + '/movie/' + movieId + '?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
        var movie = await response.json();
        displayMovieModal(movie);
        if (DOM.modal) {
            DOM.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        showToast('Failed to load movie details.', 'error');
    }
}

// ----- Display Movie Modal -----
function displayMovieModal(movie) {
    var DOM = window.AppState.DOM;
    var backdropPath = movie.backdrop_path ? IMAGE_BASE + '/' + BACKDROP_SIZE + movie.backdrop_path : PLACEHOLDER_IMAGE;
    var genres = movie.genres.map(function(g) { return '<span class="genre-tag">' + g.name + '</span>'; }).join(' ');
    var runtime = movie.runtime ? movie.runtime + ' min' : 'N/A';
    var rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    var year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';

    if (!DOM.modalBody) return;
    DOM.modalBody.innerHTML = `
        <img src="${backdropPath}" alt="${movie.title}" class="modal-poster" onerror="this.src='${PLACEHOLDER_IMAGE}'">
        <div style="padding: 0 32px 32px;">
            <h2 class="modal-title">${movie.title}</h2>
            <div class="modal-meta">
                <span><i class="fas fa-star" style="color: #f5c518;"></i> ${rating}</span>
                <span><i class="fas fa-calendar-alt"></i> ${year}</span>
                <span><i class="fas fa-clock"></i> ${runtime}</span>
                <span><i class="fas fa-tag"></i> ${genres}</span>
            </div>
            <p class="modal-overview">${movie.overview || 'No description available.'}</p>
            <div class="modal-details">
                <div class="modal-detail-item"><strong>Status</strong>${movie.status || 'Unknown'}</div>
                <div class="modal-detail-item"><strong>Budget</strong>${movie.budget ? '$' + movie.budget.toLocaleString() : 'N/A'}</div>
                <div class="modal-detail-item"><strong>Revenue</strong>${movie.revenue ? '$' + movie.revenue.toLocaleString() : 'N/A'}</div>
                <div class="modal-detail-item"><strong>Production Companies</strong>${movie.production_companies ? movie.production_companies.map(function(c) { return c.name; }).join(', ') : 'N/A'}</div>
                <div class="modal-detail-item" style="grid-column: 1/-1;"><strong>Tagline</strong>${movie.tagline || 'No tagline'}</div>
                <div class="modal-detail-item" style="grid-column: 1/-1; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button class="watch-btn" id="modalWatchBtn" data-movie-id="${movie.id}" data-movie-title="${movie.title.replace(/'/g, "\\'")}"><i class="fas fa-play"></i> Watch Now</button>
                    <button class="trailer-btn" onclick="openTrailer(${movie.id})"><i class="fab fa-youtube"></i> Watch Trailer</button>
                </div>
            </div>
        </div>
    `;
    var modalWatchBtn = document.getElementById('modalWatchBtn');
    if (modalWatchBtn) {
        modalWatchBtn.addEventListener('click', function() {
            var movieId = parseInt(this.dataset.movieId);
            var movieTitle = this.dataset.movieTitle;
            closeModal();
            openPlayerWithImdb(movieId, movieTitle);
        });
    }
}

// ----- Close Modal -----
function closeModal() {
    var DOM = window.AppState.DOM;
    if (DOM.modal) {
        DOM.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ----- Open Seasons Modal (TV Shows) (FIXED) -----
async function openSeasonsModal(tvId, tvName) {
    var DOM = window.AppState.DOM;
    try {
        var url = API_BASE + '/tv/' + tvId + '?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch TV show details');
        var show = await response.json();
        
        // Store for later use in playEpisode
        window._currentTVShow = show;
        
        DOM.seasonsBody.innerHTML = `
            <div style="padding: 20px 32px 32px;">
                <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                    <img src="${show.poster_path ? IMAGE_BASE + '/w200' + show.poster_path : PLACEHOLDER_IMAGE}" alt="${show.name}" style="width: 120px; border-radius: 8px; object-fit: cover;" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    <div>
                        <h2 style="font-size: 28px; margin-bottom: 8px;">${show.name}</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 8px;">${show.overview || 'No description available.'}</p>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap; color: var(--text-muted); font-size: 14px;">
                            <span>⭐ ${show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}</span>
                            <span>${show.number_of_seasons} Seasons</span>
                            <span>${show.number_of_episodes} Episodes</span>
                            <span>${show.status || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                <h3 style="font-size: 20px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                    <i class="fas fa-list"></i> Seasons
                </h3>
                <div class="seasons-container">
                    ${show.seasons.filter(function(s) { return s.season_number > 0; }).map(function(season) {
                        return `
                            <div class="season-item">
                                <div class="season-header" onclick="toggleSeason(this, ${tvId}, ${season.season_number})">
                                    <div class="season-info">
                                        <span class="season-number">Season ${season.season_number}</span>
                                        <span class="season-name">${season.name}</span>
                                    </div>
                                    <div>
                                        <span class="season-episodes">${season.episode_count} episodes</span>
                                        <span class="season-toggle"><i class="fas fa-chevron-down"></i></span>
                                    </div>
                                </div>
                                <div class="season-episodes-list" id="season-${tvId}-${season.season_number}">
                                    <div style="text-align:center; padding:20px; color: var(--text-muted);">
                                        <i class="fas fa-spinner fa-spin"></i> Loading episodes...
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        DOM.seasonsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading TV show:', error);
        showToast('Failed to load TV show details', 'error');
    }
}

// ----- Toggle Season -----
async function toggleSeason(header, tvId, seasonNumber) {
    var list = document.getElementById('season-' + tvId + '-' + seasonNumber);
    var toggle = header.querySelector('.season-toggle i');
    if (list.classList.contains('open')) {
        list.classList.remove('open');
        toggle.classList.remove('open');
        return;
    }
    list.classList.add('open');
    toggle.classList.add('open');
    if (list.querySelector('.fa-spinner')) {
        try {
            var url = API_BASE + '/tv/' + tvId + '/season/' + seasonNumber + '?language=en-US';
            var response = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to fetch episodes');
            var data = await response.json();
            var episodes = data.episodes || [];
            if (episodes.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:20px; color: var(--text-muted);">No episodes available</div>';
                return;
            }
            list.innerHTML = episodes.map(function(ep) {
                return `
                    <div class="episode-item" onclick="playEpisode(${tvId}, ${seasonNumber}, ${ep.episode_number}, '${ep.name.replace(/'/g, "\\'")}')">
                        <span class="episode-number">E${ep.episode_number}</span>
                        <span class="episode-name">${ep.name}</span>
                        <span class="episode-runtime">${ep.runtime ? ep.runtime + 'm' : ''}</span>
                        <span class="episode-play"><i class="fas fa-play-circle"></i></span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading episodes:', error);
            list.innerHTML = '<div style="text-align:center; padding:20px; color: var(--primary);">Failed to load episodes</div>';
        }
    }
}

// ----- Close Seasons Modal -----
function closeSeasonsModal() {
    var DOM = window.AppState.DOM;
    if (DOM.seasonsModal) {
        DOM.seasonsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ----- Play Episode (FIXED) -----
function playEpisode(tvId, season, episode, episodeName) {
    closeSeasonsModal();
    var title = 'S' + season + 'E' + episode + ' - ' + episodeName;
    var embedUrl = getTvEmbedUrl(null, tvId, season, episode);
    if (!embedUrl) {
        showToast('No video source available for this episode', 'error');
        return;
    }
    var DOM = window.AppState.DOM;
    if (DOM.playerTitle) DOM.playerTitle.textContent = title;
    if (DOM.playerIframe) DOM.playerIframe.src = embedUrl;
    if (DOM.playerModal) {
        DOM.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    showPlayerLoading();
    
    // Save to watch history with TV show info
    var showData = window._currentTVShow || {};
    var showTitle = showData.name || 'TV Show';
    var posterPath = showData.poster_path || null;
    saveWatchHistory(tvId, showTitle, 0, 'tv', posterPath);
}

// ----- Trailer Functions -----
async function openTrailer(movieId) {
    var DOM = window.AppState.DOM;
    try {
        showToast('Loading trailer...', 'info');
        var url = API_BASE + '/movie/' + movieId + '/videos?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        var data = await response.json();
        var trailer = data.results.find(function(v) { return v.type === 'Trailer' && v.site === 'YouTube'; });
        if (trailer && DOM.trailerModal && DOM.trailerIframe) {
            DOM.trailerIframe.src = 'https://www.youtube.com/embed/' + trailer.key + '?autoplay=1&rel=0';
            DOM.trailerModal.classList.add('active');
            DOM.trailerModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            showToast('No trailer available for this movie', 'warning');
        }
    } catch (error) {
        console.error('Error loading trailer:', error);
        showToast('Failed to load trailer', 'error');
    }
}

function closeTrailer() {
    var DOM = window.AppState.DOM;
    if (DOM.trailerModal) {
        DOM.trailerModal.classList.remove('active');
        DOM.trailerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (DOM.trailerIframe) DOM.trailerIframe.src = '';
}