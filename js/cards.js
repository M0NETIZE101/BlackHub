// ============================================
// MoviesAndSeriesHub - Card Creation
// ============================================

// ----- Create Card (with genre tags from TMDB) -----
function createCard(item, type) {
    if (type === undefined) type = 'movie';
    var state = window.AppState;
    var card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = item.id;
    card.dataset.type = type;

    var posterPath = item.poster_path
        ? IMAGE_BASE + '/' + POSTER_SIZE + item.poster_path
        : PLACEHOLDER_IMAGE;

    var name = item.title || item.name || 'Unknown';
    var rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    var year = item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A';
    var safeTitle = name.replace(/'/g, "\\'");
    var inWatchlist = isInWatchlist(item.id);
    
    var stars = Math.round(item.vote_average / 2);
    var starHtml = '★'.repeat(Math.min(stars, 5)) + '☆'.repeat(Math.max(0, 5 - stars));
    var isTrending = item.vote_count > 1000;
    
    var isTv = type === 'tv';
    var typeLabel = isTv ? 'TV Show' : 'Movie';

    var genreNames = (item.genre_ids || [])
        .slice(0, 3)
        .map(function(id) { return state.genreMap[id]; })
        .filter(function(g) { return g; });
    var genreTags = genreNames.map(function(g) {
        var genreId = Object.keys(state.genreMap).find(function(key) { return state.genreMap[key] === g; });
        return '<span class="genre-tag" data-genre-id="' + genreId + '">' + g + '</span>';
    }).join('');

    var badges = '';
    if (isTv) {
        badges += '<span class="badge badge-tv"><i class="fas fa-tv"></i> TV</span>';
    } else {
        badges += '<span class="badge badge-movie"><i class="fas fa-film"></i> Movie</span>';
    }
    if (isTrending) {
        badges += '<span class="badge badge-trending"><i class="fas fa-fire"></i> Trending</span>';
    }

    card.innerHTML = `
        <div class="poster-wrapper">
            <img src="${posterPath}" alt="${name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="badge-container">${badges}</div>
            <div class="movie-rating">
                <span style="color: #f5c518; font-size: 11px;">${starHtml}</span>
                <span style="margin-left: 4px; font-size: 12px;">${rating}</span>
            </div>
            <div class="movie-overlay">
                <div class="movie-overview">${item.overview || 'No description available.'}</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="watch-btn" data-id="${item.id}" data-type="${type}" data-title="${safeTitle}">
                        <i class="fas fa-play"></i> ${isTv ? 'View Seasons' : 'Watch Now'}
                    </button>
                    <button class="watchlist-btn" data-id="${item.id}" onclick="event.stopPropagation(); toggleWatchlist(${item.id})">
                        <i class="fas ${inWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                        ${inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            </div>
        </div>
        <div class="movie-info">
            <div class="movie-title">
                ${name} <span class="rating-in-title">⭐ ${rating}</span>
            </div>
            <div class="movie-meta">
                <span class="movie-year">${year}</span>
                <span>${typeLabel}</span>
                <span class="rating-display">⭐ ${rating}</span>
            </div>
            ${genreTags ? '<div class="genre-tags">' + genreTags + '</div>' : ''}
            <div class="movie-overview-text">${item.overview || 'No description available.'}</div>
        </div>
    `;

    // Genre tag click listeners
    card.querySelectorAll('.genre-tag').forEach(function(tag) {
        tag.addEventListener('click', function(e) {
            e.stopPropagation();
            var genreId = this.dataset.genreId;
            if (genreId && state.DOM.genreFilter) {
                state.DOM.genreFilter.value = genreId;
                applyFilters();
            }
        });
    });

    var watchBtn = card.querySelector('.watch-btn');
    if (watchBtn) {
        watchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            var type = this.dataset.type;
            var title = this.dataset.title;
            if (type === 'tv') {
                openSeasonsModal(id, title);
            } else {
                openPlayerWithImdb(id, title);
            }
        });
    }

    card.addEventListener('click', function(e) {
        if (!e.target.closest('.watch-btn') && !e.target.closest('.watchlist-btn') && !e.target.closest('.genre-tag')) {
            if (type === 'tv') {
                openSeasonsModal(item.id, name);
            } else {
                openMovieModal(item.id);
            }
        }
    });

    return card;
}