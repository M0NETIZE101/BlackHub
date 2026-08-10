// ============================================
// MoviesAndSeriesHub - API Functions
// ============================================

// ----- Get Endpoints for Movies and TV Shows -----
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

// ----- Load Genres from TMDB -----
async function loadGenresFromTMDB() {
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
            movieGenres.genres.forEach(function(g) { allGenres[g.id] = g.name; });
        }
        if (tvGenres.genres) {
            tvGenres.genres.forEach(function(g) { allGenres[g.id] = g.name; });
        }

        var state = window.AppState;
        state.genreMap = allGenres;
        state.genreList = Object.keys(allGenres).map(function(id) {
            return { id: parseInt(id), name: allGenres[id] };
        }).sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

        console.log('✅ Genres loaded from TMDB:', state.genreList.length);
        return true;

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
        var state = window.AppState;
        fallbackGenres.forEach(function(g) { state.genreMap[g.id] = g.name; });
        state.genreList = fallbackGenres;
        return false;
    }
}

// ----- Load Combined Content (Movies + TV Shows) -----
async function loadContent(category, page) {
    if (page === undefined) page = 1;
    var state = window.AppState;
    if (state.isLoading) return;
    state.isLoading = true;
    
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
        state.totalPages = Math.max(totalPagesMovie, totalPagesTv);

        if (page === 1) {
            state.DOM.moviesGrid.innerHTML = '';
            updateCombinedHero(category, filteredResults[0]);
        }

        if (filteredResults.length === 0) {
            state.DOM.moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try changing your filters.</p>
                </div>
            `;
            if (state.DOM.loadMoreBtn) state.DOM.loadMoreBtn.style.display = 'none';
        } else {
            displayContent(filteredResults);
            if (state.DOM.loadMoreBtn) {
                if (state.currentPage < state.totalPages) {
                    state.DOM.loadMoreBtn.style.display = 'inline-flex';
                    state.DOM.loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
                    state.DOM.loadMoreBtn.disabled = false;
                    state.DOM.loadMoreBtn.classList.remove('loading');
                } else {
                    state.DOM.loadMoreBtn.style.display = 'none';
                }
            }
        }

        if (state.DOM.sectionTitle) {
            state.DOM.sectionTitle.textContent = getCombinedCategoryTitle(category);
        }

        applyView();
        hideLoadingSpinner();
        renderContinueWatching();

    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Failed to load content. Please try again.', 'error');
        hideLoadingSpinner();
        
        if (page === 1) {
            state.DOM.moviesGrid.innerHTML = `
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
        state.isLoading = false;
    }
}

// ----- Filter by type -----
function filterByType(items) {
    var state = window.AppState;
    if (state.currentTypeFilter === 'all') return items;
    return items.filter(function(item) {
        return item.type === state.currentTypeFilter;
    });
}