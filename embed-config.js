// ============================================
// MoviesHub - Embed Configuration
// ============================================

const EMBED_PROVIDERS = {
    primary: {
        name: 'Autoembed',
        baseUrl: 'https://autoembed.co/movie/imdb/',
        type: 'imdb',
        enabled: true,
    },
    fallbacks: [
        {
            name: 'VidSrc',
            baseUrl: 'https://vidsrc.to/embed/movie/',
            type: 'tmdb',
            enabled: true,
        },
        {
            name: '2Embed',
            baseUrl: 'https://www.2embed.cc/embed/movie/',
            type: 'tmdb',
            enabled: true,
        },
        {
            name: 'VidLink',
            baseUrl: 'https://vidlink.pro/movie/',
            type: 'tmdb',
            enabled: true,
        },
        {
            name: 'VidFast',
            baseUrl: 'https://vidfast.co/embed/movie/',
            type: 'tmdb',
            enabled: true,
        },
    ],
    customOverrides: {},
};

// ============================================
// TV Show URL Builders
// ============================================

function getTvEmbedUrl(imdbId, tmdbId, season, episode) {
    // Try primary provider first
    const primary = EMBED_PROVIDERS.primary;
    if (primary.enabled) {
        // Autoembed doesn't support TV shows, so skip if primary is Autoembed
        if (primary.name === 'Autoembed') {
            // Try fallbacks for TV shows
            for (const provider of EMBED_PROVIDERS.fallbacks) {
                if (provider.enabled) {
                    const url = buildTvUrl(provider, tmdbId, season, episode);
                    if (url) return url;
                }
            }
        } else {
            const id = primary.type === 'imdb' ? imdbId : tmdbId;
            if (id) {
                return buildTvUrl(primary, tmdbId, season, episode) || primary.baseUrl + id;
            }
        }
    }

    // Try all fallbacks
    for (const provider of EMBED_PROVIDERS.fallbacks) {
        if (provider.enabled) {
            const url = buildTvUrl(provider, tmdbId, season, episode);
            if (url) return url;
        }
    }

    return null;
}

function buildTvUrl(provider, tmdbId, season, episode) {
    if (!tmdbId || !season || !episode) return null;

    const name = provider.name.toLowerCase();
    let baseUrl = provider.baseUrl;

    // Handle different provider formats
    if (name.includes('vidsrc')) {
        return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
    }
    if (name.includes('2embed')) {
        return `https://www.2embed.cc/embedtv/${tmdbId}/${season}/${episode}`;
    }
    if (name.includes('vidlink')) {
        return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
    }
    if (name.includes('vidfast')) {
        return `https://vidfast.co/embed/tv/${tmdbId}/${season}/${episode}`;
    }
    if (name.includes('autoembed')) {
        // Autoembed doesn't support TV shows directly
        return null;
    }

    // Fallback: try to construct URL
    return `${baseUrl}tv/${tmdbId}/${season}/${episode}`;
}

// ============================================
// Get Embed URL (Unified)
// ============================================

function getEmbedUrl(imdbId, tmdbId, type = 'movie', season = null, episode = null) {
    // Check for custom override first
    if (imdbId && EMBED_PROVIDERS.customOverrides[imdbId]) {
        return EMBED_PROVIDERS.customOverrides[imdbId];
    }

    // TV Show support
    if (type === 'tv' && season && episode) {
        return getTvEmbedUrl(imdbId, tmdbId, season, episode);
    }

    // Movie support
    const primary = EMBED_PROVIDERS.primary;
    if (primary.enabled) {
        const id = primary.type === 'imdb' ? imdbId : tmdbId;
        if (id) {
            return primary.baseUrl + id;
        }
    }

    for (const provider of EMBED_PROVIDERS.fallbacks) {
        if (provider.enabled) {
            const id = provider.type === 'imdb' ? imdbId : tmdbId;
            if (id) {
                return provider.baseUrl + id;
            }
        }
    }

    return null;
}

// ============================================
// Get Enabled Providers
// ============================================

function getEnabledProviders() {
    const providers = [];
    
    if (EMBED_PROVIDERS.primary.enabled) {
        providers.push({
            ...EMBED_PROVIDERS.primary,
            isPrimary: true,
        });
    }
    
    EMBED_PROVIDERS.fallbacks.forEach(p => {
        if (p.enabled) {
            providers.push({
                ...p,
                isPrimary: false,
            });
        }
    });
    
    return providers;
}

// ============================================
// Save / Load Configuration
// ============================================

function saveEmbedConfig(config) {
    try {
        localStorage.setItem('embedConfig', JSON.stringify(config));
        Object.assign(EMBED_PROVIDERS, config);
        return true;
    } catch (e) {
        console.error('Error saving config:', e);
        return false;
    }
}

function loadEmbedConfig() {
    try {
        const saved = localStorage.getItem('embedConfig');
        if (saved) {
            const config = JSON.parse(saved);
            Object.assign(EMBED_PROVIDERS, config);
            return true;
        }
    } catch (e) {
        console.error('Error loading embed config:', e);
    }
    return false;
}

// ============================================
// Initialize
// ============================================

loadEmbedConfig();

// ============================================
// Exports
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EMBED_PROVIDERS,
        getEmbedUrl,
        getTvEmbedUrl,
        getEnabledProviders,
        saveEmbedConfig,
        loadEmbedConfig,
    };
}

// Make globally available
window.EMBED_PROVIDERS = EMBED_PROVIDERS;
window.getEmbedUrl = getEmbedUrl;
window.getTvEmbedUrl = getTvEmbedUrl;
window.getEnabledProviders = getEnabledProviders;
window.saveEmbedConfig = saveEmbedConfig;
window.loadEmbedConfig = loadEmbedConfig;

console.log('✅ Embed config loaded with TV Show support!');