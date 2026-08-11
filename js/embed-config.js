// ============================================
// MoviesAndSeriesHub - Embed Configuration
// ============================================

const EMBED_PROVIDERS = {
    primary: {
        name: 'VidLink',
        baseUrl: 'https://vidlink.pro/movie/',
        type: 'tmdb',
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
            name: 'VidFast',
            baseUrl: 'https://vidfast.co/embed/movie/',
            type: 'tmdb',
            enabled: true,
        },
        {
            name: 'Autoembed',
            baseUrl: 'https://autoembed.co/movie/imdb/',
            type: 'imdb',
            enabled: true,
        },
    ],
    customOverrides: {},
};

// ============================================
// TV Show URL Builders
// ============================================

function getTvEmbedUrl(imdbId, tmdbId, season, episode) {
    var primary = EMBED_PROVIDERS.primary;
    if (primary.enabled) {
        if (primary.name === 'VidSrc' || primary.name === 'Autoembed') {
            for (var i = 0; i < EMBED_PROVIDERS.fallbacks.length; i++) {
                var provider = EMBED_PROVIDERS.fallbacks[i];
                if (provider.enabled) {
                    var url = buildTvUrl(provider, tmdbId, season, episode);
                    if (url) return url;
                }
            }
        } else {
            var id = primary.type === 'imdb' ? imdbId : tmdbId;
            if (id) {
                return buildTvUrl(primary, tmdbId, season, episode) || primary.baseUrl + id;
            }
        }
    }

    for (var j = 0; j < EMBED_PROVIDERS.fallbacks.length; j++) {
        var fallback = EMBED_PROVIDERS.fallbacks[j];
        if (fallback.enabled) {
            var fallbackUrl = buildTvUrl(fallback, tmdbId, season, episode);
            if (fallbackUrl) return fallbackUrl;
        }
    }

    return null;
}

function buildTvUrl(provider, tmdbId, season, episode) {
    if (!tmdbId || !season || !episode) return null;
    var name = provider.name.toLowerCase();

    if (name.includes('vidsrc')) {
        return 'https://vidsrc.to/embed/tv/' + tmdbId + '/' + season + '/' + episode;
    }
    if (name.includes('2embed')) {
        return 'https://www.2embed.cc/embedtv/' + tmdbId + '/' + season + '/' + episode;
    }
    if (name.includes('vidlink')) {
        return 'https://vidlink.pro/tv/' + tmdbId + '/' + season + '/' + episode;
    }
    if (name.includes('vidfast')) {
        return 'https://vidfast.co/embed/tv/' + tmdbId + '/' + season + '/' + episode;
    }
    if (name.includes('autoembed')) {
        return null;
    }

    return provider.baseUrl + 'tv/' + tmdbId + '/' + season + '/' + episode;
}

// ============================================
// Get Embed URL (Unified)
// ============================================

function getEmbedUrl(imdbId, tmdbId, type, season, episode) {
    if (type === undefined) type = 'movie';
    
    if (imdbId && EMBED_PROVIDERS.customOverrides[imdbId]) {
        return EMBED_PROVIDERS.customOverrides[imdbId];
    }

    if (type === 'tv' && season && episode) {
        return getTvEmbedUrl(imdbId, tmdbId, season, episode);
    }

    var primary = EMBED_PROVIDERS.primary;
    if (primary.enabled) {
        var id = primary.type === 'imdb' ? imdbId : tmdbId;
        if (id) {
            return primary.baseUrl + id;
        }
    }

    for (var i = 0; i < EMBED_PROVIDERS.fallbacks.length; i++) {
        var provider = EMBED_PROVIDERS.fallbacks[i];
        if (provider.enabled) {
            var fallbackId = provider.type === 'imdb' ? imdbId : tmdbId;
            if (fallbackId) {
                return provider.baseUrl + fallbackId;
            }
        }
    }

    return null;
}

// ============================================
// Get Enabled Providers
// ============================================

function getEnabledProviders() {
    var providers = [];
    
    if (EMBED_PROVIDERS.primary.enabled) {
        providers.push({
            ...EMBED_PROVIDERS.primary,
            isPrimary: true,
        });
    }
    
    EMBED_PROVIDERS.fallbacks.forEach(function(p) {
        if (p.enabled) {
            providers.push({
                ...p,
                isPrimary: false,
            });
        }
    });
    
    return providers;
}

// Make globally available
window.EMBED_PROVIDERS = EMBED_PROVIDERS;
window.getEmbedUrl = getEmbedUrl;
window.getTvEmbedUrl = getTvEmbedUrl;
window.getEnabledProviders = getEnabledProviders;

console.log('✅ Embed config loaded with TV Show support! (VidLink Primary)');