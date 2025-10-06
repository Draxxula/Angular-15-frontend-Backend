// department.service.js
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

// Get all departments
// async function getAll() {
//   return await db.Department.findAll({
//     include: [
//       {
//         model: db.Employee,
//         as: 'employees',
//         attributes: []
//       }
//     ],
//     attributes: {
//       include: [
//         [db.sequelize.fn('COUNT', db.sequelize.col('employees.id')), 'employeeCount']
//       ]
//     },
//     group: ['Department.id']
//   });
// }

async function getAll() {
  const departments = await db.Department.findAll({
    include: [
      { model: db.Employee, as: 'employees' }
    ]
  });

  return departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    description: dept.description,
    employeeCount: dept.employees.length
  }));
}


// Get department by ID
async function getById(id) {
  const department = await db.Department.findByPk(id, {
    include: [{ model: db.Employee, as: 'employees' }]
  });
  if (!department) throw "Department not found";
  return department;
}

// Create new department
async function create(params) {
  // make sure name is unique
  if (await db.Department.findOne({ where: { name: params.name } })) {
    throw `Department "${params.name}" already exists`;
  }

  const department = await db.Department.create(params);
  return department;
}

// Update department
async function update(id, params) {
  const department = await getDepartment(id);

  // check for duplicate name if updating
  if (
    params.name &&
    department.name !== params.name &&
    (await db.Department.findOne({ where: { name: params.name } }))
  ) {
    throw `Department "${params.name}" already exists`;
  }

  Object.assign(department, params);
  await department.save();

  return basicDetails(department);
}

// Delete department
async function _delete(id) {
  const department = await getDepartment(id);
  await department.destroy();
}

// Helpers
async function getDepartment(id) {
  const department = await db.Department.findByPk(id, {
    include: [{ model: db.Employee, as: 'employees' }]
  });
  if (!department) throw "Department not found";
  return department;
}

function basicDetails(department) {
  const { id, name, description } = department;
  const employeeCount = department.employees ? department.employees.length : 0;
  return { id, name, description, employeeCount };
}
