// ============================================
// BlackHub - Complete JavaScript
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
let watchlist = [];
let watchHistory = {};

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

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖤 BlackHub initializing...');
    
    // Load saved data
    loadWatchlist();
    loadWatchHistory();
    loadTheme();
    loadViewPreference();
    
    // Load movies
    loadMovies('now_playing');
    setupEventListeners();
    setupScrollListener();
    setupKeyboardShortcuts();
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
            closeMobileMenu();
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
            document.querySelector('.movies-section').scrollIntoView({ behavior: 'smooth' });
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
            localStorage.setItem('preferredView', currentView);
        });
    });

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('open');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }

    // Mobile bottom nav
    if (mobileBottomNav) {
        document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const category = this.dataset.category;
                if (category) {
                    document.querySelectorAll('.mobile-bottom-nav a').forEach(function(a) {
                        a.classList.remove('active');
                    });
                    this.classList.add('active');
                    setActiveNav(category);
                    loadMovies(category);
                    closeMobileMenu();
                }
            });
        });
    }

    // Mobile search toggle
    if (mobileSearchToggle) {
        mobileSearchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Filters
    document.getElementById('genreFilter').addEventListener('change', applyFilters);
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

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

    // Trailer close
    const trailerClose = document.getElementById('trailerClose');
    if (trailerClose) {
        trailerClose.addEventListener('click', closeTrailer);
    }
    if (trailerModal) {
        trailerModal.addEventListener('click', function(e) {
            if (e.target === trailerModal) closeTrailer();
        });
    }

    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreMovies);
    }

    // Player iframe load
    if (playerIframe) {
        playerIframe.addEventListener('load', hidePlayerLoading);
    }

    // Back to top
    if (backToTop) {
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Social links
    setupSocialLinks();
}

// ============================================
// Set Active Navigation
// ============================================
function setActiveNav(category) {
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    currentCategory = category;
    isSearching = false;
    if (searchInput) searchInput.value = '';
}

function closeMobileMenu() {
    if (navLinks) navLinks.classList.remove('open');
    if (mobileMenuToggle) {
        const icon = mobileMenuToggle.querySelector('i');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    }
}

// ============================================
// Theme Functions
// ============================================
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
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
    const savedView = localStorage.getItem('preferredView');
    if (savedView && (savedView === 'grid' || savedView === 'list')) {
        currentView = savedView;
        document.querySelectorAll('.view-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.view === savedView);
        });
        applyView();
    }
}

function applyView() {
    if (moviesGrid) {
        moviesGrid.className = 'movies-grid ' + currentView + '-view';
    }
}

// ============================================
// Load Movies
// ============================================
async function loadMovies(category, page = 1) {
    if (isLoading) return;
    isLoading = true;
    showSkeletons();

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

        if (loadMoreBtn) {
            loadMoreBtn.style.display = currentPage < totalPages ? 'inline-flex' : 'none';
        }

        if (sectionTitle) {
            sectionTitle.textContent = getCategoryTitle(category);
        }

        applyView();

    } catch (error) {
        console.error('Error loading movies:', error);
        showToast('Failed to load movies. Please try again.', 'error');
    } finally {
        isLoading = false;
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
    updateHeroImage(movie);
}

