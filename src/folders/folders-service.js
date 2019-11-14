/* eslint-disable strict */
const FoldersService = {
  getAllFolders(knex) {
    return knex.select('*').from('folders');
  },

  getFolderById(knex, id) {
    return knex
      .select('*')
      .from('folders')
      .where({ id })
      .first();
  },

  insertFolder(knex, folder) {
    return knex
      .insert(folder)
      .into('folders')
      .returning('*')
      .then(rows => rows[0]);
  },

  deleteFolder(knex, id) {
    return knex('folders')
      .delete()
      .where({ id });
  }
};

module.exports = FoldersService;
