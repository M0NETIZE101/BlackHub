// ============================================
// BlackHub - Embed Configuration
// ============================================

// Embed providers configuration
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

// Get the embed URL for a movie
function getEmbedUrl(imdbId, tmdbId) {
    // Check for custom override first
    if (imdbId && EMBED_PROVIDERS.customOverrides[imdbId]) {
        return EMBED_PROVIDERS.customOverrides[imdbId];
    }

    // Use primary provider
    const primary = EMBED_PROVIDERS.primary;
    if (primary.enabled) {
        const id = primary.type === 'imdb' ? imdbId : tmdbId;
        if (id) {
            return primary.baseUrl + id;
        }
    }

    // Try fallback providers
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

// Test if a provider URL is working
async function testProviderUrl(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Get all enabled providers
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

// Save configuration to localStorage
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

// Load configuration from localStorage
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

// Reset configuration to defaults
function resetEmbedConfig() {
    EMBED_PROVIDERS.primary = {
        name: 'Autoembed',
        baseUrl: 'https://autoembed.co/movie/imdb/',
        type: 'imdb',
        enabled: true,
    };
    EMBED_PROVIDERS.fallbacks = [
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
    ];
    EMBED_PROVIDERS.customOverrides = {};
    localStorage.removeItem('embedConfig');
}

// Auto-load config on page load
loadEmbedConfig();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EMBED_PROVIDERS,
        getEmbedUrl,
        testProviderUrl,
        getEnabledProviders,
        saveEmbedConfig,
        loadEmbedConfig,
        resetEmbedConfig,
    };
}

console.log('✅ Embed config loaded successfully!');