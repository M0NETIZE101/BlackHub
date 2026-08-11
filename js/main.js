// ============================================
// MoviesAndSeriesHub - Main Entry Point
// ============================================

// ----- DOM Elements -----
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 MoviesAndSeriesHub initializing...');
    
    // ----- Initialize DOM references -----
    var DOM = {
        moviesGrid: document.getElementById('moviesGrid'),
        sectionTitle: document.getElementById('sectionTitle'),
        loadMoreBtn: document.getElementById('loadMoreBtn'),
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        heroTitle: document.getElementById('heroTitle'),
        heroDescription: document.getElementById('heroDescription'),
        heroImage: document.getElementById('heroImage'),
        modal: document.getElementById('movieModal'),
        modalBody: document.getElementById('modalBody'),
        seasonsModal: document.getElementById('seasonsModal'),
        seasonsBody: document.getElementById('seasonsBody'),
        seasonsModalClose: document.getElementById('seasonsModalClose'),
        playerModal: document.getElementById('playerModal'),
        playerIframe: document.getElementById('playerIframe'),
        playerTitle: document.getElementById('playerTitle'),
        playerLoading: document.getElementById('playerLoading'),
        trailerModal: document.getElementById('trailerModal'),
        trailerIframe: document.getElementById('trailerIframe'),
        themeToggle: document.getElementById('themeToggle'),
        mobileMenuToggle: document.getElementById('mobileMenuToggle'),
        navLinks: document.getElementById('navLinks'),
        backToTop: document.getElementById('backToTop'),
        mobileBottomNav: document.getElementById('mobileBottomNav'),
        mobileSearchToggle: document.getElementById('mobileSearchToggle'),
        genreFilter: document.getElementById('genreFilter')
    };
    
    window.AppState.DOM = DOM;
    
    // ----- Load data & initialize -----
    loadWatchlist();
    loadWatchHistory();
    loadTheme();
    loadViewPreference();
    
    // Load genres then content
    loadGenresFromTMDB().then(function() {
        populateGenreDropdown();
        loadContent('now_playing');
    });
    
    // ----- Setup event listeners -----
    setupEventListeners();
    setupScrollListener();
    setupKeyboardShortcuts();
    renderContinueWatching();
    
    // ----- Load more button initial state -----
    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.style.display = 'none';
    }
});

