// employees/employee.controller.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const employeeService = require('./employee.service');

// routes
router.get('/', authorize(Role.Admin), getAllEmployees);
router.get('/:id', authorize([Role.Admin, Role.User]), getById);
router.post('/', authorize(Role.Admin), createSchema, createEmployee);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.put('/:id/transfer', authorize(Role.Admin), transferDepartment);
router.delete('/:id', authorize(Role.Admin), _delete);

module.exports = router;

// route functions
function getAllEmployees(req, res, next) {
  employeeService.getAll()
    .then(employees => res.json(employees))
    .catch(next);
}

function getById(req, res, next) {
  employeeService.getById(req.params.id)
    .then(employee => employee ? res.json(employee) : res.sendStatus(404))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.string().required(), 
    position: Joi.string().required(),
    departmentId: Joi.number().required(),
    accountId: Joi.number().required(),    // ✅ link to account
    hireDate: Joi.date().max(new Date(`${new Date().getFullYear()}-12-31`)).required(),
    status: Joi.string().valid('Active', 'Inactive').default('Active')
  });
  validateRequest(req, next, schema);
}

function createEmployee(req, res, next) {
  employeeService.create(req.body)
    .then(employee => res.json(employee))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.string().optional(),   // allow employeeId
    accountId: Joi.number().optional(), // allow accountId
    position: Joi.string().empty(''),
    departmentId: Joi.number().empty(''),
    hireDate: Joi.date().empty(''),
    status: Joi.string().valid('Active', 'Inactive').empty('')
  });
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  employeeService.update(req.params.id, req.body)
    .then(employee => res.json(employee))
    .catch(next);
}

function transferDepartment(req, res, next) {
  employeeService.transferDepartment(req.params.id, req.body)
    .then(employee => res.json(employee))
    .catch(next);
}

function _delete(req, res, next) {
  employeeService.delete(req.params.id)
    .then(() => res.json({ message: 'Employee deleted successfully' }))
    .catch(next);
}