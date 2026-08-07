// ============================================
// MovieHub - Complete JavaScript
// ============================================

// ----- Configuration -----
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMDM0NTIzZDVhZjcyN2ZjZjI1OWZmYTI0Mjc2Yjk2YSIsIm5iZiI6MTc4NjA4OTUyOS42MzM5OTk4LCJzdWIiOiI2YTc1OTAzOWQ5NzdhMGU4YzAzMzRiYzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.I-g3ehob-pOMXCjEAkcJ79PMwrjnMYZurYIOnpWSCuY';
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w1280';

// ----- State -----
let currentCategory = 'now_playing';
let currentPage = 1;
let totalPages = 1;
let currentView = 'grid';
let isLoading = false;
let searchQuery = '';
let isSearching = false;

// ----- DOM Elements -----
const moviesGrid = document.getElementById('moviesGrid');
const sectionTitle = document.getElementById('sectionTitle');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const heroTitle = document.getElementById('heroTitle');
const heroDescription = document.getElementById('heroDescription');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('MovieHub initializing...');
    loadMovies('now_playing');
    setupEventListeners();
    setupScrollListener();
});

// ============================================
// Setup Event Listeners
// ============================================
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            setActiveNav(category);
            loadMovies(category);
        });
    });

    // Footer links
    document.querySelectorAll('.footer-section a[data-category]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            setActiveNav(category);
            loadMovies(category);
        });
    });

    // Browse button
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', function() {
            loadMovies('now_playing');
        });
    }

    // Search
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
                loadMovies(currentCategory);
            }
        });
    }

    // View toggle
    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            currentView = this.dataset.view;
            applyView();
        });
    });

    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    window.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    // Player modal close
    const playerClose = document.getElementById('playerClose');
    if (playerClose) {
        playerClose.addEventListener('click', closePlayer);
    }
    const closePlayerBtn = document.getElementById('closePlayerBtn');
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }

    // Player controls
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', reloadPlayer);
    }

    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreMovies);
    }

    // Player iframe load
    const iframe = document.getElementById('playerIframe');
    if (iframe) {
        iframe.addEventListener('load', hidePlayerLoading);
    }
}

// ============================================
// Set Active Navigation
// ============================================
function setActiveNav(category) {
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    currentCategory = category;
    isSearching = false;
    if (searchInput) searchInput.value = '';
}

// ============================================
// Load Movies
// ============================================
async function loadMovies(category, page = 1) {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    try {
        const endpoint = getCategoryEndpoint(category);
        const url = API_BASE + endpoint + '?language=en-US&page=' + page;

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

        const data = await response.json();
        totalPages = data.total_pages || 1;

        if (page === 1) {
            moviesGrid.innerHTML = '';
            updateHero(category, data.results[0]);
        }

        displayMovies(data.results);

        // Show/hide load more button
        if (loadMoreBtn) {
            loadMoreBtn.style.display = currentPage < totalPages ? 'inline-flex' : 'none';
        }

        // Update section title
        if (sectionTitle) {
            sectionTitle.textContent = getCategoryTitle(category);
        }

    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies. Please try again.');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// ============================================
// Get Category Endpoint
// ============================================
function getCategoryEndpoint(category) {
    const endpoints = {
        'now_playing': '/movie/now_playing',
        'popular': '/movie/popular',
        'top_rated': '/movie/top_rated',
        'upcoming': '/movie/upcoming'
    };
    return endpoints[category] || endpoints.now_playing;
}

// ============================================
// Get Category Title
// ============================================
function getCategoryTitle(category) {
    const titles = {
        'now_playing': 'Now Playing',
        'popular': 'Popular Movies',
        'top_rated': 'Top Rated Movies',
        'upcoming': 'Upcoming Movies'
    };
    return titles[category] || 'Movies';
}

// ============================================
// Update Hero
// ============================================
function updateHero(category, movie) {
    if (!movie) return;
    const titles = {
        'now_playing': 'Now Playing',
        'popular': 'Trending Now',
        'top_rated': 'Top Rated',
        'upcoming': 'Coming Soon'
    };
    if (heroTitle) {
        heroTitle.textContent = (titles[category] || 'Movies') + ' - ' + movie.title;
    }
    if (heroDescription) {
        heroDescription.textContent = movie.overview || 'Discover the best ' + getCategoryTitle(category) + '.';
    }
}

// ============================================
// Display Movies
// ============================================
function displayMovies(movies) {
    movies.forEach(function(movie) {
        const card = createMovieCard(movie);
        moviesGrid.appendChild(card);
    });
}

// ============================================
// Create Movie Card
// ============================================
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.id;

    const posterPath = movie.poster_path
        ? IMAGE_BASE + '/' + POSTER_SIZE + movie.poster_path
        : 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Poster';

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
    const safeTitle = movie.title.replace(/'/g, "\\'");

    card.innerHTML = `
        <div class="poster-wrapper">
            <img src="${posterPath}" alt="${movie.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/666?text=No+Poster'">
            <div class="movie-rating">
                <i class="fas fa-star"></i> ${rating}
            </div>
            <div class="movie-overlay">
                <div class="movie-overview">${movie.overview || 'No description available.'}</div>
                <button class="watch-btn" data-movie-id="${movie.id}" data-movie-title="${safeTitle}">
                    <i class="fas fa-play"></i> Watch Now
                </button>
            </div>
        </div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-meta">
                <span class="movie-year">${year}</span>
                <span><i class="fas fa-calendar-alt" style="font-size:10px;"></i> ${movie.release_date || 'Unknown'}</span>
            </div>
        </div>
    `;

    // Watch button click
    const watchBtn = card.querySelector('.watch-btn');
    if (watchBtn) {
        watchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const movieId = parseInt(this.dataset.movieId);
            const movieTitle = this.dataset.movieTitle;
            openPlayerWithImdb(movieId, movieTitle);
        });
    }

    // Card click opens details
    card.addEventListener('click', function(e) {
        if (!e.target.closest('.watch-btn')) {
            openMovieModal(parseInt(this.dataset.movieId));
        }
    });

    return card;
}

