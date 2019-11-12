/* eslint-disable strict */
const path = require('path');
const logger = require('../logger');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = function(folder) {
  return {
    id: folder.id,
    name: xss(folder.name)
  };
};

foldersRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    FoldersService.getAllFolders(knexInstance)
      .then(folders => res.json(folders.map(serializeFolder)))
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name } = req.body;

    if (!name) {
      const error = 'Missing name in request body';
      return res.status(400).json({
        error: { message: error }
      });
    }

    const newFolder = { name };

    FoldersService.insertFolder(knexInstance, newFolder)
      .then(folder => {
        logger.info(`Folder with id ${folder.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(folder);
      })
      .catch(next);
  });

foldersRouter
  .route('/:id')
  .all((req, res, next) => {
    FoldersService.getFolderById(req.app.get('db'), req.params.id)
      .then(folder => {
        if (!folder) {
          return res.status(404).json({ error: { message: `Folder doesn't exist` } });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeFolder(res.folder));
  })
  .delete((req, res, next) => {
    FoldersService.deleteFolder(req.app.get('db'), req.params.id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;
