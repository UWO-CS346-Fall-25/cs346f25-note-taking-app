/* eslint-env node */
/* global fetch, URLSearchParams */ // this works, it just says that these exists

const API = 'https://api.quotable.io';

/**
 * GET /api/inspire
 * - Renders a single random quote
 * - Supports optional filters via querystring:
 *   /api/inspire?tags=inspirational|success 
 */
exports.getInspiration = async (req, res) => {
  try {
    const { tags, author } = req.query;
    let url = `${API}/random`;
    const params = new URLSearchParams();
    if (tags) params.set('tags', tags);
    if (author) params.set('author', author);
    if ([...params].length) url += `?${params.toString()}`;

    const r = await fetch(url);
    if (!r.ok) throw new Error(`Upstream ${r.status}`);
    const data = await r.json();
    // Quotable random returns: { _id, content, author, tags, ... }

    return res.render('inspire', {
      title: 'Inspiration',
      quote: data.content,
      author: data.author,
      filters: { tags: tags || '', author: author || '' },
    });
  } catch (err) {
    console.error('Quotable error:', err);
    return res.status(502).render('inspire', {
      title: 'Inspiration',
      quote: null,
      author: null,
      error: 'Could not load inspiration right now. Please try again later.',
      filters: { tags: req.query.tags || '', author: req.query.author || '' },
    });
  }
};
