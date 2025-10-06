// requests/request.controller.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const requestService = require('./request.service');

// routes
router.get('/', authorize([Role.Admin, Role.User]), getAll);
router.get('/:id', authorize([Role.Admin, Role.User]), getById);
router.post('/', authorize([Role.Admin, Role.User]), createSchema, create);
router.put('/:id', authorize([Role.Admin, Role.User]), updateSchema, update);
router.delete('/:id', authorize([Role.Admin, Role.User]), _delete);

module.exports = router;

// ===== Schemas =====
function createSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().required(),
    items: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          quantity: Joi.number().required()
        })
      )
    ).required(),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected').default('Pending'),
    employeeId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}


function updateSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().empty(''),
    items: Joi.string().empty(''),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected').empty(''),
    employeeId: Joi.string().empty('')
  });
  validateRequest(req, next, schema);
}

// ===== Controllers =====
function getAll(req, res, next) {
  requestService.getAll()
    .then(requests => res.json(requests))
    .catch(next);
}

function getById(req, res, next) {
  requestService.getById(req.params.id)
    .then(request => request ? res.json(request) : res.sendStatus(404))
    .catch(next);
}

function create(req, res, next) {
  requestService.create(req.body)
    .then(request => res.json(request))
    .catch(next);
}

function update(req, res, next) {
  requestService.update(req.params.id, req.body)
    .then(request => res.json(request))
    .catch(next);
}

function _delete(req, res, next) {
  requestService.delete(req.params.id)
    .then(() => res.json({ message: 'Request deleted successfully' }))
    .catch(next);
}
