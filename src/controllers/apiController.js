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
  try {

    // GET /api/random  → returns an array: [{ q: "...", a: "Author", ... }]
    const key = process.env.ZENQUOTES_KEY;
    const url = key ? `${API}/random/${key}` : `${API}/random`;

    const r = await fetchWithTimeout(`${url}?cb=${Date.now()}`, 6000);
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('ZenQuotes non-OK:', r.status, txt);
      throw new Error(`Upstream ${r.status}`);
    }

    const arr = await r.json().catch(() => []);
    const item = Array.isArray(arr) && arr[0] ? arr[0] : null;

    return res.render('inspire', {
      title: 'Inspiration',
      quote: item ? item.q : null, // fields: q = quote, a = author
      author: item ? item.a : null,
      attribution: !key,
    });
  } catch (err) {
    console.error('ZenQuotes error:', err?.message || err);
    return res.status(502).render('inspire', {
      title: 'Inspiration',
      quote: null,
      author: null,
      error: 'Could not load inspiration right now. Please try again.',
      attribution: true,
    });
  }
};
