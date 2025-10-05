// requests/request.service.js
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
  create,
  update,
  //basicDetails,
  delete: _delete
};

// Get all requests (with employee info)
async function getAll() {
  const requests = await db.Request.findAll({
    include: [
      {
        model: db.Employee,
        as: 'employee',
        attributes: [ 'employeeId', 'position', 'status'],
        include: [
          {
            model: db.Account,
            as: 'account',
            attributes: ['email', 'firstName', 'lastName', 'role']
          }
        ]
      }
    ]
  });
  return requests.map(r => ({
    ...r.toJSON(),
    items: parseItems(r.items)
  }));
}
// Parse items field (JSON string or plain text)
function parseItems(items) {
  try {
    return JSON.parse(items);
  } catch {
    return items; // fallback if plain string
  }
}

// Get request by ID
async function getById(id) {
  const request = await db.Request.findByPk(id, {
    include: [
      {
        model: db.Employee,
        as: 'employee',
        attributes: ['employeeId', 'position', 'status'],
        include: [
          {
            model: db.Account,
            as: 'account',
            attributes: ['email', 'firstName', 'lastName', 'role']
          }
        ]
      }
    ]
  });
  if (!request) throw 'Request not found';

  return {
    ...request.toJSON(),
    items: parseItems(request.items)
  };
}


// Create new request
async function create(params) {
  // make sure employee exists
  const employee = await db.Employee.findByPk(params.employeeId);
  if (!employee) throw 'Employee not found';

  // Create the request first
  const request = await db.Request.create(params);

  // ✅ Create corresponding workflow entry for this request
  await db.Workflow.create({
    type: 'Request Approval',
    details: `Approval for ${params.type} request by ${params.employeeId}`,
    employeeId: params.employeeId,
    requestId: request.id, // link to the newly created request
    status: 'Pending'
  });

  return request;
}


// Update request
async function update(id, params) {
  const request = await getRequest(id);

  Object.assign(request, params);
  request.updated = Date.now();

  try {
    await request.save();
  } catch (err) {
    console.error('Update failed:', err);
    throw err; // Let Express handle it
  }

  return request;
}

// Delete request
async function _delete(id) {
  const request = await getRequest(id);
  await request.destroy();
}

// Helpers
async function getRequest(id) {
  const request = await db.Request.findByPk(id);
  if (!request) throw 'Request not found';

  return request;
}

// function basicDetails(request) {
//   const { id, type, items, status, employeeId } = request;
//   return { id, type, items: parseItems(items), status, employeeId };
// }
