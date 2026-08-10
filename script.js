// ============================================
// MoviesAndSeriesHub - Complete JavaScript
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
let currentTypeFilter = 'all'; // 'all', 'movie', 'tv'

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

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 MoviesAndSeriesHub initializing...');
    
    loadWatchlist();
    loadWatchHistory();
    loadTheme();
    loadViewPreference();
    
    loadContent('now_playing');
    setupEventListeners();
    setupScrollListener();
    setupKeyboardShortcuts();
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
});

// ============================================
// Filter by type
// ============================================
function filterByType(items) {
    if (currentTypeFilter === 'all') return items;
    return items.filter(item => item.type === currentTypeFilter);
}

// ============================================
// Load Combined Content (Movies + TV Shows)
// ============================================
async function loadContent(category, page = 1) {
    if (isLoading) return;
    isLoading = true;
    
    if (page === 1) {
        showSkeletons();
    } else {
        showLoadingSpinner();
    }

    try {
        const movieEndpoint = getMovieEndpoint(category);
        const tvEndpoint = getTvEndpoint(category);
        
        const [movieData, tvData] = await Promise.all([
            fetch(API_BASE + movieEndpoint + '?language=en-US&page=' + page, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => ({ results: [] })),
            fetch(API_BASE + tvEndpoint + '?language=en-US&page=' + page, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => ({ results: [] }))
        ]);

        const combinedResults = [
            ...(movieData.results || []).map(item => ({ ...item, type: 'movie' })),
            ...(tvData.results || []).map(item => ({ ...item, type: 'tv' }))
        ];
        
        combinedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        // Apply type filter
        const filteredResults = filterByType(combinedResults);

        const totalPagesMovie = movieData.total_pages || 1;
        const totalPagesTv = tvData.total_pages || 1;
        totalPages = Math.max(totalPagesMovie, totalPagesTv);

        if (page === 1) {
            moviesGrid.innerHTML = '';
            // Hero uses the first item from filtered results (if any)
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
    const endpoints = {
        'now_playing': '/movie/now_playing',
        'popular': '/movie/popular',
        'top_rated': '/movie/top_rated',
        'upcoming': '/movie/upcoming',
    };
    return endpoints[category] || endpoints.now_playing;
}

function getTvEndpoint(category) {
    const endpoints = {
        'now_playing': '/tv/airing_today',
        'popular': '/tv/popular',
        'top_rated': '/tv/top_rated',
        'upcoming': '/tv/on_the_air',
    };
    return endpoints[category] || endpoints.tv_airing_today;
}

function getCombinedCategoryTitle(category) {
    const titles = {
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
        // fallback placeholder
        if (heroTitle) {
            heroTitle.textContent = 'Welcome to MoviesAndSeriesHub';
        }
        if (heroDescription) {
            heroDescription.textContent = 'Discover the best movies and TV shows on MoviesAndSeriesHub.';
        }
        if (heroImage) {
            heroImage.innerHTML = `
                <div class="hero-image-placeholder">
                    <i class="fas fa-film"></i>
                </div>
            `;
        }
        return;
    }
    const titles = {
        'now_playing': 'Now Playing & Airing Today',
        'popular': 'Popular Movies & TV Shows',
        'top_rated': 'Top Rated Movies & TV Shows',
        'upcoming': 'Coming Soon & On The Air',
    };
    const name = item.title || item.name || '';
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
    const imagePath = item.backdrop_path || item.poster_path;
    if (imagePath) {
        const imageUrl = IMAGE_BASE + '/w780' + imagePath;
        heroImage.innerHTML = `
            <img src="${imageUrl}" alt="${item.title || item.name || ''}" loading="lazy" onerror="this.style.display='none'">
            <div class="movie-title-overlay">
                <h2>${item.title || item.name || ''}</h2>
                <p>${item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : ''} • ${item.vote_average ? item.vote_average.toFixed(1) + '/10' : ''}</p>
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
// Display Content
// ============================================
function displayContent(items) {
    items.forEach(function(item) {
        const card = createCard(item, item.type);
        moviesGrid.appendChild(card);
    });
}

// ============================================
// Create Card (with Movie/TV badges and rating in title for list view)
// ============================================
function createCard(item, type = 'movie') {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = item.id;
    card.dataset.type = type;

    const posterPath = item.poster_path
        ? IMAGE_BASE + '/' + POSTER_SIZE + item.poster_path
        : 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Poster';

    const name = item.title || item.name || 'Unknown';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const year = item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A';
    const safeTitle = name.replace(/'/g, "\\'");
    const inWatchlist = isInWatchlist(item.id);
    
    const stars = Math.round(item.vote_average / 2);
    const starHtml = '★'.repeat(Math.min(stars, 5)) + '☆'.repeat(Math.max(0, 5 - stars));
    const isTrending = item.vote_count > 1000;
    
    const isTv = type === 'tv';
    const typeLabel = isTv ? 'TV Show' : 'Movie';

    let badges = '';
    if (isTv) {
        badges += `<span class="badge badge-tv"><i class="fas fa-tv"></i> TV</span>`;
    } else {
        badges += `<span class="badge badge-movie"><i class="fas fa-film"></i> Movie</span>`;
    }
    if (isTrending) {
        badges += `<span class="badge badge-trending"><i class="fas fa-fire"></i> Trending</span>`;
    }

    card.innerHTML = `
        <div class="poster-wrapper">
            <img src="${posterPath}" alt="${name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/666?text=No+Poster'">
            <div class="badge-container">
                ${badges}
            </div>
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
            <div class="movie-overview-text">${item.overview || 'No description available.'}</div>
        </div>
    `;

    const watchBtn = card.querySelector('.watch-btn');
    if (watchBtn) {
        watchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const type = this.dataset.type;
            const title = this.dataset.title;
            if (type === 'tv') {
                openSeasonsModal(id, title);
            } else {
                openPlayerWithImdb(id, title);
            }
        });
    }

    card.addEventListener('click', function(e) {
        if (!e.target.closest('.watch-btn') && !e.target.closest('.watchlist-btn')) {
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
    
    const container = document.createElement('div');
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
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.remove();
}

function showSkeletons(count = 12) {
    if (!moviesGrid) return;
    hideLoadingSpinner();
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
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        showToast('You\'ve reached the end! 🎬', 'info');
    }
}

// ============================================
// SEASONS & EPISODES MODAL (TV Shows)
// ============================================

async function openSeasonsModal(tvId, tvName) {
    try {
        const url = API_BASE + '/tv/' + tvId + '?language=en-US';
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch TV show details');

        const show = await response.json();
        
        seasonsBody.innerHTML = `
            <div style="padding: 20px 32px 32px;">
                <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                    <img src="${show.poster_path ? IMAGE_BASE + '/w200' + show.poster_path : 'https://via.placeholder.com/200x300/1a1a2e/666?text=No+Poster'}" 
                         alt="${show.name}" style="width: 120px; border-radius: 8px; object-fit: cover;">
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
                    ${show.seasons.filter(s => s.season_number > 0).map(season => `
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
                    `).join('')}
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
    const list = document.getElementById(`season-${tvId}-${seasonNumber}`);
    const toggle = header.querySelector('.season-toggle i');
    
    if (list.classList.contains('open')) {
        list.classList.remove('open');
        toggle.classList.remove('open');
        return;
    }
    
    list.classList.add('open');
    toggle.classList.add('open');
    
    if (list.querySelector('.fa-spinner')) {
        try {
            const url = API_BASE + '/tv/' + tvId + '/season/' + seasonNumber + '?language=en-US';
            const response = await fetch(url, {
                headers: {
                    'Authorization': 'Bearer ' + API_KEY,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch episodes');
            
            const data = await response.json();
            const episodes = data.episodes || [];
            
            if (episodes.length === 0) {
                list.innerHTML = `<div style="text-align:center; padding:20px; color: var(--text-muted);">No episodes available</div>`;
                return;
            }
            
            list.innerHTML = episodes.map(ep => `
                <div class="episode-item" onclick="playEpisode(${tvId}, ${seasonNumber}, ${ep.episode_number}, '${ep.name.replace(/'/g, "\\'")}')">
                    <span class="episode-number">E${ep.episode_number}</span>
                    <span class="episode-name">${ep.name}</span>
                    <span class="episode-runtime">${ep.runtime ? ep.runtime + 'm' : ''}</span>
                    <span class="episode-play"><i class="fas fa-play-circle"></i></span>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading episodes:', error);
            list.innerHTML = `<div style="text-align:center; padding:20px; color: var(--primary);">Failed to load episodes</div>`;
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
    
    const title = `S${season}E${episode} - ${episodeName}`;
    
    const embedUrl = getTvEmbedUrl(null, tvId, season, episode);
    
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
async function performSearch(query, page = 1) {
    if (!searchInput) return;
    const q = query || searchInput.value.trim();
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
    
    if (page === 1) {
        showSkeletons();
    } else {
        showLoadingSpinner();
    }

    try {
        const [movieResults, tvResults] = await Promise.all([
            fetch(API_BASE + '/search/movie?query=' + encodeURIComponent(q) + '&language=en-US&page=' + currentPage, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(r => r.json()),
            fetch(API_BASE + '/search/tv?query=' + encodeURIComponent(q) + '&language=en-US&page=' + currentPage, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(r => r.json())
        ]);

        const allResults = [
            ...(movieResults.results || []).map(item => ({ ...item, type: 'movie' })),
            ...(tvResults.results || []).map(item => ({ ...item, type: 'tv' }))
        ];
        
        allResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        // Apply type filter
        const filteredResults = filterByType(allResults);

        if (page === 1) {
            moviesGrid.innerHTML = '';
            if (heroTitle) {
                heroTitle.textContent = 'Search Results: "' + q + '"';
            }
            if (heroDescription) {
                heroDescription.textContent = 'Found ' + filteredResults.length + ' results';
            }
        }

        if (filteredResults.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try a different search term.</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            displayContent(filteredResults);
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            if (page === 1) {
                showToast('Found ' + filteredResults.length + ' results for "' + q + '"', 'success');
            }
        }

        if (sectionTitle) {
            sectionTitle.textContent = 'Search Results: "' + q + '"';
        }

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
            const category = this.dataset.category;
            setActiveNav(category);
            loadContent(category);
            closeMobileMenu();
        });
    });

    document.querySelectorAll('.footer-section a[data-category]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            setActiveNav(category);
            loadContent(category);
        });
    });

    const browseBtn = document.getElementById('browseBtn');
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

    // Type Toggle Buttons
    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            currentTypeFilter = this.dataset.type;
            // Reload current content with filter
            if (isSearching) {
                performSearch(searchQuery, 1);
            } else {
                loadContent(currentCategory, 1);
            }
        });
    });

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

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

    document.getElementById('genreFilter').addEventListener('change', applyFilters);
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    window.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    if (seasonsModalClose) {
        seasonsModalClose.addEventListener('click', closeSeasonsModal);
    }
    if (seasonsModal) {
        seasonsModal.addEventListener('click', function(e) {
            if (e.target === seasonsModal) closeSeasonsModal();
        });
    }

    const playerClose = document.getElementById('playerClose');
    if (playerClose) {
        playerClose.addEventListener('click', closePlayer);
    }
    const closePlayerBtn = document.getElementById('closePlayerBtn');
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', reloadPlayer);
    }

    const trailerClose = document.getElementById('trailerClose');
    if (trailerClose) {
        trailerClose.addEventListener('click', closeTrailer);
    }
    if (trailerModal) {
        trailerModal.addEventListener('click', function(e) {
            if (e.target === trailerModal) closeTrailer();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreContent);
    }

    if (playerIframe) {
        playerIframe.addEventListener('load', hidePlayerLoading);
    }

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
        const icon = mobileMenuToggle.querySelector('i');
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
        const movieEndpoint = getMovieEndpoint(currentCategory);
        const tvEndpoint = getTvEndpoint(currentCategory);
        
        let movieUrl = API_BASE + movieEndpoint + '?language=en-US&page=' + currentPage;
        let tvUrl = API_BASE + tvEndpoint + '?language=en-US&page=' + currentPage;
        
        const genre = document.getElementById('genreFilter').value;
        const year = document.getElementById('yearFilter').value;
        const sort = document.getElementById('sortFilter').value;

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

        const [movieData, tvData] = await Promise.all([
            fetch(movieUrl, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => ({ results: [] })),
            fetch(tvUrl, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => ({ results: [] }))
        ]);

        const combinedResults = [
            ...(movieData.results || []).map(item => ({ ...item, type: 'movie' })),
            ...(tvData.results || []).map(item => ({ ...item, type: 'tv' }))
        ];
        
        combinedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        // Apply type filter
        const filteredResults = filterByType(combinedResults);

        const totalPagesMovie = movieData.total_pages || 1;
        const totalPagesTv = tvData.total_pages || 1;
        totalPages = Math.max(totalPagesMovie, totalPagesTv);

        if (currentPage === 1) {
            moviesGrid.innerHTML = '';
            if (heroTitle) {
                heroTitle.textContent = 'Filtered Results';
            }
        }

        if (filteredResults.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-filter"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your filters.</p>
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
            sectionTitle.textContent = 'Filtered Results';
        }

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
        const url = API_BASE + '/movie/' + movieId + '?language=en-US';

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

        const movie = await response.json();
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

        const embedUrl = getEmbedUrl(imdbId, movieId, 'movie');

        if (!embedUrl) {
            throw new Error('No embed providers available');
        }

        if (playerTitle) playerTitle.textContent = movieTitle || movie.title;
        if (playerIframe) playerIframe.src = embedUrl;

        if (playerModal) {
            playerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

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
// Watchlist Functions
// ============================================
function loadWatchlist() {
    try {
        watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    } catch {
        watchlist = [];
    }
}

function toggleWatchlist(id) {
    const index = watchlist.indexOf(id);
    
    if (index === -1) {
        watchlist.push(id);
        showToast('Added to watchlist! ❤️', 'success');
    } else {
        watchlist.splice(index, 1);
        showToast('Removed from watchlist', 'info');
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    document.querySelectorAll('.watchlist-btn[data-id="' + id + '"]').forEach(function(btn) {
        const inList = watchlist.includes(id);
        btn.innerHTML = inList ? 
            '<i class="fas fa-check"></i> In Watchlist' : 
            '<i class="fas fa-plus"></i> Add to Watchlist';
        btn.style.color = inList ? '#46d369' : '';
    });
}

function isInWatchlist(id) {
    return watchlist.includes(id);
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

function saveWatchHistory(id, title, progress = 0) {
    watchHistory[id] = {
        id: id,
        title: title,
        progress: progress,
        lastWatched: Date.now(),
        watched: progress >= 95
    };
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
}

function getWatchProgress(id) {
    return watchHistory[id]?.progress || 0;
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
            closeSeasonsModal();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        
        if (e.key === 'f' && playerModal?.classList.contains('active')) {
            e.preventDefault();
            toggleFullscreen();
        }
        
        if (e.key === 'r' && playerModal?.classList.contains('active')) {
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