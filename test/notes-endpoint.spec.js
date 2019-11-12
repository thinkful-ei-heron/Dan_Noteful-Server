/* eslint-disable strict */
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');
const { makeNotesArray } = require('./notes.fixtures');

describe('notes Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean tables', () => db.raw('truncate folders, notes restart identity cascade'));

  afterEach('cleanup', () => db.raw('truncate folders, notes  restart identity cascade'));

  describe('GET /api/notes', () => {
    context('Given no notes', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, []);
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert test folders', () => {
        return db.into('folders').insert(testFolders);
      });
      beforeEach('insert test notes', () => {
        return db.into('notes').insert(testNotes);
      });

      it('responds with 200 and all the notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes);
      });

      it('given id responds with 200 and specified note', () => {
        const noteId = 3;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNote);
      });
    });
  });

  describe('POST /api/notes', () => {
    const testFolders = makeFoldersArray();
    beforeEach('insert test folders', () => {
      return db.into('folders').insert(testFolders);
    });

    it('creates a note, responding with 201 and the note', () => {
      const newNote = {
        name: 'newNote',
        modified: '2018-09-15T23:00:00.000Z',
        folder_id: 3,
        content: 'some new content blahb lahba slkasdgh'
      };
      return supertest(app)
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newNote.name);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/notes/${res.body.id}`)
            .expect(res.body)
        );
    });
  });

  describe('DELETE /api/notes/:id', () => {
    context('given no notes', () => {
      it('responds with 404', () => {
        const id = 666;
        return supertest(app)
          .delete(`/api/notes/${id}`)
          .expect(404, { error: { message: `Note doesn't exist` } });
      });
    });

    context('given notes in the databae', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert test folders', () => {
        return db.into('folders').insert(testFolders);
      });
      beforeEach('insert test notes', () => {
        return db.into('notes').insert(testNotes);
      });

      it('responds with 204 and removes the note', () => {
        const removeId = 2;
        const expectedNotes = testNotes.filter(note => note.id !== removeId);
        return supertest(app)
          .delete(`/api/notes/${removeId}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/notes')
              .expect(expectedNotes)
          );
      });
    });
  });
});
