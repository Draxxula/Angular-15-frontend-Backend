// scripts/backfill-existing-employees-onboarding.js
const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// Import models
const DepartmentModel = require('../departments/department.model');
const EmployeeModel = require('../employees/employee.model');
const WorkflowModel = require('../workflows/workflow.model');
const OnboardingModel = require('../onboarding/onboarding.model');

async function initializeDatabase() {
    console.log('🔌 Initializing database connection...');
    
    const { host, port, user, password, database } = config.database;
    
    // Create database connection
    const sequelize = new Sequelize(database, user, password, { 
        host,
        port,
        dialect: 'mysql',
        logging: false
    });

    // Initialize models
    const db = {};
    db.Department = DepartmentModel(sequelize);
    db.Employee = EmployeeModel(sequelize);
    db.Workflow = WorkflowModel(sequelize);
    db.OnboardingTemplate = OnboardingModel(sequelize);

    // Define relationships
    db.Department.hasMany(db.Employee, { as: 'employees', foreignKey: 'departmentId' });
    db.Employee.belongsTo(db.Department, { as: 'department', foreignKey: 'departmentId' });
    
    db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId' });
    db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId' });

    db.Department.hasMany(db.OnboardingTemplate, { foreignKey: 'departmentId', as: 'onboardingTemplates' });
    db.OnboardingTemplate.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    return { db, sequelize };
}

async function backfillExistingEmployees() {
    let db, sequelize;
    
    try {
        console.log('🚀 Starting onboarding backfill for existing employees...');

        // Initialize database connection
        const connection = await initializeDatabase();
        db = connection.db;
        sequelize = connection.sequelize;

        // Get ALL employees first
        const allEmployees = await db.Employee.findAll({
            include: [{
                model: db.Department,
                as: 'department'
            }]
        });

        console.log(`📋 Total employees in system: ${allEmployees.length}`);

        let processedCount = 0;
        let skippedCount = 0;

        for (const employee of allEmployees) {
            // Check if this employee already has onboarding workflows
            const existingOnboardingCount = await db.Workflow.count({
                where: { 
                    employeeId: employee.employeeId, 
                    type: 'Onboarding' 
                }
            });

            if (existingOnboardingCount > 0) {
                console.log(`⏭️  Skipping ${employee.employeeId} - already has ${existingOnboardingCount} onboarding tasks`);
                skippedCount++;
                continue;
            }

            console.log(`\n🔍 Processing employee: ${employee.employeeId} (${employee.department.name})`);
            
            // Get onboarding templates for this employee's department
            const onboardingTemplates = await db.OnboardingTemplate.findAll({
                where: { 
                    departmentId: employee.departmentId,
                    isActive: true 
                },
                order: [['order', 'ASC']]
            });

            console.log(`   📝 Found ${onboardingTemplates.length} templates for ${employee.department.name}`);

            // Create workflows from templates
            for (const template of onboardingTemplates) {
                await db.Workflow.create({
                    type: 'Onboarding',
                    details: `Task: ${template.taskName}`,
                    status: 'Pending',
                    employeeId: employee.employeeId,
                    requestId: null
                });
                console.log(`   ✅ Created: ${template.taskName}`);
            }

            processedCount++;
            console.log(`   🎉 Added ${onboardingTemplates.length} onboarding tasks to ${employee.employeeId}`);
        }

        console.log(`\n🎉 Backfill completed!`);
        console.log(`   ✅ Processed: ${processedCount} employees`);
        console.log(`   ⏭️  Skipped: ${skippedCount} employees (already had onboarding)`);
        
        // Close database connection
        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during backfill:', error);
        if (sequelize) await sequelize.close();
        process.exit(1);
    }
}

// Run the backfill
backfillExistingEmployees();