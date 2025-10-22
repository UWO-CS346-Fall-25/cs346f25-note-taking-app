const Note = require('../models/Note');


exports.getNotes = async (req,res) => {
  try {
    const notes = Note.getAll();
    res.render('notes', {notes});
  } catch(err) {
    console.error(err);
    res.status(500).send('Error loading notes');
  }
};

exports.createNote = async (req,res) => {
  try {
    const { title, content } = req.body;
    await Note.add(title, content);
    res.redirect('/notes');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating note');
  }
}
