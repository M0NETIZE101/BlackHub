// ============================================
// MoviesAndSeriesHub - Filter Functions
// ============================================

// ----- Populate Genre Dropdown -----
function populateGenreDropdown() {
    var state = window.AppState;
    if (!state.DOM.genreFilter) return;
    state.DOM.genreFilter.innerHTML = '<option value="all">All Genres</option>';
    state.genreList.forEach(function(genre) {
        var option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        state.DOM.genreFilter.appendChild(option);
    });
    console.log('✅ Genre dropdown populated with', state.genreList.length, 'genres');
}

// ----- Apply Filters -----
function applyFilters() {
    var state = window.AppState;
    state.currentPage = 1;
    loadContentWithFilters();
}

// ----- Load Content with Filters -----
async function loadContentWithFilters() {
    var state = window.AppState;
    if (state.isLoading) return;
    state.isLoading = true;
    showSkeletons();

    try {
        var movieEndpoint = getMovieEndpoint(state.currentCategory);
        var tvEndpoint = getTvEndpoint(state.currentCategory);
        var movieUrl = API_BASE + movieEndpoint + '?language=en-US&page=' + state.currentPage;
        var tvUrl = API_BASE + tvEndpoint + '?language=en-US&page=' + state.currentPage;
        
        var genre = state.DOM.genreFilter.value;
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
        state.totalPages = Math.max(totalPagesMovie, totalPagesTv);

        if (state.currentPage === 1) {
            state.DOM.moviesGrid.innerHTML = '';
            if (state.DOM.heroTitle) state.DOM.heroTitle.textContent = 'Filtered Results';
        }

        if (filteredResults.length === 0) {
            state.DOM.moviesGrid.innerHTML = '<div class="no-results"><i class="fas fa-filter"></i><h3>No results found</h3><p>Try adjusting your filters.</p></div>';
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
        if (state.DOM.sectionTitle) state.DOM.sectionTitle.textContent = 'Filtered Results';
        applyView();
    } catch (error) {
        console.error('Error loading filtered content:', error);
        showToast('Failed to load content. Please try again.', 'error');
    } finally {
        state.isLoading = false;
    }
}