// ============================================
// Apply View
// ============================================
function applyView() {
    if (moviesGrid) {
        moviesGrid.className = 'movies-grid ' + currentView + '-view';
    }
}

// ============================================
// Load More Movies
// ============================================
async function loadMoreMovies() {
    if (currentPage < totalPages) {
        currentPage++;
        if (isSearching) {
            await searchMovies(searchQuery, currentPage);
        } else {
            await loadMovies(currentCategory, currentPage);
        }
    }
}

// ============================================
// Search
// ============================================
async function performSearch() {
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (!query) {
        isSearching = false;
        loadMovies(currentCategory);
        return;
    }

    isSearching = true;
    searchQuery = query;
    currentPage = 1;
    await searchMovies(query, 1);
}

async function searchMovies(query, page = 1) {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    try {
        const url = API_BASE + '/search/movie?query=' + encodeURIComponent(query) + '&language=en-US&page=' + page;

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

        const data = await response.json();
        totalPages = data.total_pages || 1;

        if (page === 1) {
            moviesGrid.innerHTML = '';
            if (heroTitle) {
                heroTitle.textContent = 'Search Results: "' + query + '"';
            }
            if (heroDescription) {
                heroDescription.textContent = 'Found ' + data.total_results + ' results';
            }
        }

        if (data.results.length === 0) {
            moviesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: 60px 20px;">
                    <i class="fas fa-search" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-secondary);">No movies found</h3>
                    <p style="color: var(--text-muted);">Try a different search term.</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            displayMovies(data.results);
            if (loadMoreBtn) {
                loadMoreBtn.style.display = currentPage < totalPages ? 'inline-flex' : 'none';
            }
        }

        if (sectionTitle) {
            sectionTitle.textContent = 'Search: "' + query + '"';
        }

    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Failed to search movies. Please try again.');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// ============================================
// Movie Modal Functions
// ============================================
async function openMovieModal(movieId) {
    try {
        const url = API_BASE + '/movie/' + movieId + '?language=en-US';

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

        const movie = await response.json();
        displayModal(movie);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        showError('Failed to load movie details.');
    }
}

function displayModal(movie) {
    const backdropPath = movie.backdrop_path
        ? IMAGE_BASE + '/' + BACKDROP_SIZE + movie.backdrop_path
        : IMAGE_BASE + '/' + POSTER_SIZE + movie.poster_path;

    const posterPath = movie.poster_path
        ? IMAGE_BASE + '/' + POSTER_SIZE + movie.poster_path
        : 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Poster';

    const genres = movie.genres.map(function(g) {
        return '<span class="genre-tag">' + g.name + '</span>';
    }).join(' ');
    const runtime = movie.runtime ? movie.runtime + ' min' : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';

    if (!modalBody) return;

    modalBody.innerHTML = `
        <img src="${backdropPath}" alt="${movie.title}" class="modal-poster" onerror="this.style.display='none'">
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
                <div class="modal-detail-item">
                    <strong>Status</strong>
                    ${movie.status || 'Unknown'}
                </div>
                <div class="modal-detail-item">
                    <strong>Budget</strong>
                    ${movie.budget ? '$' + movie.budget.toLocaleString() : 'N/A'}
                </div>
                <div class="modal-detail-item">
                    <strong>Revenue</strong>
                    ${movie.revenue ? '$' + movie.revenue.toLocaleString() : 'N/A'}
                </div>
                <div class="modal-detail-item">
                    <strong>Production Companies</strong>
                    ${movie.production_companies ? movie.production_companies.map(function(c) { return c.name; }).join(', ') : 'N/A'}
                </div>
                <div class="modal-detail-item" style="grid-column: 1/-1;">
                    <strong>Tagline</strong>
                    ${movie.tagline || 'No tagline'}
                </div>
                <div class="modal-detail-item" style="grid-column: 1/-1;">
                    <button class="watch-btn" id="modalWatchBtn" data-movie-id="${movie.id}" data-movie-title="${movie.title.replace(/'/g, "\\'")}">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                </div>
            </div>
        </div>
    `;

    // Watch button in modal
    const modalWatchBtn = document.getElementById('modalWatchBtn');
    if (modalWatchBtn) {
        modalWatchBtn.addEventListener('click', function() {
            const movieId = parseInt(this.dataset.movieId);
            const movieTitle = this.dataset.movieTitle;
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

        const url = API_BASE + '/movie/' + movieId + '?language=en-US';
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch movie details');

        const movie = await response.json();
        const imdbId = movie.imdb_id;

        if (!imdbId) {
            openPlayer(movieId, movieTitle);
            return;
        }

        // Use the embed configuration from embed-config.js
        const embedUrl = getEmbedUrl(imdbId, movieId);

        if (!embedUrl) {
            throw new Error('No embed providers available');
        }

        const playerModal = document.getElementById('playerModal');
        const iframe = document.getElementById('playerIframe');
        const title = document.getElementById('playerTitle');

        if (title) title.textContent = movieTitle || movie.title;
        if (iframe) iframe.src = embedUrl;

        if (playerModal) {
            playerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

    } catch (error) {
        console.error('Error opening player:', error);
        hidePlayerLoading();
        alert('Failed to load video. Please try again later.');
    }
}

function openPlayer(movieId, movieTitle) {
    const playerModal = document.getElementById('playerModal');
    const iframe = document.getElementById('playerIframe');
    const title = document.getElementById('playerTitle');

    if (title) title.textContent = movieTitle || 'Now Playing';

    // Use TMDB ID as fallback
    const embedUrl = 'https://autoembed.co/movie/tmdb/' + movieId;
    if (iframe) iframe.src = embedUrl;

    if (playerModal) {
        playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    showPlayerLoading();
}

function closePlayer() {
    const playerModal = document.getElementById('playerModal');
    const iframe = document.getElementById('playerIframe');

    if (playerModal) {
        playerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    setTimeout(function() {
        if (iframe) iframe.src = '';
    }, 300);
}

function toggleFullscreen() {
    const container = document.querySelector('.player-container');
    if (!document.fullscreenElement) {
        if (container) {
            container.requestFullscreen().catch(function(err) {
                console.log('Fullscreen error:', err);
            });
        }
    } else {
        document.exitFullscreen();
    }
}

function reloadPlayer() {
    const iframe = document.getElementById('playerIframe');
    if (iframe) {
        const currentSrc = iframe.src;
        iframe.src = '';
        setTimeout(function() {
            iframe.src = currentSrc;
        }, 100);
    }
}

function showPlayerLoading() {
    const wrapper = document.querySelector('.player-wrapper');
    if (!wrapper) return;
    const existing = wrapper.querySelector('.player-loading');
    if (existing) existing.remove();

    const loading = document.createElement('div');
    loading.className = 'player-loading';
    loading.innerHTML = `
        <div class="spinner"></div>
        <span>Loading video...</span>
    `;
    wrapper.appendChild(loading);
}

function hidePlayerLoading() {
    const wrapper = document.querySelector('.player-wrapper');
    if (!wrapper) return;
    const loading = wrapper.querySelector('.player-loading');
    if (loading) loading.remove();
}

// ============================================
// Utility Functions
// ============================================
function showLoading() {
    // You can add a loading spinner here
}

function hideLoading() {
    // You can hide the loading spinner here
}

function showError(message) {
    console.error(message);
}

function setupScrollListener() {
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (header) {
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', function(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        closeModal();
        closePlayer();
    }

    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
    }
});

console.log('MovieHub loaded successfully!');
console.log('Available commands:');
console.log('  - loadMovies(category)  : Load movies by category');
console.log('  - performSearch(query)  : Search for movies');
console.log('  - currentCategory       : Current category');
console.log('  - currentPage           : Current page');