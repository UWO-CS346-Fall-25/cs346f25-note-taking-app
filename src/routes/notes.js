const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Timestamp helper
const ts = () => `[${new Date().toISOString()}]`;

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

// DELETE NOTE
router.post('/:id/delete', async (req, res) => {
  const noteId = req.params.id;

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_uuid', req.user.id); // safety: user can delete only their own notes

    if (error) {
      console.error('Delete Error:', error);
      return res.status(500).send('Error deleting note');
    }

    return res.redirect('/notes/list');
  } catch (err) {
    console.error('Unexpected Delete Error:', err);
    return res.status(500).send('Unexpected error deleting note');
  }
});


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


/**
 * POST /notes
 * Create a note for the current user
 *
 * Input: req.body { title, content }
 * Output: redirect to /notes/list on success; render error on failure
 */
router.post('/', async (req, res) => {
  console.log(`${ts()} [NotesRoute] POST /notes start`, { user: req.user?.id });
  try {
    const { title, content } = req.body;

    const { error } = await supabase
      .from('notes')
      .insert([{ title, content, user_uuid: req.user.id }]);

    if (error) {
      console.error(`${ts()} [NotesRoute] DB insert error`, {
        code: error.code,
        msg: error.message,
      });
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to save note.',
        error: {},
      });
    }

    console.log(`${ts()} [NotesRoute] DB insert success`);
    res.redirect('/notes/list');
  } catch (e) {
    console.error(`${ts()} [NotesRoute] Unexpected error`, {
      message: e?.message,
    });
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Unexpected error while saving your note.',
      error: {},
    });
  }
});

/**
 * GET /notes/list
 * List notes for the current user
 *
 * Input: none
 * Output: renders notes-list.ejs with notes array
 */
router.get('/list', async (req, res) => {
  console.log(`${ts()} [NotesRoute] GET /notes/list start`, {
    user: req.user?.id,
  });

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_uuid', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`${ts()} [NotesRoute] DB select error`, {
        code: error.code,
        msg: error.message,
      });
      return res.render('error', {
        title: 'Error',
        message: 'Could not fetch notes.',
        error: {},
      });
    }

    console.log(`${ts()} [NotesRoute] DB select success`, {
      count: data?.length || 0,
    });
    res.render('notes-list', {
    title: 'Your Notes',
    notes: data,
    csrfToken: req.csrfToken(),
    user: req.user
  });

  } catch (e) {
    console.error(`${ts()} [NotesRoute] Unexpected error`, { message: e?.message }); 
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Unexpected error while fetching notes.',
      error: {},
    });
  }
});

router.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return res.status(500).send("Error deleting note");
  }

  res.redirect("/notes-list");
});


module.exports = router;
