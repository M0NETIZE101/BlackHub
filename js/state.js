// ============================================
// MoviesAndSeriesHub - State Management
// ============================================

// ----- State Variables -----
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

// ----- DOM Elements (will be populated in main.js) -----
let DOM = {};

// ----- Export State -----
window.AppState = {
    get currentCategory() { return currentCategory; },
    set currentCategory(value) { currentCategory = value; },
    get currentPage() { return currentPage; },
    set currentPage(value) { currentPage = value; },
    get totalPages() { return totalPages; },
    set totalPages(value) { totalPages = value; },
    get currentView() { return currentView; },
    set currentView(value) { currentView = value; },
    get isLoading() { return isLoading; },
    set isLoading(value) { isLoading = value; },
    get searchQuery() { return searchQuery; },
    set searchQuery(value) { searchQuery = value; },
    get isSearching() { return isSearching; },
    set isSearching(value) { isSearching = value; },
    get watchlist() { return watchlist; },
    set watchlist(value) { watchlist = value; },
    get watchHistory() { return watchHistory; },
    set watchHistory(value) { watchHistory = value; },
    get currentTypeFilter() { return currentTypeFilter; },
    set currentTypeFilter(value) { currentTypeFilter = value; },
    get genreMap() { return genreMap; },
    set genreMap(value) { genreMap = value; },
    get genreList() { return genreList; },
    set genreList(value) { genreList = value; },
    get DOM() { return DOM; },
    set DOM(value) { DOM = value; }
};