// employees/employee.service.js
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
  create,
  update,
  transferDepartment,
  basicDetails,
  delete: _delete
};

// Get all employees
async function getAll() {
  return await db.Employee.findAll({
    include: [
      { model: db.Account, attributes: ['id','email', 'role', 'status', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });
}

// Get employee by ID
async function getById(id) {
  const employee = await db.Employee.findByPk(id, {
    include: [
      { model: db.Account, as: 'account', attributes: ['id','email', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });

  if (!employee) throw "Employee not found";
  return employee; // <-- return full object, not basicDetails
}

// Create new employee
async function create(params) {
  console.log('🚀 [DEBUG] Employee create function called with:', params);
  
  // Convert IDs to numbers
  params.accountId = Number(params.accountId);
  params.departmentId = Number(params.departmentId);

  // ✅ Make sure account exists
  const account = await db.Account.findByPk(params.accountId);
  if (!account) throw `Account with ID "${params.accountId}" not found`;

  // ✅ Prevent assigning an account that's already linked
  const existing = await db.Employee.findOne({ where: { accountId: params.accountId } });
  if (existing) throw `Account ID "${params.accountId}" is already assigned to another employee`;

  // ✅ Get department to create onboarding workflows
  const department = await db.Department.findByPk(params.departmentId);
  if (!department) throw 'Department not found';

  console.log(`🏢 [DEBUG] Department found: ${department.name} (ID: ${department.id})`);

  // ✅ Create employee
  const employee = await db.Employee.create({
    ...params,
    created: Date.now(),
    updated: Date.now()
  });

  console.log(`✅ [DEBUG] Employee created successfully: ${employee.employeeId}`);

  // ✅ AUTO-CREATE ONBOARDING WORKFLOWS FROM TEMPLATES
  await createOnboardingWorkflows(employee, department);

  return await db.Employee.findByPk(employee.employeeId, {
    include: [
      { model: db.Account, as: 'account', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });
}

// Add this helper function to employee.service.js
async function createOnboardingWorkflows(employee, department) {
  try {
    console.log('🔍 [DEBUG] Starting createOnboardingWorkflows...');
    console.log(`🔍 [DEBUG] Employee: ${employee.employeeId}, Department: ${department.name} (ID: ${department.id})`);

    // Get onboarding templates for this department
    const onboardingTemplates = await db.OnboardingTemplate.findAll({
      where: { 
        departmentId: department.id,
        isActive: true 
      },
      order: [['order', 'ASC']]
    });

    console.log(`📋 [DEBUG] Found ${onboardingTemplates.length} templates for department ${department.name}`);

    // Log the templates found
    onboardingTemplates.forEach(template => {
      console.log(`   - ${template.taskName} (Order: ${template.order})`);
    });

    if (onboardingTemplates.length === 0) {
      console.log('⚠️ [DEBUG] No templates found, creating fallback task');
      // Fallback: create basic task if no templates found
      await db.Workflow.create({
        type: 'Onboarding',
        details: 'Task: Setup workstation',
        status: 'Pending',
        employeeId: employee.employeeId,
        requestId: null
      });
      console.log('✅ [DEBUG] Created fallback onboarding task');
      return;
    }

    // Create workflows from templates
    for (const template of onboardingTemplates) {
      await db.Workflow.create({
        type: 'Onboarding',
        details: `Task: ${template.taskName}`,
        status: 'Pending',
        employeeId: employee.employeeId,
        requestId: null
      });
      console.log(`✅ [DEBUG] Created workflow: ${template.taskName}`);
    }

    console.log(`🎉 [DEBUG] Created ${onboardingTemplates.length} onboarding tasks for employee ${employee.employeeId}`);
  } catch (error) {
    console.error('❌ [DEBUG] Error in createOnboardingWorkflows:', error);
    
    // Fallback: create basic task if templates fail
    await db.Workflow.create({
      type: 'Onboarding',
      details: 'Task: Setup workstation',
      status: 'Pending',
      employeeId: employee.employeeId,
      requestId: null
    });
    console.log('✅ [DEBUG] Created fallback onboarding task due to error');
  }
}

// Update employee
async function update(id, params) {
  const employee = await getEmployee(id);

  // ✅ Prevent assigning the same account to multiple employees
  if (params.accountId && params.accountId !== employee.accountId) {
    const existing = await db.Employee.findOne({ where: { accountId: params.accountId } });
    if (existing) {
      throw `Account ID "${params.accountId}" is already assigned to another employee`;
    }
  }

  // ✅ Optional: keep email uniqueness check if your model has an email field
  if (
    params.email &&
    employee.email !== params.email &&
    (await db.Employee.findOne({ where: { email: params.email } }))
  ) {
    throw `Email "${params.email}" is already taken`;
  }

  Object.assign(employee, params);
  employee.updated = Date.now();

  await employee.save();

  // ✅ Return the updated employee with relations
  return await db.Employee.findByPk(id, {
    include: [
      { model: db.Account, as: 'account', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });
}


// Delete employee
async function _delete(id) {
  const employee = await getEmployee(id);
  await employee.destroy();
}

// Helpers
async function getEmployee(id) {
  const employee = await db.Employee.findByPk(id);
  if (!employee) throw "Employee not found";
  return employee;
}

// Transfer employee to another department
// async function transferDepartment(id, { departmentId }) {
//   const employee = await getEmployee(id);
//   if (!employee) throw "Employee not found";

//   const department = await db.Department.findByPk(departmentId);
//   if (!department) throw `Department with ID "${departmentId}" not found`;

//   employee.departmentId = departmentId;
//   employee.updated = Date.now();

//   await employee.save();

//    await createOnboardingWorkflows(employee, department);

//   // re-fetch with relations
//   return await db.Employee.findByPk(employee.employeeId, {   // ✅ use employeeId
//     include: [
//       { model: db.Account, as: 'account', attributes: ['id', 'email', 'firstName', 'lastName'] },
//       { model: db.Department, as: 'department', attributes: ['id', 'name'] }
//     ]
//   });
// }

async function transferDepartment(id, { departmentId }) {
  const employee = await getEmployee(id);
  if (!employee) throw "Employee not found";

  // Get both old and new departments
  const oldDepartment = await db.Department.findByPk(employee.departmentId);
  const newDepartment = await db.Department.findByPk(departmentId);
  
  if (!newDepartment) throw `Department with ID "${departmentId}" not found`;

  // Store old department name for the workflow
  const oldDepartmentName = oldDepartment ? oldDepartment.name : 'Unknown Department';

  // Update employee department
  employee.departmentId = departmentId;
  employee.updated = Date.now();

  await employee.save();

  // ✅ ADD THIS: CREATE DEPARTMENT TRANSFER WORKFLOW
  await createDepartmentTransferWorkflow(employee, oldDepartmentName, newDepartment.name);

  // ✅ CREATE NEW ONBOARDING WORKFLOWS FOR NEW DEPARTMENT
  await createOnboardingWorkflows(employee, newDepartment);

  // re-fetch with relations
  return await db.Employee.findByPk(employee.employeeId, {
    include: [
      { model: db.Account, as: 'account', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });
}

// ✅ ADD THIS FUNCTION to your employee.service.js
async function createDepartmentTransferWorkflow(employee, oldDepartmentName, newDepartmentName) {
  try {
    const workflow = await db.Workflow.create({
      type: 'Department Transfer',
      details: `Employee transferred from ${oldDepartmentName} to ${newDepartmentName}.`,
      status: 'Pending',
      employeeId: employee.employeeId,
      requestId: null
    });
    
    console.log(`✅ Created department transfer workflow for ${employee.employeeId}`);
    return workflow;
  } catch (error) {
    console.error('❌ Error creating department transfer workflow:', error);
    throw error;
  }
}

function basicDetails(employee) {
  const { id, employeeId, email, position, hireDate, department } = employee;
  return { id, employeeId, email, position, hireDate, department };
}