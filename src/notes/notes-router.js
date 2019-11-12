/* eslint-disable strict */
const path = require('path');
const logger = require('../logger');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = function(note) {
  return {
    id: note.id,
    name: xss(note.name),
    modified: note.modified,
    folder_id: note.folder_id,
    content: xss(note.content)
  };
};

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotesService.getAllNotes(knexInstance)
      .then(notes => res.json(notes.map(serializeNote)))
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name, modified, folder_id, content } = req.body;

    if (!name) {
      const error = 'Missing name in request body';
      return res.status(400).json({
        error: { message: error }
      });
    }
    if (!folder_id) {
      const error = 'Missing folder_id in request body';
      return res.status(400).json({
        error: { message: error }
      });
    }
    if (!content) {
      const error = 'Missing content in request body';
      return res.status(400).json({
        error: { message: error }
      });
    }

    const newNote = { name, modified, folder_id, content };

    NotesService.insertNote(knexInstance, newNote)
      .then(note => {
        logger.info(`Note with id ${note.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(note);
      })
      .catch(next);
  });

notesRouter
  .route('/:id')
  .all((req, res, next) => {
    NotesService.getNoteById(req.app.get('db'), req.params.id)
      .then(note => {
        if (!note) {
          return res.status(404).json({ error: { message: `Note doesn't exist` } });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get('db'), req.params.id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
