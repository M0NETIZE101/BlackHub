// ============================================
// MoviesAndSeriesHub - Complete JavaScript
// ============================================

// ----- Configuration -----
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMDM0NTIzZDVhZjcyN2ZjZjI1OWZmYTI0Mjc2Yjk2YSIsIm5iZiI6MTc4NjA4OTUyOS42MzM5OTk4LCJzdWIiOiI2YTc1OTAzOWQ5NzdhMGU4YzAzMzRiYzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.I-g3ehob-pOMXCjEAkcJ79PMwrjnMYZurYIOnpWSCuY';
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w1280';

// ----- Placeholder image (base64 1x1 pixel to avoid external requests) -----
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect width="300" height="450" fill="%231a1a2e"/%3E%3Ctext x="150" y="225" font-family="Arial" font-size="18" fill="%23666" text-anchor="middle"%3ENo Poster%3C/text%3E%3C/svg%3E';

// ----- State -----
let currentCategory = 'now_playing';
let currentPage = 1;
let totalPages = 1;
let currentView = 'grid';
let isLoading = false;
let searchQuery = '';
let isSearching = false;
let watchlist = [];
let watchHistory = {};
let currentTypeFilter = 'all';
let genreMap = {};
let genreList = [];

// ----- DOM Elements -----
const moviesGrid = document.getElementById('moviesGrid');
const sectionTitle = document.getElementById('sectionTitle');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const heroTitle = document.getElementById('heroTitle');
const heroDescription = document.getElementById('heroDescription');
const heroImage = document.getElementById('heroImage');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const seasonsModal = document.getElementById('seasonsModal');
const seasonsBody = document.getElementById('seasonsBody');
const seasonsModalClose = document.getElementById('seasonsModalClose');
const playerModal = document.getElementById('playerModal');
const playerIframe = document.getElementById('playerIframe');
const playerTitle = document.getElementById('playerTitle');
const playerLoading = document.getElementById('playerLoading');
const trailerModal = document.getElementById('trailerModal');
const trailerIframe = document.getElementById('trailerIframe');
const themeToggle = document.getElementById('themeToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.getElementById('navLinks');
const backToTop = document.getElementById('backToTop');
const mobileBottomNav = document.getElementById('mobileBottomNav');
const mobileSearchToggle = document.getElementById('mobileSearchToggle');
const genreFilter = document.getElementById('genreFilter');

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 MoviesAndSeriesHub initializing...');
    
    loadWatchlist();
    loadWatchHistory();
    loadTheme();
    loadViewPreference();
    loadGenresAndPopulateDropdown();
    
    loadContent('now_playing');
    setupEventListeners();
    setupScrollListener();
    setupKeyboardShortcuts();
    renderContinueWatching();
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
});

