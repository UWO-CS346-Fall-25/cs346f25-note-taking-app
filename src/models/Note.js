const pool = require('./db');

const Note = {
  async getAll() {
    const {rows} = await pool.query('SELECT * FROM notes ORDER BY id DESC');
    return rows;
  },

  async add(title,content) {
    await pool.query('INSERT INTO notes (title,content) VALUES ($1, $2)', [title,content]);
  }
};

module.exports = Note;
