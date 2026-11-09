// server.js
import express from 'express';
import cors from 'cors';
import { ANIME } from 'dksanime-api';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Use Gogoanime as the primary provider
const provider = new ANIME.Gogoanime();

// ============================================
// API Routes
// ============================================

/**
 * Search anime
 * GET /api/anime/search?q=one+piece&page=1
 */
app.get('/api/anime/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const results = await provider.search(q, parseInt(page));
        res.json({
            success: true,
            data: results.results || [],
            totalPages: results.totalPages || 1,
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get anime details by ID (Gogoanime ID)
 * GET /api/anime/info/:id
 */
app.get('/api/anime/info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const info = await provider.fetchAnimeInfo(id);
        res.json({ success: true, data: info });
    } catch (error) {
        console.error('Info error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get episodes for an anime
 * GET /api/anime/episodes/:id
 */
app.get('/api/anime/episodes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const episodes = await provider.fetchEpisodes(id);
        res.json({ success: true, data: episodes });
    } catch (error) {
        console.error('Episodes error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get episode source (embed URL)
 * GET /api/anime/embed/:episodeId
 */
app.get('/api/anime/embed/:episodeId', async (req, res) => {
    try {
        const { episodeId } = req.params;
        const sources = await provider.fetchEpisodeSources(episodeId);
        const embedUrl = sources.sources?.[0]?.url || null;
        if (embedUrl) {
            res.json({ success: true, url: embedUrl });
        } else {
            res.status(404).json({ error: 'No embed URL found' });
        }
    } catch (error) {
        console.error('Embed error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🎬 Anime API server running on http://localhost:${port}`);
});