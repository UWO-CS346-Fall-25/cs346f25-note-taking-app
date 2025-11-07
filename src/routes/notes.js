const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Create Note
router.post('/', async (req, res) => {
  const {title, content} = req.body;

  if(!title) {
    return res.render('notes', {
      title: 'Notes',
      content: 'Title is required.',
      csrfToken: req.csrfToken(),
    });
  }

  const { error } = await supabase
    .from('notes')
    .insert([{title,content}]);

    if(error) {
      console.error(error);
      return res.render('notes', {
        title: 'Notes',
        content: 'Failed to save note.',
        csrfToken: req.csrfToken(),
      });
    }

    res.redirect('/notes/list')
});

// List Notes
router.get('/list', async (req,res) => {

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', {ascending: false});

  if(error) {
    console.error(error);
    return res.render('error', {
      title: 'Error',
      message: 'Could not fetch notes.',
      error,
    });
  }

  res.render('notes-list',{
    title: 'Your Notes',
    notes: data,
  })
});



// const csrf = require('csurf');
// const noteController = require('../controllers/noteController');

// const csrfProtection = csrf({ cookie: false });

// router.get('/', csrfProtection, noteController.getNotes);
// router.post('/add', csrfProtection, noteController.createNote);

module.exports = router;
