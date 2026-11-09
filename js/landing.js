// ============================================
// Landing page logic — no auto-redirect
// Search + Watch Now only
// ============================================

let hasEntered = false;

document.addEventListener('DOMContentLoaded', function() {
    loadTrendingBackdrop();

    // Watch Now
    var enterBtn = document.getElementById('landingEnterBtn');
    if (enterBtn) enterBtn.addEventListener('click', function() { enterSite(); });

    // Search
    setupSearch();
});

// ============================================
// Navigate to home (optionally with search query)
// ============================================
function enterSite(query) {
    if (hasEntered) return;
    hasEntered = true;
    localStorage.setItem('landingSeen', 'true');

    if (query && query.trim()) {
        window.location.href = 'index.html?search=' + encodeURIComponent(query.trim());
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// Search: desktop always-visible, mobile icon→expand
// ============================================
function setupSearch() {
    var searchBox = document.getElementById('landingSearchBox');
    var searchIconBtn = document.getElementById('landingSearchIconBtn');
    var searchCloseBtn = document.getElementById('landingSearchCloseBtn');
    var searchInput = document.getElementById('landingSearchInput');

    if (!searchBox || !searchInput) return;

    // Enter key → search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            enterSite(searchInput.value);
        }
    });

    // Mobile: open search
    if (searchIconBtn) {
        searchIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            searchBox.classList.add('expanded');
            setTimeout(function() { searchInput.focus(); }, 60);
        });
    }

    // Mobile: close search
    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            collapseSearch();
        });
    }

    // Collapse on outside click if empty
    document.addEventListener('click', function(e) {
        if (!searchBox.classList.contains('expanded')) return;
        if (searchBox.contains(e.target)) return;
        if (searchInput.value.trim() !== '') return;
        collapseSearch();
    });

    // Escape → collapse
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchBox.classList.contains('expanded')) {
            collapseSearch();
        }
    });

    function collapseSearch() {
        searchBox.classList.remove('expanded');
        searchInput.value = '';
        searchInput.blur();
    }
}

// ============================================
// Trending backdrop + grid
// ============================================
async function loadTrendingBackdrop() {
    try {
        var res = await fetch(API_BASE + '/trending/all/week?language=en-US', {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error('TMDB ' + res.status);
        var data = await res.json();
        var items = (data.results || []).slice(0, 8);

        if (items.length > 0 && items[0].backdrop_path) {
            var backdrop = document.getElementById('landingBackdrop');
            if (backdrop) {
                backdrop.style.backgroundImage = 'url(' + IMAGE_BASE + '/w1280' + items[0].backdrop_path + ')';
            }
        }

        renderTrending(items);
    } catch (e) {
        console.warn('Landing: trending fetch failed', e);
    }
}

function renderTrending(items) {
    var grid = document.getElementById('landingTrendingGrid');
    if (!grid || items.length === 0) return;

    var placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22%3E%3Crect fill=%22%231a1a2e%22 width=%22300%22 height=%22450%22/%3E%3Ctext x=%22150%22 y=%22225%22 fill=%22%23666%22 font-family=%22Arial%22 font-size=%2218%22 text-anchor=%22middle%22%3ENo Poster%3C/text%3E%3C/svg%3E';

    grid.innerHTML = items.map(function(item) {
        var poster = item.poster_path
            ? IMAGE_BASE + '/w300' + item.poster_path
            : placeholder;
        var title = (item.title || item.name || '').replace(/"/g, '&quot;');
        return '<div class="landing-trending-card">' +
            '<img src="' + poster + '" alt="' + title + '" loading="lazy" ' +
            'onerror="this.src=\'' + placeholder + '\'">' +
            '</div>';
    }).join('');
}