function updateHeroImage(movie) {
    if (!heroImage) return;
    if (movie.backdrop_path) {
        const imageUrl = IMAGE_BASE + '/w780' + movie.backdrop_path;
        heroImage.innerHTML = `
            <img src="${imageUrl}" alt="${movie.title}" loading="lazy" onerror="this.style.display='none'">
            <div class="movie-title-overlay">
                <h2>${movie.title}</h2>
                <p>${movie.release_date ? movie.release_date.substring(0, 4) : ''} • ${movie.vote_average ? movie.vote_average.toFixed(1) + '/10' : ''}</p>
            </div>
        `;
    } else {
        heroImage.innerHTML = `
            <div class="hero-image-placeholder">
                <i class="fas fa-film"></i>
            </div>
        `;
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
    const inWatchlist = isInWatchlist(movie.id);

    card.innerHTML = `
        <div class="poster-wrapper">
            <img src="${posterPath}" alt="${movie.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/666?text=No+Poster'">
            <div class="movie-rating">
                <i class="fas fa-star"></i> ${rating}
            </div>
            <div class="movie-overlay">
                <div class="movie-overview">${movie.overview || 'No description available.'}</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="watch-btn" data-movie-id="${movie.id}" data-movie-title="${safeTitle}">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="watchlist-btn" data-movie-id="${movie.id}" onclick="event.stopPropagation(); toggleWatchlist(${movie.id})">
                        <i class="fas ${inWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                        ${inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            </div>
        </div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-meta">
                <span class="movie-year">${year}</span>
                <span><i class="fas fa-calendar-alt" style="font-size:10px;"></i> ${movie.release_date || 'Unknown'}</span>
            </div>
            <div class="movie-overview-text">${movie.overview || 'No description available.'}</div>
        </div>
    `;

    const watchBtn = card.querySelector('.watch-btn');
    if (watchBtn) {
        watchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const movieId = parseInt(this.dataset.movieId);
            const movieTitle = this.dataset.movieTitle;
            openPlayerWithImdb(movieId, movieTitle);
        });
    }

    card.addEventListener('click', function(e) {
        if (!e.target.closest('.watch-btn') && !e.target.closest('.watchlist-btn')) {
            openMovieModal(parseInt(this.dataset.movieId));
        }
    });

    return card;
}

// ============================================
// Loading Skeletons
// ============================================
function showSkeletons(count = 12) {
    if (!moviesGrid) return;
    moviesGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'movie-card skeleton-card';
        skeleton.innerHTML = `
            <div class="poster-wrapper">
                <div class="skeleton-poster"></div>
            </div>
            <div class="movie-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
            </div>
        `;
        moviesGrid.appendChild(skeleton);
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
    showSkeletons();

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
            if (page === 1) {
                showToast('Found ' + data.total_results + ' results for "' + query + '"', 'success');
            }
        }

        if (sectionTitle) {
            sectionTitle.textContent = 'Search: "' + query + '"';
        }

        applyView();

    } catch (error) {
        console.error('Error searching movies:', error);
        showToast('Failed to search movies. Please try again.', 'error');
    } finally {
        isLoading = false;
    }
}

// ============================================
// Filter Functions
// ============================================
function applyFilters() {
    currentPage = 1;
    loadMoviesWithFilters();
}

