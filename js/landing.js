// js/landing.js — Landing page logic
// Requires js/config.js (API_BASE, API_KEY, IMAGE_BASE)

const REDIRECT_SECONDS = 6;
let countdownTimer = null;
let redirectTimeout = null;
let hasEntered = false;

document.addEventListener('DOMContentLoaded', function() {
    loadTrendingBackdrop();
    startCountdown();

    document.getElementById('landingEnterBtn').addEventListener('click', enterSite);

    // Cancel timer if user interacts with anything
    document.addEventListener('click', function() {
        if (!hasEntered) clearTimers();
    }, { capture: true });

    window.addEventListener('pagehide', clearTimers);
});

function clearTimers() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (redirectTimeout) { clearTimeout(redirectTimeout); redirectTimeout = null; }
}

function enterSite() {
    if (hasEntered) return;
    hasEntered = true;
    clearTimers();
    localStorage.setItem('landingSeen', 'true');
    window.location.href = 'index.html';
}

function startCountdown() {
    let remaining = REDIRECT_SECONDS;
    const el = document.getElementById('landingCountdown');

    countdownTimer = setInterval(function() {
        remaining--;
        if (el) el.textContent = Math.max(remaining, 0);
        if (remaining <= 0) clearInterval(countdownTimer);
    }, 1000);

    redirectTimeout = setTimeout(enterSite, REDIRECT_SECONDS * 1000);
}

async function loadTrendingBackdrop() {
    try {
        const res = await fetch(API_BASE + '/trending/all/week?language=en-US', {
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error('TMDB ' + res.status);
        const data = await res.json();
        const items = (data.results || []).slice(0, 8);

        // Set hero backdrop
        if (items.length > 0 && items[0].backdrop_path) {
            const backdrop = document.getElementById('landingBackdrop');
            backdrop.style.backgroundImage = `url(${IMAGE_BASE}/w1280${items[0].backdrop_path})`;
        }

        // Render trending strip
        renderTrending(items);
    } catch (e) {
        console.warn('Landing: trending fetch failed', e);
    }
}

function renderTrending(items) {
    const grid = document.getElementById('landingTrendingGrid');
    if (!grid || items.length === 0) return;

    const placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22%3E%3Crect fill=%22%231a1a2e%22 width=%22300%22 height=%22450%22/%3E%3Ctext x=%22150%22 y=%22225%22 fill=%22%23666%22 font-family=%22Arial%22 font-size=%2218%22 text-anchor=%22middle%22%3ENo Poster%3C/text%3E%3C/svg%3E';

    grid.innerHTML = items.map(function(item) {
        const poster = item.poster_path
            ? IMAGE_BASE + '/w300' + item.poster_path
            : placeholder;
        const title = (item.title || item.name || '').replace(/"/g, '&quot;');
        return '<div class="landing-trending-card">' +
            '<img src="' + poster + '" alt="' + title + '" loading="lazy" ' +
            'onerror="this.src=\'' + placeholder + '\'">' +
            '</div>';
    }).join('');
}