const db = require('./db');

const Note = {
  async getAll() {
    const result = await db.query('SELECT * FROM notes ORDER BY id DESC');
    return result.rows;
  },

  async add(title, content) {
    await db.query('INSERT INTO notes (title,content) VALUES ($1, $2)', [
      title,
      content,
    ]);
  },
};

module.exports = Note;
