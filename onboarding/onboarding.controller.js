const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const onboardingTemplateService = require('./onboarding.service');

router.get('/', authorize([Role.Admin]), getAll);
router.get('/department/:departmentId', authorize([Role.Admin]), getByDepartment);
router.post('/', authorize([Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.Admin]), _delete);

module.exports = router;

function createSchema(req, res, next) {
  const schema = Joi.object({
    departmentId: Joi.number().required(),
    taskName: Joi.string().required(),
    description: Joi.string().allow('', null),
    isActive: Joi.boolean().default(true),
    order: Joi.number().default(0)
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    taskName: Joi.string().empty(''),
    description: Joi.string().allow('', null),
    isActive: Joi.boolean().empty(''),
    order: Joi.number().empty('')
  });
  validateRequest(req, next, schema);
}

function getAll(req, res, next) {
  onboardingTemplateService.getAll()
    .then(templates => res.json(templates))
    .catch(next);
}

function getByDepartment(req, res, next) {
  onboardingTemplateService.getByDepartment(req.params.departmentId)
    .then(templates => res.json(templates))
    .catch(next);
}

function create(req, res, next) {
  onboardingTemplateService.create(req.body)
    .then(template => res.json(template))
    .catch(next);
}

function update(req, res, next) {
  onboardingTemplateService.update(req.params.id, req.body)
    .then(template => res.json(template))
    .catch(next);
}

function _delete(req, res, next) {
  onboardingTemplateService.delete(req.params.id)
    .then(() => res.json({ message: 'Onboarding template deleted successfully' }))
    .catch(next);
}