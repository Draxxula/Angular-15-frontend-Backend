const db = require('_helpers/db');

module.exports = {
  getAll,
  getByDepartment,
  create,
  update,
  delete: _delete
};

async function getAll() {
  return await db.OnboardingTemplate.findAll({
    include: [{
      model: db.Department,
      as: 'department',
      attributes: ['id', 'name']
    }],
    order: [['departmentId', 'ASC'], ['order', 'ASC']]
  });
}

async function getByDepartment(departmentId) {
  return await db.OnboardingTemplate.findAll({
    where: { departmentId, isActive: true },
    order: [['order', 'ASC']]
  });
}

async function create(params) {
  return await db.OnboardingTemplate.create(params);
}

async function update(id, params) {
  const template = await getTemplate(id);
  Object.assign(template, params);
  template.updated = new Date();
  await template.save();
  return template;
}

async function _delete(id) {
  const template = await getTemplate(id);
  await template.destroy();
}

async function getTemplate(id) {
  const template = await db.OnboardingTemplate.findByPk(id);
  if (!template) throw 'Onboarding template not found';
  return template;
}