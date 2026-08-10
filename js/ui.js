// ============================================
// MoviesAndSeriesHub - UI Functions
// ============================================

// ----- Update Hero (Combined) -----
function updateCombinedHero(category, item) {
    var state = window.AppState;
    var DOM = state.DOM;
    
    if (!item) {
        if (DOM.heroTitle) DOM.heroTitle.textContent = 'Welcome to MoviesAndSeriesHub';
        if (DOM.heroDescription) DOM.heroDescription.textContent = 'Discover the best movies and TV shows on MoviesAndSeriesHub.';
        if (DOM.heroImage) {
            DOM.heroImage.innerHTML = '<div class="hero-image-placeholder"><i class="fas fa-film"></i></div>';
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
    if (DOM.heroTitle) {
        DOM.heroTitle.textContent = (titles[category] || 'Movies & TV') + ' - ' + name;
    }
    if (DOM.heroDescription) {
        DOM.heroDescription.textContent = item.overview || 'Discover the best movies and TV shows on MoviesAndSeriesHub.';
    }
    updateHeroImage(item);
}

function updateHeroImage(item) {
    var DOM = window.AppState.DOM;
    if (!DOM.heroImage) return;
    var imagePath = item.backdrop_path || item.poster_path;
    if (imagePath) {
        var imageUrl = IMAGE_BASE + '/w780' + imagePath;
        DOM.heroImage.innerHTML = `
            <img src="${imageUrl}" alt="${item.title || item.name || ''}" loading="lazy" onerror="this.style.display='none'">
            <div class="movie-title-overlay">
                <h2>${item.title || item.name || ''}</h2>
                <p>${item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : ''} • ${item.vote_average ? item.vote_average.toFixed(1) + '/10' : ''}</p>
            </div>
        `;
    } else {
        DOM.heroImage.innerHTML = '<div class="hero-image-placeholder"><i class="fas fa-film"></i></div>';
    }
}

// ----- Display Content -----
function displayContent(items) {
    var DOM = window.AppState.DOM;
    items.forEach(function(item) {
        var card = createCard(item, item.type);
        DOM.moviesGrid.appendChild(card);
    });
}

// ----- Loading Functions -----
function showLoadingSpinner() {
    hideLoadingSpinner();
    var DOM = window.AppState.DOM;
    var container = document.createElement('div');
    container.className = 'loading-spinner-container';
    container.id = 'loadingSpinner';
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
    DOM.moviesGrid.appendChild(container);
}

function hideLoadingSpinner() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.remove();
}

function showSkeletons(count) {
    if (count === undefined) count = 12;
    var DOM = window.AppState.DOM;
    if (!DOM.moviesGrid) return;
    hideLoadingSpinner();
    DOM.moviesGrid.innerHTML = '';
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
        DOM.moviesGrid.appendChild(skeleton);
    }
}

// ----- Apply View -----
function applyView() {
    var state = window.AppState;
    if (state.DOM.moviesGrid) {
        state.DOM.moviesGrid.className = 'movies-grid ' + state.currentView + '-view';
    }
}

// ----- Set Active Navigation -----
function setActiveNav(category) {
    var state = window.AppState;
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    state.currentCategory = category;
    state.isSearching = false;
    state.searchQuery = '';
    if (state.DOM.searchInput) state.DOM.searchInput.value = '';
    state.currentPage = 1;
    if (state.DOM.loadMoreBtn) {
        state.DOM.loadMoreBtn.style.display = 'inline-flex';
        state.DOM.loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
        state.DOM.loadMoreBtn.disabled = false;
        state.DOM.loadMoreBtn.classList.remove('loading');
    }
}

// ----- Close Mobile Menu -----
function closeMobileMenu() {
    var state = window.AppState;
    if (state.DOM.navLinks) state.DOM.navLinks.classList.remove('open');
    if (state.DOM.mobileMenuToggle) {
        var icon = state.DOM.mobileMenuToggle.querySelector('i');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    }
}