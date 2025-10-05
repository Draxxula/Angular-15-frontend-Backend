// workflows/workflow.controller.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const workflowService = require('./workflow.service');

// routes
router.get('/', authorize([Role.Admin, Role.User]), getAll);
router.get('/:id', authorize([Role.Admin, Role.User]), getById);
router.get('/employee/:employeeId', authorize([Role.Admin, Role.User]), getByEmployee);
router.get('/request/:requestId', authorize([Role.Admin, Role.User]), getByRequest);
router.post('/', authorize([Role.Admin, Role.User]), createSchema, create);
router.put('/:id', authorize([Role.Admin, Role.User]), updateSchema, update);
router.delete('/:id', authorize([Role.Admin, Role.User]), _delete);

module.exports = router;

// ===== Schemas =====
function createSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid('Onboarding', 'Request Approval', 'Custom').required(),
    details: Joi.string().required(),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected').default('Pending'),
    employeeId: Joi.string().required(),
    requestId: Joi.number().optional().allow(null)
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid('Onboarding', 'Request Approval', 'Custom').empty(''),
    details: Joi.string().empty(''),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected').empty(''),
    employeeId: Joi.string().empty(''),
    requestId: Joi.number().optional().allow(null),
    syncRequest: Joi.boolean().default(true) // New field to control request status sync
  });
  validateRequest(req, next, schema);
}

// ===== Controllers =====
function getAll(req, res, next) {
  workflowService.getAll()
    .then(workflows => res.json(workflows))
    .catch(next);
}

function getById(req, res, next) {
  workflowService.getById(req.params.id)
    .then(workflow => workflow ? res.json(workflow) : res.sendStatus(404))
    .catch(next);
}

function getByEmployee(req, res, next) {
  workflowService.getByEmployee(req.params.employeeId)
    .then(workflows => res.json(workflows))
    .catch(next);
}

function getByRequest(req, res, next) {
  workflowService.getByRequest(req.params.requestId)
    .then(workflows => res.json(workflows))
    .catch(next);
}

function create(req, res, next) {
  workflowService.create(req.body)
    .then(workflow => res.json(workflow))
    .catch(next);
}

function update(req, res, next) {
  workflowService.update(req.params.id, req.body)
    .then(workflow => res.json(workflow))
    .catch(next);
}

function _delete(req, res, next) {
  workflowService._delete(req.params.id)
    .then(() => res.json({ message: 'Workflow deleted successfully' }))
    .catch(next);
}
