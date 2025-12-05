const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  return res.render('notes', {
    title: 'Notes',
    csrfToken: req.csrfToken(),
  });
});

// Create Note
router.post('/', async (req, res) => {
  console.log('[NotesRoute] POST /notes start', { user: req.user?.id });
  try {
    const { title, content } = req.body;


    // if(!title) {
    //   return res.render('notes', {
    //     title: 'Notes',
    //     content: 'Title is required.',
    //     csrfToken: req.csrfToken(),
    //   });
    // }

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

// const csrf = require('csurf');
// const noteController = require('../controllers/noteController');

// const csrfProtection = csrf({ cookie: false });

// router.get('/', csrfProtection, noteController.getNotes);
// router.post('/add', csrfProtection, noteController.createNote);

module.exports = router;
