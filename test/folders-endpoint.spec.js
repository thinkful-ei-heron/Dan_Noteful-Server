/* eslint-disable strict */
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');

describe('Folders Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean tables', () => db.raw('truncate folders restart identity cascade'));

  afterEach('cleanup', () => db.raw('truncate folders restart identity cascade'));

  describe('GET /api/folders', () => {
    context('Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert test data', () => {
        return db.into('folders').insert(testFolders);
      });

      it('responds with 200 and all the folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders);
      });

      it('given id responds with 200 and specified folder', () => {
        const folderId = 3;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });

  describe('POST /api/folders', () => {
    it('creates a folder, responding with 201 and the folder', () => {
      const newFolder = {
        name: 'newFolder'
      };
      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newFolder.name);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/folders/${res.body.id}`)
            .expect(res.body)
        );
    });
  });

  describe('DELETE /api/folders/:id', () => {
    context('given no folders', () => {
      it('responds with 404', () => {
        const id = 666;
        return supertest(app)
          .delete(`/api/folders/${id}`)
          .expect(404, { error: { message: `Folder doesn't exist` } });
      });
    });

    context('given folders in the databae', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert test data', () => {
        return db.into('folders').insert(testFolders);
      });

      it('responds with 204 and removes the folder', () => {
        const removeId = 2;
        const expectedFolders = testFolders.filter(folder => folder.id !== removeId);
        return supertest(app)
          .delete(`/api/folders/${removeId}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/folders')
              .expect(expectedFolders)
          );
      });
    });
  });
});
