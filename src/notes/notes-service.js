/* eslint-disable strict */
const NotesService = {
  getAllNotes(knex) {
    return knex.select('*').from('notes');
  },

  getNoteById(knex, id) {
    return knex
      .select('*')
      .from('notes')
      .where({ id })
      .first();
  },

  insertNote(knex, note) {
    return knex
      .insert(note)
      .into('notes')
      .returning('*')
      .then(rows => rows[0]);
  },

  deleteNote(knex, id) {
    return knex('notes')
      .delete()
      .where({ id });
  }
};

module.exports = NotesService;
