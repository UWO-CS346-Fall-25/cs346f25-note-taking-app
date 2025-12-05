const Note = require('../models/Note');

const ts = () => `[${new Date().toISOString()}]`;

exports.getNotes = async (req, res) => {
  console.log(`${ts()} [NoteController] GET /notes start`);
  try {
    const notes = await Note.getAll();
    console.log(`${ts()} [NoteController] Loaded ${notes.length} notes`);
    res.render('notes', {
      title: 'Notes',
      notes,
      csrfToken: req.csrfToken(),
    });
    console.log(`${ts()} [NoteController] GET /notes render success`);
  } catch (err) {
    console.error(`${ts()} [NoteController] GET /notes error`, {
      message: err?.message,
    });
    res.status(500).send('Error loading notes');
  }
};

exports.createNote = async (req, res) => {
  console.log(`${ts()} [NoteController] POST /notes start`, {
    title: req.body?.title,
  });
  try {
    const { title, content } = req.body;
    await Note.add(title, content);
    console.log(`${ts()} [NoteController] Note created`, { title });
    res.redirect('/notes');
  } catch (err) {
    console.error(`${ts()} [NoteController] POST /notes error`, {
      message: err?.message,
    });
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Could not create note.',
    });
  }
};