// ----- Setup Event Listeners (FIXED) -----
function setupEventListeners() {
    var state = window.AppState;
    var DOM = state.DOM;
    
    // ----- Desktop Navigation Links -----
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var category = this.dataset.category;
            if (category) {
                setActiveNav(category);
                loadContent(category);
                closeMobileMenu();
            }
        });
    });

    // ----- Footer Category Links -----
    document.querySelectorAll('.footer-section a[data-category]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var category = this.dataset.category;
            setActiveNav(category);
            loadContent(category);
        });
    });

    // ----- Mobile Bottom Navigation -----
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

    // ----- Mobile Search Toggle -----
    if (DOM.mobileSearchToggle) {
        DOM.mobileSearchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            if (DOM.searchInput) {
                DOM.searchInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ----- Browse Button -----
    var browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', function() {
            document.querySelector('.movies-section').scrollIntoView({ behavior: 'smooth' });
            loadContent('now_playing');
        });
    }

    // ----- Search -----
    if (DOM.searchBtn) {
        DOM.searchBtn.addEventListener('click', performSearch);
    }
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
        DOM.searchInput.addEventListener('input', function(e) {
            if (this.value === '') {
                state.isSearching = false;
                loadContent(state.currentCategory);
            }
        });
    }

    // ----- View Toggle -----
    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            state.currentView = this.dataset.view;
            applyView();
            localStorage.setItem('preferredView', state.currentView);
        });
    });

    // ----- Type Toggle -----
    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            state.currentTypeFilter = this.dataset.type;
            if (state.isSearching) {
                performSearch(state.searchQuery, 1);
            } else {
                loadContent(state.currentCategory, 1);
            }
        });
    });

    // ----- Theme Toggle -----
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', toggleTheme);
    }

    // ----- Mobile Menu Toggle -----
    if (DOM.mobileMenuToggle) {
        DOM.mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            DOM.navLinks.classList.toggle('open');
            var icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        document.addEventListener('click', function(e) {
            if (!DOM.navLinks.contains(e.target) && !DOM.mobileMenuToggle.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }

    // ----- Filters -----
    if (DOM.genreFilter) {
        DOM.genreFilter.addEventListener('change', applyFilters);
    }
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

    // ----- Modals -----
    var modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    window.addEventListener('click', function(e) {
        if (e.target === DOM.modal) {
            closeModal();
        }
    });

    if (DOM.seasonsModalClose) {
        DOM.seasonsModalClose.addEventListener('click', closeSeasonsModal);
    }
    if (DOM.seasonsModal) {
        DOM.seasonsModal.addEventListener('click', function(e) {
            if (e.target === DOM.seasonsModal) {
                closeSeasonsModal();
            }
        });
    }

    // ----- Player -----
    var playerClose = document.getElementById('playerClose');
    if (playerClose) {
        playerClose.addEventListener('click', closePlayer);
    }
    var closePlayerBtn = document.getElementById('closePlayerBtn');
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }

    var fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    var reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', reloadPlayer);
    }

    // ----- Trailer -----
    var trailerClose = document.getElementById('trailerClose');
    if (trailerClose) {
        trailerClose.addEventListener('click', closeTrailer);
    }
    if (DOM.trailerModal) {
        DOM.trailerModal.addEventListener('click', function(e) {
            if (e.target === DOM.trailerModal) {
                closeTrailer();
            }
        });
    }

    // ----- Load More -----
    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.addEventListener('click', loadMoreContent);
    }
    
    // ----- Player Iframe Load -----
    if (DOM.playerIframe) {
        DOM.playerIframe.addEventListener('load', hidePlayerLoading);
    }
    
    // ----- Back to Top -----
    if (DOM.backToTop) {
        DOM.backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ----- Social Links -----
    setupSocialLinks();
}

// ----- Set Active Navigation (Desktop + Mobile) (FIXED) -----
function setActiveNav(category) {
    var state = window.AppState;
    
    // Desktop nav
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.classList.toggle('active', link.dataset.category === category);
    });
    
    // Mobile bottom nav (only for category links, not search)
    document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
        if (link.dataset.category) {
            link.classList.toggle('active', link.dataset.category === category);
        }
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
    var DOM = window.AppState.DOM;
    if (DOM.navLinks) DOM.navLinks.classList.remove('open');
    if (DOM.mobileMenuToggle) {
        var icon = DOM.mobileMenuToggle.querySelector('i');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    }
}

// ----- Load More -----
async function loadMoreContent() {
    var state = window.AppState;
    if (state.isLoading) return;
    
    if (state.currentPage < state.totalPages) {
        state.currentPage++;
        
        if (state.DOM.loadMoreBtn) {
            state.DOM.loadMoreBtn.disabled = true;
            state.DOM.loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            state.DOM.loadMoreBtn.classList.add('loading');
        }
        
        if (state.isSearching) {
            await performSearch(state.searchQuery, state.currentPage);
        } else {
            await loadContent(state.currentCategory, state.currentPage);
        }
        
        if (state.DOM.loadMoreBtn) {
            state.DOM.loadMoreBtn.disabled = false;
            state.DOM.loadMoreBtn.classList.remove('loading');
            if (state.currentPage < state.totalPages) {
                state.DOM.loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
            } else {
                state.DOM.loadMoreBtn.style.display = 'none';
                showToast('You have reached the end! 🎬', 'info');
            }
        }
    } else {
        if (state.DOM.loadMoreBtn) {
            state.DOM.loadMoreBtn.style.display = 'none';
        }
        showToast('You have reached the end! 🎬', 'info');
    }
}

// ----- Load View Preference -----
function loadViewPreference() {
    var state = window.AppState;
    var savedView = localStorage.getItem('preferredView');
    if (savedView && (savedView === 'grid' || savedView === 'list')) {
        state.currentView = savedView;
        document.querySelectorAll('.view-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.view === savedView);
        });
        applyView();
    }
}