// ============================================
// Load Genres from TMDB & Populate Dropdown
// ============================================
async function loadGenresAndPopulateDropdown() {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            fetch(API_BASE + '/genre/movie/list?language=en-US', {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); }),
            fetch(API_BASE + '/genre/tv/list?language=en-US', {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); })
        ]);

        var allGenres = {};
        if (movieGenres.genres) {
            movieGenres.genres.forEach(function(g) {
                allGenres[g.id] = g.name;
            });
        }
        if (tvGenres.genres) {
            tvGenres.genres.forEach(function(g) {
                allGenres[g.id] = g.name;
            });
        }

        genreMap = allGenres;
        genreList = Object.keys(allGenres).map(function(id) {
            return { id: parseInt(id), name: allGenres[id] };
        }).sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

        console.log('✅ Genres loaded from TMDB:', genreList.length);
        populateGenreDropdown();

    } catch (e) {
        console.warn('⚠️ Failed to load genres from TMDB, using fallback:', e);
        var fallbackGenres = [
            { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' },
            { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
            { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
            { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' },
            { id: 14, name: 'Fantasy' }, { id: 36, name: 'History' },
            { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
            { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' },
            { id: 878, name: 'Sci-Fi' }, { id: 10770, name: 'TV Movie' },
            { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' },
            { id: 37, name: 'Western' }
        ];
        fallbackGenres.forEach(function(g) {
            genreMap[g.id] = g.name;
        });
        genreList = fallbackGenres;
        populateGenreDropdown();
    }
}

function populateGenreDropdown() {
    if (!genreFilter) return;
    genreFilter.innerHTML = '<option value="all">All Genres</option>';
    genreList.forEach(function(genre) {
        var option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreFilter.appendChild(option);
    });
    console.log('✅ Genre dropdown populated with', genreList.length, 'genres');
}

// ============================================
// Filter by type
// ============================================
function filterByType(items) {
    if (currentTypeFilter === 'all') return items;
    return items.filter(function(item) {
        return item.type === currentTypeFilter;
    });
}

// ============================================
// Load Combined Content (Movies + TV Shows)
// ============================================
async function loadContent(category, page) {
    if (page === undefined) page = 1;
    if (isLoading) return;
    isLoading = true;
    
    if (page === 1) {
        showSkeletons();
    } else {
        showLoadingSpinner();
    }

    try {
        var movieEndpoint = getMovieEndpoint(category);
        var tvEndpoint = getTvEndpoint(category);
        
        var [movieData, tvData] = await Promise.all([
            fetch(API_BASE + movieEndpoint + '?language=en-US&page=' + page, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); }).catch(function() { return { results: [] }; }),
            fetch(API_BASE + tvEndpoint + '?language=en-US&page=' + page, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); }).catch(function() { return { results: [] }; })
        ]);

        var combinedResults = [];
        if (movieData.results) {
            movieData.results.forEach(function(item) {
                combinedResults.push({ ...item, type: 'movie' });
            });
        }
        if (tvData.results) {
            tvData.results.forEach(function(item) {
                combinedResults.push({ ...item, type: 'tv' });
            });
        }
        
        combinedResults.sort(function(a, b) {
            return (b.popularity || 0) - (a.popularity || 0);
        });

        var filteredResults = filterByType(combinedResults);

        var totalPagesMovie = movieData.total_pages || 1;
        var totalPagesTv = tvData.total_pages || 1;
        totalPages = Math.max(totalPagesMovie, totalPagesTv);

        if (page === 1) {
            moviesGrid.innerHTML = '';
            updateCombinedHero(category, filteredResults[0]);
        }

        if (filteredResults.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try changing your filters.</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            displayContent(filteredResults);
            if (loadMoreBtn) {
                if (currentPage < totalPages) {
                    loadMoreBtn.style.display = 'inline-flex';
                    loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.classList.remove('loading');
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        }

        if (sectionTitle) {
            sectionTitle.textContent = getCombinedCategoryTitle(category);
        }

        applyView();
        hideLoadingSpinner();
        renderContinueWatching();

    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Failed to load content. Please try again.', 'error');
        hideLoadingSpinner();
        
        if (page === 1) {
            moviesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: 60px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--primary); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-secondary);">Failed to load content</h3>
                    <p style="color: var(--text-muted);">Please check your internet connection and try again.</p>
                    <button onclick="loadContent('${category}')" style="margin-top: 16px; padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }
}

// ============================================
// Get Endpoints for Movies and TV Shows
// ============================================
function getMovieEndpoint(category) {
    var endpoints = {
        'now_playing': '/movie/now_playing',
        'popular': '/movie/popular',
        'top_rated': '/movie/top_rated',
        'upcoming': '/movie/upcoming',
    };
    return endpoints[category] || endpoints.now_playing;
}

function getTvEndpoint(category) {
    var endpoints = {
        'now_playing': '/tv/airing_today',
        'popular': '/tv/popular',
        'top_rated': '/tv/top_rated',
        'upcoming': '/tv/on_the_air',
    };
    return endpoints[category] || endpoints.tv_airing_today;
}

function getCombinedCategoryTitle(category) {
    var titles = {
        'now_playing': 'Now Playing & Airing Today',
        'popular': 'Popular Movies & TV Shows',
        'top_rated': 'Top Rated Movies & TV Shows',
        'upcoming': 'Coming Soon & On The Air',
    };
    return titles[category] || 'Movies & TV Shows';
}

// ============================================
// Update Hero (Combined)
// ============================================
function updateCombinedHero(category, item) {
    if (!item) {
        if (heroTitle) heroTitle.textContent = 'Welcome to MoviesAndSeriesHub';
        if (heroDescription) heroDescription.textContent = 'Discover the best movies and TV shows on MoviesAndSeriesHub.';
        if (heroImage) {
            heroImage.innerHTML = '<div class="hero-image-placeholder"><i class="fas fa-film"></i></div>';
        }
        return;
    }
    var titles = {
        'now_playing': 'Now Playing & Airing Today',
        'popular': 'Popular Movies & TV Shows',
        'top_rated': 'Top Rated Movies & TV Shows',
        'upcoming': 'Coming Soon & On The Air',
    };
    var name = item.title || item.name || '';
    if (heroTitle) {
        heroTitle.textContent = (titles[category] || 'Movies & TV') + ' - ' + name;
    }
    if (heroDescription) {
        heroDescription.textContent = item.overview || 'Discover the best movies and TV shows on MoviesAndSeriesHub.';
    }
    updateHeroImage(item);
}

function updateHeroImage(item) {
    if (!heroImage) return;
    var imagePath = item.backdrop_path || item.poster_path;
    if (imagePath) {
        var imageUrl = IMAGE_BASE + '/w780' + imagePath;
        heroImage.innerHTML = `
            <img src="${imageUrl}" alt="${item.title || item.name || ''}" loading="lazy" onerror="this.style.display='none'">
            <div class="movie-title-overlay">
                <h2>${item.title || item.name || ''}</h2>
                <p>${item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : ''} • ${item.vote_average ? item.vote_average.toFixed(1) + '/10' : ''}</p>
            </div>
        `;
    } else {
        heroImage.innerHTML = '<div class="hero-image-placeholder"><i class="fas fa-film"></i></div>';
    }
}

// ============================================
// Display Content
// ============================================
function displayContent(items) {
    items.forEach(function(item) {
        var card = createCard(item, item.type);
        moviesGrid.appendChild(card);
    });
}

// ============================================
// Create Card (with genre tags from TMDB)
// ============================================
function createCard(item, type) {
    if (type === undefined) type = 'movie';
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
        .map(function(id) { return genreMap[id]; })
        .filter(function(g) { return g; });
    var genreTags = genreNames.map(function(g) {
        var genreId = Object.keys(genreMap).find(function(key) { return genreMap[key] === g; });
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
            if (genreId && genreFilter) {
                genreFilter.value = genreId;
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

// ============================================
// Loading Functions
// ============================================
function showLoadingSpinner() {
    hideLoadingSpinner();
    var container = document.createElement('div');
    container.className = 'loading-spinner-container';
    container.id = 'loadingSpinner';
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
    moviesGrid.appendChild(container);
}

function hideLoadingSpinner() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.remove();
}

function showSkeletons(count) {
    if (count === undefined) count = 12;
    if (!moviesGrid) return;
    hideLoadingSpinner();
    moviesGrid.innerHTML = '';
    for (var i = 0; i < count; i++) {
        var skeleton = document.createElement('div');
        skeleton.className = 'movie-card skeleton-card';
        skeleton.innerHTML = `
            <div class="poster-wrapper"><div class="skeleton-poster"></div></div>
            <div class="movie-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
            </div>
        `;
        moviesGrid.appendChild(skeleton);
    }
}

// ============================================
// Load More
// ============================================
async function loadMoreContent() {
    if (isLoading) return;
    
    if (currentPage < totalPages) {
        currentPage++;
        
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadMoreBtn.classList.add('loading');
        }
        
        if (isSearching) {
            await performSearch(searchQuery, currentPage);
        } else {
            await loadContent(currentCategory, currentPage);
        }
        
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.classList.remove('loading');
            if (currentPage < totalPages) {
                loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
            } else {
                loadMoreBtn.style.display = 'none';
                showToast('You\'ve reached the end! 🎬', 'info');
            }
        }
    } else {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        showToast('You\'ve reached the end! 🎬', 'info');
    }
}

// ============================================
// CONTINUE WATCHING ROW
// ============================================
function renderContinueWatching() {
    var container = document.getElementById('continueWatching');
    if (!container) return;

    var history = Object.values(watchHistory)
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
        var posterUrl = item.poster_path 
            ? IMAGE_BASE + '/w200' + item.poster_path
            : PLACEHOLDER_IMAGE;
        var progress = Math.round(item.progress || 0);
        var isTv = item.type === 'tv';

        card.innerHTML = `
            <div class="continue-poster-wrapper">
                <img src="${posterUrl}" alt="${item.title}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="continue-progress-bar"><div class="continue-progress-fill" style="width: ${progress}%"></div></div>
                <div class="continue-play-overlay"><i class="fas fa-play-circle"></i></div>
                ${isTv ? '<span class="badge badge-tv" style="position:absolute;top:8px;left:8px;z-index:3;"><i class="fas fa-tv"></i> TV</span>' : ''}
            </div>
            <div class="continue-info">
                <div class="continue-title">${item.title}</div>
                <div class="continue-meta">${progress}% watched</div>
            </div>
        `;

        card.addEventListener('click', function() {
            if (isTv) {
                openSeasonsModal(item.id, item.title);
            } else {
                openPlayerWithImdb(item.id, item.title);
            }
        });
        grid.appendChild(card);
    });
}

// ============================================
// SEASONS & EPISODES MODAL (TV Shows)
// ============================================
async function openSeasonsModal(tvId, tvName) {
    try {
        var url = API_BASE + '/tv/' + tvId + '?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch TV show details');
        var show = await response.json();
        
        seasonsBody.innerHTML = `
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
        seasonsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading TV show:', error);
        showToast('Failed to load TV show details', 'error');
    }
}

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

function closeSeasonsModal() {
    if (seasonsModal) {
        seasonsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function playEpisode(tvId, season, episode, episodeName) {
    closeSeasonsModal();
    var title = 'S' + season + 'E' + episode + ' - ' + episodeName;
    var embedUrl = getTvEmbedUrl(null, tvId, season, episode);
    if (!embedUrl) {
        showToast('No video source available for this episode', 'error');
        return;
    }
    if (playerTitle) playerTitle.textContent = title;
    if (playerIframe) playerIframe.src = embedUrl;
    if (playerModal) {
        playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    showPlayerLoading();
}

// ============================================
// Search
// ============================================
async function performSearch(query, page) {
    if (page === undefined) page = 1;
    if (!searchInput) return;
    var q = query || searchInput.value.trim();
    if (!q) {
        isSearching = false;
        loadContent(currentCategory);
        return;
    }

    isSearching = true;
    searchQuery = q;
    currentPage = page || 1;
    if (isLoading) return;
    isLoading = true;
    if (page === 1) showSkeletons(); else showLoadingSpinner();

    try {
        var [movieResults, tvResults] = await Promise.all([
            fetch(API_BASE + '/search/movie?query=' + encodeURIComponent(q) + '&language=en-US&page=' + currentPage, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); }),
            fetch(API_BASE + '/search/tv?query=' + encodeURIComponent(q) + '&language=en-US&page=' + currentPage, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); })
        ]);

        var allResults = [];
        if (movieResults.results) {
            movieResults.results.forEach(function(item) {
                allResults.push({ ...item, type: 'movie' });
            });
        }
        if (tvResults.results) {
            tvResults.results.forEach(function(item) {
                allResults.push({ ...item, type: 'tv' });
            });
        }
        allResults.sort(function(a, b) {
            return (b.popularity || 0) - (a.popularity || 0);
        });
        var filteredResults = filterByType(allResults);

        if (page === 1) {
            moviesGrid.innerHTML = '';
            if (heroTitle) heroTitle.textContent = 'Search Results: "' + q + '"';
            if (heroDescription) heroDescription.textContent = 'Found ' + filteredResults.length + ' results';
        }

        if (filteredResults.length === 0) {
            moviesGrid.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><h3>No results found</h3><p>Try a different search term.</p></div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            displayContent(filteredResults);
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            if (page === 1) showToast('Found ' + filteredResults.length + ' results for "' + q + '"', 'success');
        }

        if (sectionTitle) sectionTitle.textContent = 'Search Results: "' + q + '"';
        applyView();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Failed to search. Please try again.', 'error');
        hideLoadingSpinner();
    } finally {
        isLoading = false;
    }
}

// ============================================
// Setup Event Listeners
// ============================================
function setupEventListeners() {
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var category = this.dataset.category;
            setActiveNav(category);
            loadContent(category);
            closeMobileMenu();
        });
    });

    document.querySelectorAll('.footer-section a[data-category]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var category = this.dataset.category;
            setActiveNav(category);
            loadContent(category);
        });
    });

    var browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', function() {
            document.querySelector('.movies-section').scrollIntoView({ behavior: 'smooth' });
            loadContent('now_playing');
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
        searchInput.addEventListener('input', function(e) {
            if (this.value === '') {
                isSearching = false;
                loadContent(currentCategory);
            }
        });
    }

    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            currentView = this.dataset.view;
            applyView();
            localStorage.setItem('preferredView', currentView);
        });
    });

    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            currentTypeFilter = this.dataset.type;
            if (isSearching) performSearch(searchQuery, 1);
            else loadContent(currentCategory, 1);
        });
    });

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('open');
            var icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) closeMobileMenu();
        });
    }

    if (mobileBottomNav) {
        document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var category = this.dataset.category;
                if (category) {
                    document.querySelectorAll('.mobile-bottom-nav a').forEach(function(a) {
                        a.classList.remove('active');
                    });
                    this.classList.add('active');
                    setActiveNav(category);
                    loadContent(category);
                    closeMobileMenu();
                }
            });
        });
    }

    if (mobileSearchToggle) {
        mobileSearchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    if (genreFilter) genreFilter.addEventListener('change', applyFilters);
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

    var modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    if (seasonsModalClose) seasonsModalClose.addEventListener('click', closeSeasonsModal);
    if (seasonsModal) {
        seasonsModal.addEventListener('click', function(e) {
            if (e.target === seasonsModal) closeSeasonsModal();
        });
    }

    var playerClose = document.getElementById('playerClose');
    if (playerClose) playerClose.addEventListener('click', closePlayer);
    var closePlayerBtn = document.getElementById('closePlayerBtn');
    if (closePlayerBtn) closePlayerBtn.addEventListener('click', closePlayer);

    var fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    var reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) reloadBtn.addEventListener('click', reloadPlayer);

    var trailerClose = document.getElementById('trailerClose');
    if (trailerClose) trailerClose.addEventListener('click', closeTrailer);
    if (trailerModal) {
        trailerModal.addEventListener('click', function(e) {
            if (e.target === trailerModal) closeTrailer();
        });
    }

    if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreContent);
    if (playerIframe) playerIframe.addEventListener('load', hidePlayerLoading);
    if (backToTop) {
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    setupSocialLinks();
}

function setActiveNav(category) {
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    currentCategory = category;
    isSearching = false;
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    currentPage = 1;
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
        loadMoreBtn.disabled = false;
        loadMoreBtn.classList.remove('loading');
    }
}

function closeMobileMenu() {
    if (navLinks) navLinks.classList.remove('open');
    if (mobileMenuToggle) {
        var icon = mobileMenuToggle.querySelector('i');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    }
}

// ============================================
// Filters
// ============================================
function applyFilters() {
    currentPage = 1;
    loadContentWithFilters();
}

async function loadContentWithFilters() {
    if (isLoading) return;
    isLoading = true;
    showSkeletons();

    try {
        var movieEndpoint = getMovieEndpoint(currentCategory);
        var tvEndpoint = getTvEndpoint(currentCategory);
        var movieUrl = API_BASE + movieEndpoint + '?language=en-US&page=' + currentPage;
        var tvUrl = API_BASE + tvEndpoint + '?language=en-US&page=' + currentPage;
        
        var genre = document.getElementById('genreFilter').value;
        var year = document.getElementById('yearFilter').value;
        var sort = document.getElementById('sortFilter').value;

        if (genre !== 'all') {
            movieUrl += '&with_genres=' + genre;
            tvUrl += '&with_genres=' + genre;
        }
        if (year !== 'all') {
            movieUrl += '&primary_release_year=' + year;
            tvUrl += '&first_air_date_year=' + year;
        }
        movieUrl += '&sort_by=' + sort;
        tvUrl += '&sort_by=' + sort;

        var [movieData, tvData] = await Promise.all([
            fetch(movieUrl, { headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' } })
                .then(function(r) { return r.json(); }).catch(function() { return { results: [] }; }),
            fetch(tvUrl, { headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' } })
                .then(function(r) { return r.json(); }).catch(function() { return { results: [] }; })
        ]);

        var combinedResults = [];
        if (movieData.results) {
            movieData.results.forEach(function(item) {
                combinedResults.push({ ...item, type: 'movie' });
            });
        }
        if (tvData.results) {
            tvData.results.forEach(function(item) {
                combinedResults.push({ ...item, type: 'tv' });
            });
        }
        combinedResults.sort(function(a, b) {
            return (b.popularity || 0) - (a.popularity || 0);
        });
        var filteredResults = filterByType(combinedResults);

        var totalPagesMovie = movieData.total_pages || 1;
        var totalPagesTv = tvData.total_pages || 1;
        totalPages = Math.max(totalPagesMovie, totalPagesTv);

        if (currentPage === 1) {
            moviesGrid.innerHTML = '';
            if (heroTitle) heroTitle.textContent = 'Filtered Results';
        }

        if (filteredResults.length === 0) {
            moviesGrid.innerHTML = '<div class="no-results"><i class="fas fa-filter"></i><h3>No results found</h3><p>Try adjusting your filters.</p></div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            displayContent(filteredResults);
            if (loadMoreBtn) {
                if (currentPage < totalPages) {
                    loadMoreBtn.style.display = 'inline-flex';
                    loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.classList.remove('loading');
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        }
        if (sectionTitle) sectionTitle.textContent = 'Filtered Results';
        applyView();
    } catch (error) {
        console.error('Error loading filtered content:', error);
        showToast('Failed to load content. Please try again.', 'error');
    } finally {
        isLoading = false;
    }
}

// ============================================
// Movie Modal Functions
// ============================================
async function openMovieModal(movieId) {
    try {
        var url = API_BASE + '/movie/' + movieId + '?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
        var movie = await response.json();
        displayMovieModal(movie);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        showToast('Failed to load movie details.', 'error');
    }
}

function displayMovieModal(movie) {
    var backdropPath = movie.backdrop_path ? IMAGE_BASE + '/' + BACKDROP_SIZE + movie.backdrop_path : PLACEHOLDER_IMAGE;
    var genres = movie.genres.map(function(g) { return '<span class="genre-tag">' + g.name + '</span>'; }).join(' ');
    var runtime = movie.runtime ? movie.runtime + ' min' : 'N/A';
    var rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    var year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';

    if (!modalBody) return;
    modalBody.innerHTML = `
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

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// Video Player Functions
// ============================================
async function openPlayerWithImdb(movieId, movieTitle) {
    try {
        showPlayerLoading();
        var url = API_BASE + '/movie/' + movieId + '?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch movie details');
        var movie = await response.json();
        var imdbId = movie.imdb_id;
        if (!imdbId) { openPlayer(movieId, movieTitle); return; }
        var embedUrl = getEmbedUrl(imdbId, movieId, 'movie');
        if (!embedUrl) throw new Error('No embed providers available');
        if (playerTitle) playerTitle.textContent = movieTitle || movie.title;
        if (playerIframe) playerIframe.src = embedUrl;
        if (playerModal) {
            playerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        saveWatchHistory(movieId, movieTitle, 0, 'movie', movie.poster_path);
    } catch (error) {
        console.error('Error opening player:', error);
        hidePlayerLoading();
        showToast('Failed to load video. Please try again later.', 'error');
    }
}

function openPlayer(movieId, movieTitle) {
    if (playerTitle) playerTitle.textContent = movieTitle || 'Now Playing';
    var embedUrl = 'https://autoembed.co/movie/tmdb/' + movieId;
    if (playerIframe) playerIframe.src = embedUrl;
    if (playerModal) {
        playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    showPlayerLoading();
}

function closePlayer() {
    if (playerModal) {
        playerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    setTimeout(function() { if (playerIframe) playerIframe.src = ''; }, 300);
}

function toggleFullscreen() {
    var container = document.querySelector('.player-container');
    if (!document.fullscreenElement) {
        if (container) container.requestFullscreen().catch(function(err) { console.log('Fullscreen error:', err); });
    } else {
        document.exitFullscreen();
    }
}

function reloadPlayer() {
    if (playerIframe) {
        var currentSrc = playerIframe.src;
        playerIframe.src = '';
        setTimeout(function() { playerIframe.src = currentSrc; }, 100);
    }
}

function showPlayerLoading() { if (playerLoading) playerLoading.style.display = 'flex'; }
function hidePlayerLoading() { if (playerLoading) playerLoading.style.display = 'none'; }

// ============================================
// Trailer Functions
// ============================================
async function openTrailer(movieId) {
    try {
        showToast('Loading trailer...', 'info');
        var url = API_BASE + '/movie/' + movieId + '/videos?language=en-US';
        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
        });
        var data = await response.json();
        var trailer = data.results.find(function(v) { return v.type === 'Trailer' && v.site === 'YouTube'; });
        if (trailer && trailerModal && trailerIframe) {
            trailerIframe.src = 'https://www.youtube.com/embed/' + trailer.key + '?autoplay=1&rel=0';
            trailerModal.classList.add('active');
            trailerModal.style.display = 'flex';
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
    if (trailerModal) {
        trailerModal.classList.remove('active');
        trailerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (trailerIframe) trailerIframe.src = '';
}

// ============================================
// Watchlist Functions
// ============================================
function loadWatchlist() {
    try {
        watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    } catch (e) {
        watchlist = [];
    }
}

function toggleWatchlist(id) {
    var index = watchlist.indexOf(id);
    if (index === -1) {
        watchlist.push(id);
        showToast('Added to watchlist! ❤️', 'success');
    } else {
        watchlist.splice(index, 1);
        showToast('Removed from watchlist', 'info');
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    document.querySelectorAll('.watchlist-btn[data-id="' + id + '"]').forEach(function(btn) {
        var inList = watchlist.includes(id);
        btn.innerHTML = inList ? '<i class="fas fa-check"></i> In Watchlist' : '<i class="fas fa-plus"></i> Add to Watchlist';
        btn.style.color = inList ? '#46d369' : '';
    });
}

function isInWatchlist(id) { return watchlist.includes(id); }

// ============================================
// Watch History Functions
// ============================================
function loadWatchHistory() {
    try {
        watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || {};
    } catch (e) {
        watchHistory = {};
    }
}

function saveWatchHistory(id, title, progress, type, poster) {
    if (progress === undefined) progress = 0;
    if (type === undefined) type = 'movie';
    watchHistory[id] = {
        id: id,
        title: title,
        progress: progress,
        type: type,
        poster_path: poster,
        lastWatched: Date.now(),
        watched: progress >= 95
    };
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    renderContinueWatching();
}

function getWatchProgress(id) { return watchHistory[id] ? watchHistory[id].progress : 0; }

// ============================================
// Theme Functions
// ============================================
function loadTheme() {
    var savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    var html = document.documentElement;
    var currentTheme = html.getAttribute('data-theme');
    var newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (themeToggle) {
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
    showToast('Theme switched to ' + newTheme, 'info');
}

// ============================================
// View Functions
// ============================================
function loadViewPreference() {
    var savedView = localStorage.getItem('preferredView');
    if (savedView && (savedView === 'grid' || savedView === 'list')) {
        currentView = savedView;
        document.querySelectorAll('.view-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.view === savedView);
        });
        applyView();
    }
}

function applyView() {
    if (moviesGrid) moviesGrid.className = 'movies-grid ' + currentView + '-view';
}

// ============================================
// Social Links Functions - UPDATED WITH CREATOR POPUPS
// ============================================
function setupSocialLinks() {
    document.querySelectorAll('.social-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var platform = this.dataset.platform || 'social';
            showCreatorPopup(platform);
        });
    });
}

function showCreatorPopup(platform) {
    var existingPopup = document.querySelector('.social-popup');
    if (existingPopup) existingPopup.remove();

    var creatorData = {
        'instagram': {
            name: 'Foodgasm Nepal',
            handle: '@foodgasm__nepal',
            url: 'https://www.instagram.com/foodgasm__nepal/',
            emoji: '📸',
            description: 'A passionate food explorer from Nepal, sharing the vibrant and diverse flavors of Nepali cuisine. From street-side momos to traditional Newari feasts, Foodgasm Nepal takes you on a delicious journey through the heart of the Himalayas.',
            extra: 'Follow for daily food inspiration and authentic taste of Nepal! 🍜'
        },
        'youtube': {
            name: 'Nischaya KC',
            handle: '@NischayaKC356',
            url: 'https://www.youtube.com/@NischayaKC356',
            emoji: '🎬',
            description: 'A rising content creator from Nepal, Nischaya KC brings engaging and entertaining videos to YouTube. With a passion for storytelling and connecting with audiences, the channel offers a mix of lifestyle, vlogs, and creative content that resonates with viewers.',
            extra: 'Subscribe for exciting content and a glimpse into Nepali creativity! 🇳🇵'
        },
        'facebook': {
            name: 'Creative Nepal',
            handle: '@creative.nepal',
            url: '#',
            emoji: '👍',
            description: 'A community celebrating Nepali art, culture, and creativity. Showcasing talented artists, musicians, and creators from all across Nepal.',
            extra: 'Join the community and support Nepali talent! 🎨'
        },
        'twitter': {
            name: 'Nepal Tech Hub',
            handle: '@nepaltechhub',
            url: '#',
            emoji: '🐦',
            description: 'A hub for tech enthusiasts and innovators in Nepal. Sharing news, updates, and insights about the growing tech scene in the Himalayas.',
            extra: 'Follow for tech updates and innovation! 💻'
        }
    };

    var data = creatorData[platform] || {
        name: 'Amazing Creator',
        handle: '@creator',
        url: '#',
        emoji: '❤️',
        description: 'A talented individual making the internet a more creative and inspiring place.',
        extra: 'Support and follow their journey!'
    };

    var popup = document.createElement('div');
    popup.className = 'social-popup';
    popup.innerHTML = `
        <div class="social-popup-content">
            <button class="social-popup-close" onclick="this.closest('.social-popup').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="social-popup-icon">${data.emoji}</div>
            <h2>Support ${data.name}</h2>
            <p><strong>${data.handle}</strong></p>
            <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7; margin: 12px 0;">
                ${data.description}
            </p>
            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                ${data.extra}
            </p>
            <a href="${data.url}" target="_blank" rel="noopener noreferrer" 
               style="display: inline-block; padding: 10px 28px; background: var(--primary); color: #fff; 
                      border-radius: 8px; text-decoration: none; font-weight: 600; transition: var(--transition);">
                <i class="fas fa-external-link-alt"></i> Follow ${data.name}
            </a>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(function() {
        if (popup.parentNode) {
            popup.style.opacity = '0';
            popup.style.transform = 'scale(0.8)';
            popup.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                if (popup.parentNode) popup.remove();
            }, 300);
        }
    }, 8000);

    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// ============================================
// Toast System
// ============================================
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

// ============================================
// Scroll Listener
// ============================================
function setupScrollListener() {
    var header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (header) {
            if (scrollTop > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }
        if (backToTop) {
            if (scrollTop > 500) {
                backToTop.classList.add('visible');
                backToTop.style.display = 'block';
            } else {
                backToTop.classList.remove('visible');
                backToTop.style.display = 'none';
            }
        }
    });
}

// ============================================
// Keyboard Shortcuts
// ============================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closePlayer();
            closeTrailer();
            closeSeasonsModal();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'f' && playerModal && playerModal.classList.contains('active')) {
            e.preventDefault();
            toggleFullscreen();
        }
        if (e.key === 'r' && playerModal && playerModal.classList.contains('active')) {
            e.preventDefault();
            reloadPlayer();
        }
    });
}

console.log('🎬 MoviesAndSeriesHub loaded successfully!');
console.log('📋 Available commands:');
console.log('  - loadContent(category)  : Load movies and TV shows');
console.log('  - performSearch(query)   : Search for movies and TV shows');
console.log('  - currentCategory        : Current category');
console.log('  - currentPage            : Current page');