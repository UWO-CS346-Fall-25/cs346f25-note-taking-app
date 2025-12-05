const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// router.get('/', async (req, res) => {
//   return res.render('notes', {
//     title: 'Notes',
//     csrfToken: req.csrfToken(),
//   });
// });

router.get('/', async (req, res) => {
  const noteId = req.query.id; // <-- if provided, we're editing

  let note = null;

  if (noteId) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_uuid', req.user.id) // security: must belong to current user
      .single();

    if (!error) {
      note = data;
    }
  }

  return res.render('notes', {
    title: note ? 'Edit Note' : 'New Note',
    csrfToken: req.csrfToken(),
    note, // <-- pass note (or null)
  });
});

// Update Note
router.post('/:id/edit', async (req, res) => {
  console.log('[NotesRoute] POST /notes/:id/edit start', { user: req.user?.id });

  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const { error } = await supabase
      .from('notes')
      .update({
        title,
        content
      })
      .eq('id', id)
      .eq('user_uuid', req.user.id); // security check

    if (error) {
      console.error('[NotesRoute] DB update error', { code: error.code, msg: error.message });
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to update note.',
        error: {},
      });
    }

    console.log('[NotesRoute] DB update success');
    res.redirect('/notes/list');
  } catch (e) {
    console.error('[NotesRoute] Unexpected error', { message: e?.message });
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Unexpected error while updating your note.',
      error: {},
    });
  }
});


// Create Note
router.post('/', async (req, res) => {
  console.log('[NotesRoute] POST /notes start', { user: req.user?.id });
  try {
    const { title, content } = req.body;

    const { error } = await supabase
      .from('notes')
      .insert([{ title, content, user_uuid: req.user.id }]);

    if (error) {
      console.error('[NotesRoute] DB insert error', { code: error.code, msg: error.message });
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to save note.',
        error: {},
      });
    }

    console.log('[NotesRoute] DB insert success');
    res.redirect('/notes/list');
  } catch (e) {
    console.error('[NotesRoute] Unexpected error', { message: e?.message }); // [ADDED]
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Unexpected error while saving your note.',
      error: {},
    });
  }
});

// List Notes
router.get('/list', async (req, res) => {
  console.log('[NotesRoute] GET /notes/list start', { user: req.user?.id });

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_uuid', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NotesRoute] DB select error', {
        code: error.code,
        msg: error.message,
      });
      return res.render('error', {
        title: 'Error',
        message: 'Could not fetch notes.',
        error: {},
      });
    }

    console.log('[NotesRoute] DB select success', { count: data?.length || 0 });
    res.render('notes-list', {
      title: 'Your Notes',
      notes: data,
    });
  } catch (e) {
    console.error('[NotesRoute] Unexpected error', { message: e?.message }); // [ADDED]
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Unexpected error while fetching notes.',
      error: {},
    });
  }
});

module.exports = router;
