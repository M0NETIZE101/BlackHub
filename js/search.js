// ============================================
// MoviesAndSeriesHub - Search Functions
// ============================================

// ----- Perform Search -----
async function performSearch(query, page) {
    if (page === undefined) page = 1;
    var state = window.AppState;
    if (!state.DOM.searchInput) return;
    var q = query || state.DOM.searchInput.value.trim();
    if (!q) {
        state.isSearching = false;
        loadContent(state.currentCategory);
        return;
    }

    state.isSearching = true;
    state.searchQuery = q;
    state.currentPage = page || 1;
    if (state.isLoading) return;
    state.isLoading = true;
    if (page === 1) showSkeletons(); else showLoadingSpinner();

    try {
        var [movieResults, tvResults] = await Promise.all([
            fetch(API_BASE + '/search/movie?query=' + encodeURIComponent(q) + '&language=en-US&page=' + state.currentPage, {
                headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
            }).then(function(r) { return r.json(); }),
            fetch(API_BASE + '/search/tv?query=' + encodeURIComponent(q) + '&language=en-US&page=' + state.currentPage, {
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
            state.DOM.moviesGrid.innerHTML = '';
            if (state.DOM.heroTitle) state.DOM.heroTitle.textContent = 'Search Results: "' + q + '"';
            if (state.DOM.heroDescription) state.DOM.heroDescription.textContent = 'Found ' + filteredResults.length + ' results';
        }

        if (filteredResults.length === 0) {
            state.DOM.moviesGrid.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><h3>No results found</h3><p>Try a different search term.</p></div>';
            if (state.DOM.loadMoreBtn) state.DOM.loadMoreBtn.style.display = 'none';
        } else {
            displayContent(filteredResults);
            if (state.DOM.loadMoreBtn) state.DOM.loadMoreBtn.style.display = 'none';
            if (page === 1) showToast('Found ' + filteredResults.length + ' results for "' + q + '"', 'success');
        }

        if (state.DOM.sectionTitle) state.DOM.sectionTitle.textContent = 'Search Results: "' + q + '"';
        applyView();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Failed to search. Please try again.', 'error');
        hideLoadingSpinner();
    } finally {
        state.isLoading = false;
    }
}