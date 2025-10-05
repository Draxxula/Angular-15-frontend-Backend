// workflows/workflow.service.js
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
  getByEmployee,
  getByRequest,
  create,
  update,
  _delete
};

async function getAll() {
  return await db.Workflow.findAll({
    include: [
      {
        model: db.Employee,
        as: 'employee',
        attributes: ['employeeId', 'position', 'status'],
        include: [
          {
            model: db.Account,
            attributes: ['email', 'firstName', 'lastName', 'role']
          },
          {
            model: db.Department,
            as: 'department',
            attributes: ['name']
          }
        ]
      },
      {
        model: db.Request,
        as: 'request',
        attributes: ['id', 'type', 'items', 'status']
      }
    ],
    order: [['created', 'DESC']]
  });
}

// FIXED: This function now includes request details
async function getByEmployee(employeeId) {
  console.log('🔍 Fetching workflows for employee:', employeeId);
  
  try {
    const workflows = await db.Workflow.findAll({ 
      where: { employeeId },
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
        },
        {
          model: db.Request,
          as: 'request',
          attributes: ['id', 'type', 'items', 'status', 'employeeId']
        }
      ],
      order: [['created', 'DESC']]
    });

    console.log('🔍 Number of workflows found:', workflows.length);
    
    // Log the first workflow to see if includes are working
    if (workflows.length > 0) {
      console.log('🔍 First workflow with includes:', JSON.stringify(workflows[0].toJSON(), null, 2));
    }
    
    return workflows;
  } catch (error) {
    console.error('❌ Error in getByEmployee:', error);
    throw error;
  }
}

async function getByRequest(requestId) {
  return await db.Workflow.findAll({ 
    where: { requestId },
    include: [
      {
        model: db.Employee,
        as: 'employee',
        attributes: ['employeeId', 'position', 'status'],
        include: [
          {
            model: db.Account,
            attributes: ['email', 'firstName', 'lastName', 'role']
          }
        ]
      },
      {
        model: db.Request,
        as: 'request',
        attributes: ['id', 'type', 'items', 'status', 'employeeId']
      }
    ]
  });
}

async function getById(id) {
  const workflow = await db.Workflow.findByPk(id, {
    include: [
      {
        model: db.Employee,
        as: 'employee',
        attributes: ['employeeId', 'position', 'status'],
        include: [
          {
            model: db.Account,
            attributes: ['email', 'firstName', 'lastName', 'role']
          }
        ]
      },
      {
        model: db.Request,
        as: 'request',
        attributes: ['id', 'type', 'items', 'status', 'employeeId']
      }
    ]
  });
  if (!workflow) throw 'Workflow not found';
  return workflow;
}

async function create(params) {
  return await db.Workflow.create(params);
}

// Update workflow and sync status to linked request if applicable
async function update(id, params) {
  const workflow = await getWorkflow(id);
  
  // Store the old status for comparison
  const oldStatus = workflow.status;
  
  // Update the workflow
  Object.assign(workflow, params);
  workflow.updated = new Date();
  
  // If workflow has a linked request AND status changed, update the request too
  if (workflow.requestId && oldStatus !== params.status) {
    await updateRequestStatus(workflow.requestId, params.status);
  }
  
  await workflow.save();
  return workflow;
}

// Helper function to update request status
async function updateRequestStatus(requestId, status) {
  const request = await db.Request.findByPk(requestId);
  if (!request) {
    console.warn(`Request ${requestId} not found for status sync`);
    return;
  }
  
  request.status = status;
  request.updated = new Date();
  await request.save();
  
  console.log(`✅ Synced request ${requestId} status to: ${status}`);
}

// Update getWorkflow function to include request data
async function getWorkflow(id) {
  const workflow = await db.Workflow.findByPk(id, {
    include: [{
      model: db.Request,
      as: 'request',
      attributes: ['id', 'status']
    }]
  });
  if (!workflow) throw 'Workflow not found';
  return workflow;
}

async function _delete(id) {
  const workflow = await getById(id);
  await workflow.destroy();
}