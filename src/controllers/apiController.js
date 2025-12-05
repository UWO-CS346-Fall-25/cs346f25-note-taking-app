/* eslint-env node */
/* global fetch, AbortController */

const API = 'https://zenquotes.io/api';

// tiny timeout helper (keeps requests from hanging)
const fetchWithTimeout = async (url, ms = 6000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'webnote/1.0' },
    });
  } finally {
    clearTimeout(id);
  }
};

exports.getInspiration = async (req, res) => {
  console.log('[ApiController] GET /api/inspire start');
  try {
    // GET /api/random  → returns an array: [{ q: "...", a: "Author", ... }]
    const key = process.env.ZENQUOTES_KEY;
    const base = key ? `${API}/random/${key}` : `${API}/random`;
    const url = `${base}?cb=${Date.now()}`;

    console.log('[ApiController] Fetching random quote from ZenQuotes');
    const r = await fetchWithTimeout(url, 6000);

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('[ApiController] ZenQuotes non-OK', {
        status: r.status,
        body: txt,
      });
      throw new Error(`Upstream ${r.status}`);
    }

    const arr = await r.json().catch(() => []);
    const item = Array.isArray(arr) && arr[0] ? arr[0] : null;

    console.log('[ApiController] ZenQuotes success');
    return res.render('inspire', {
      title: 'Inspiration',
      quote: item ? item.q : null, // fields: q = quote, a = author
      author: item ? item.a : null,
      attribution: !key,
    });
  } catch (err) {
    console.error('[ApiController] ZenQuotes error', { message: err?.message });
    return res.status(502).render('inspire', {
      title: 'Inspiration',
      quote: null,
      author: null,
      error: 'Could not load inspiration right now. Please try again.',
      attribution: true,
    });
  }
};