async function loadMoviesWithFilters() {
    if (isLoading) return;
    isLoading = true;
    showSkeletons();

    try {
        let url = API_BASE + '/discover/movie?language=en-US&page=' + currentPage;
        
        const genre = document.getElementById('genreFilter').value;
        const year = document.getElementById('yearFilter').value;
        const sort = document.getElementById('sortFilter').value;

        if (genre !== 'all') {
            url += '&with_genres=' + genre;
        }
        if (year !== 'all') {
            url += '&primary_release_year=' + year;
        }
        url += '&sort_by=' + sort;

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

        const data = await response.json();
        totalPages = data.total_pages || 1;

        if (currentPage === 1) {
            moviesGrid.innerHTML = '';
            if (heroTitle) {
                heroTitle.textContent = 'Filtered Results';
            }
        }

        if (data.results.length === 0) {
            moviesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: 60px 20px;">
                    <i class="fas fa-filter" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-secondary);">No movies found</h3>
                    <p style="color: var(--text-muted);">Try adjusting your filters.</p>
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
            sectionTitle.textContent = 'Filtered Results';
        }

        applyView();

    } catch (error) {
        console.error('Error loading filtered movies:', error);
        showToast('Failed to load movies. Please try again.', 'error');
    } finally {
        isLoading = false;
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
        showToast('Failed to load movie details.', 'error');
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
                <div class="modal-detail-item" style="grid-column: 1/-1; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button class="watch-btn" id="modalWatchBtn" data-movie-id="${movie.id}" data-movie-title="${movie.title.replace(/'/g, "\\'")}">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="trailer-btn" onclick="openTrailer(${movie.id})">
                        <i class="fab fa-youtube"></i> Watch Trailer
                    </button>
                </div>
            </div>
        </div>
    `;

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
// Trailer Functions
// ============================================
async function openTrailer(movieId) {
    try {
        showToast('Loading trailer...', 'info');
        const url = API_BASE + '/movie/' + movieId + '/videos?language=en-US';
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        const trailer = data.results.find(function(v) {
            return v.type === 'Trailer' && v.site === 'YouTube';
        });
        
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
    if (trailerIframe) {
        trailerIframe.src = '';
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

        const embedUrl = getEmbedUrl(imdbId, movieId);

        if (!embedUrl) {
            throw new Error('No embed providers available');
        }

        if (playerTitle) playerTitle.textContent = movieTitle || movie.title;
        if (playerIframe) playerIframe.src = embedUrl;

        if (playerModal) {
            playerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Save to watch history
        saveWatchHistory(movieId, movieTitle, 0);

    } catch (error) {
        console.error('Error opening player:', error);
        hidePlayerLoading();
        showToast('Failed to load video. Please try again later.', 'error');
    }
}

function openPlayer(movieId, movieTitle) {
    if (playerTitle) playerTitle.textContent = movieTitle || 'Now Playing';

    const embedUrl = 'https://autoembed.co/movie/tmdb/' + movieId;
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

    setTimeout(function() {
        if (playerIframe) playerIframe.src = '';
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
    if (playerIframe) {
        const currentSrc = playerIframe.src;
        playerIframe.src = '';
        setTimeout(function() {
            playerIframe.src = currentSrc;
        }, 100);
    }
}

function showPlayerLoading() {
    if (playerLoading) {
        playerLoading.style.display = 'flex';
    }
}

function hidePlayerLoading() {
    if (playerLoading) {
        playerLoading.style.display = 'none';
    }
}

// ============================================
// Watchlist Functions
// ============================================
function loadWatchlist() {
    try {
        watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    } catch {
        watchlist = [];
    }
}

function toggleWatchlist(movieId) {
    const index = watchlist.indexOf(movieId);
    
    if (index === -1) {
        watchlist.push(movieId);
        showToast('Added to watchlist! ❤️', 'success');
    } else {
        watchlist.splice(index, 1);
        showToast('Removed from watchlist', 'info');
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistButtons(movieId);
}

function isInWatchlist(movieId) {
    return watchlist.includes(movieId);
}

function updateWatchlistButtons(movieId) {
    const inList = isInWatchlist(movieId);
    document.querySelectorAll('.watchlist-btn[data-movie-id="' + movieId + '"]').forEach(function(btn) {
        btn.innerHTML = inList ? 
            '<i class="fas fa-check"></i> In Watchlist' : 
            '<i class="fas fa-plus"></i> Add to Watchlist';
        btn.style.color = inList ? '#46d369' : '';
    });
}

// ============================================
// Watch History Functions
// ============================================
function loadWatchHistory() {
    try {
        watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || {};
    } catch {
        watchHistory = {};
    }
}

function saveWatchHistory(movieId, movieTitle, progress = 0) {
    watchHistory[movieId] = {
        id: movieId,
        title: movieTitle,
        progress: progress,
        lastWatched: Date.now(),
        watched: progress >= 95
    };
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
}

function getWatchProgress(movieId) {
    return watchHistory[movieId]?.progress || 0;
}

// ============================================
// Social Links Functions
// ============================================
function setupSocialLinks() {
    document.querySelectorAll('.social-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.dataset.platform || 'social';
            showThankYouPopup(platform);
        });
    });
}

function showThankYouPopup(platform) {
    const existingPopup = document.querySelector('.social-popup');
    if (existingPopup) existingPopup.remove();

    const emojis = {
        'facebook': '👍',
        'twitter': '🐦',
        'instagram': '📸',
        'youtube': '🎬'
    };
    const emoji = emojis[platform] || '❤️';

    const popup = document.createElement('div');
    popup.className = 'social-popup';
    popup.innerHTML = `
        <div class="social-popup-content">
            <button class="social-popup-close" onclick="this.closest('.social-popup').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="social-popup-icon">${emoji}</div>
            <h2>Thank You!</h2>
            <p>Thank you for your generosity!</p>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 12px;">You've made our day! 🎉</p>
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
    }, 5000);

    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// ============================================
// Toast System
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icons = {
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
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============================================
// Scroll Listener
// ============================================
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
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
    });
}

console.log('🖤 BlackHub loaded successfully!');
console.log('📋 Available commands:');
console.log('  - loadMovies(category)  : Load movies by category');
console.log('  - performSearch(query)  : Search for movies');
console.log('  - currentCategory       : Current category');
console.log('  - currentPage           : Current page');