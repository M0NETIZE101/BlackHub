// ============================================
// embed-config.js - Video Embed Configuration
// ============================================

// Embed providers configuration
const EMBED_PROVIDERS = {
    // Primary provider (currently autoembed)
    primary: {
        name: 'Autoembed',
        baseUrl: 'https://autoembed.co/movie/imdb/',
        type: 'imdb', // or 'tmdb'
        enabled: true,
    },
    // Fallback providers
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
    // Custom URLs for specific movies (overrides)
    customOverrides: {
        // 'tt1375666': 'https://custom-provider.com/embed/inception',
        // 'tt22084616': 'https://another-provider.com/movie/12345',
    },
};

// Get the embed URL for a movie
function getEmbedUrl(imdbId, tmdbId) {
    // Check for custom override first
    if (EMBED_PROVIDERS.customOverrides[imdbId]) {
        return EMBED_PROVIDERS.customOverrides[imdbId];
    }

    // Use primary provider
    const primary = EMBED_PROVIDERS.primary;
    if (primary.enabled) {
        const id = primary.type === 'imdb' ? imdbId : tmdbId;
        return `${primary.baseUrl}${id}`;
    }

    // If primary is disabled, try fallbacks
    for (const provider of EMBED_PROVIDERS.fallbacks) {
        if (provider.enabled) {
            const id = provider.type === 'imdb' ? imdbId : tmdbId;
            return `${provider.baseUrl}${id}`;
        }
    }

    // If no providers are enabled, return null
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

// Save configuration to localStorage (for admin panel)
function saveEmbedConfig(config) {
    localStorage.setItem('embedConfig', JSON.stringify(config));
    // Also save to a cookie or send to server if needed
}

// Load configuration from localStorage
function loadEmbedConfig() {
    const saved = localStorage.getItem('embedConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            // Merge with defaults
            Object.assign(EMBED_PROVIDERS, config);
        } catch (e) {
            console.error('Error loading embed config:', e);
        }
    }
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
    };
}