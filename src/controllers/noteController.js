const Note = require('../models/Note');


exports.getNotes = async (req,res) => {
  const notes = await Note.getAll();
  res.render('notes', {title: 'My Notes', notes });
};

exports.createNote = async (req,res) => {
  const {title, content} = req.body;
  await Note.add(title,content);
  res.redirect('/notes');
}
