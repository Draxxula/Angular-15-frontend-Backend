// scripts/backfill-onboarding-templates.js
const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// Import models
const DepartmentModel = require('../departments/department.model');
const OnboardingModel = require('../onboarding/onboarding.model');

async function initializeDatabase() {
    console.log('🔌 Initializing database connection...');
    
    const { host, port, user, password, database } = config.database;
    
    // Create database connection
    const sequelize = new Sequelize(database, user, password, { 
        host,
        port,
        dialect: 'mysql',
        logging: console.log
    });

    // Initialize models
    const db = {};
    db.Department = DepartmentModel(sequelize);
    db.OnboardingTemplate = OnboardingModel(sequelize);

    // Define relationships
    db.Department.hasMany(db.OnboardingTemplate, { 
        foreignKey: 'departmentId', 
        as: 'onboardingTemplates'
    });
    db.OnboardingTemplate.belongsTo(db.Department, { 
        foreignKey: 'departmentId', 
        as: 'department' 
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync models
    await db.Department.sync();
    await db.OnboardingTemplate.sync();
    console.log('✅ Models synced');

    return { db, sequelize };
}

async function backfillOnboardingTemplates() {
    let db, sequelize;
    try {
        console.log('🚀 Starting onboarding templates backfill...');

        // Initialize database connection
        const connection = await initializeDatabase();
        db = connection.db;
        sequelize = connection.sequelize;

        // Get all departments
        const departments = await db.Department.findAll();
        console.log('\n🏢 Existing departments:');
        departments.forEach(dept => {
            console.log(`   - ID: ${dept.id}, Name: "${dept.name}"`);
        });

        if (departments.length === 0) {
            console.log('❌ No departments found. Please create departments first.');
            process.exit(1);
        }

        const templateCount = await db.OnboardingTemplate.count();
        console.log(`\n📊 Current onboarding templates count: ${templateCount}`);

        if (templateCount === 0) {
            console.log('🔄 Creating default onboarding templates...');

            const defaultTemplates = [];
            
            departments.forEach(dept => {
                let departmentTemplates = [];
                
                // Define templates based on department name
                const deptName = dept.name.toLowerCase();
                
                if (deptName.includes('it') || deptName.includes('information')) {
                    departmentTemplates = [
                        { departmentId: dept.id, taskName: 'Setup development workstation', order: 1 },
                        { departmentId: dept.id, taskName: 'Provide system access credentials', order: 2 },
                        { departmentId: dept.id, taskName: 'Configure development environment', order: 3 },
                        { departmentId: dept.id, taskName: 'Assign to development team', order: 4 }
                    ];
                } else if (deptName.includes('engineering')) {
                    departmentTemplates = [
                        { departmentId: dept.id, taskName: 'Setup engineering tools', order: 1 },
                        { departmentId: dept.id, taskName: 'Provide project documentation', order: 2 },
                        { departmentId: dept.id, taskName: 'Schedule technical training', order: 3 }
                    ];
                } else if (deptName.includes('finance')) {
                    departmentTemplates = [
                        { departmentId: dept.id, taskName: 'Setup financial software', order: 1 },
                        { departmentId: dept.id, taskName: 'Provide accounting system access', order: 2 },
                        { departmentId: dept.id, taskName: 'Schedule finance policy training', order: 3 }
                    ];
                } else if (deptName.includes('hr') || deptName.includes('human')) {
                    departmentTemplates = [
                        { departmentId: dept.id, taskName: 'Setup HR system access', order: 1 },
                        { departmentId: dept.id, taskName: 'Provide employee handbook', order: 2 },
                        { departmentId: dept.id, taskName: 'Schedule HR compliance training', order: 3 }
                    ];
                } else {
                    // Default templates for any other departments
                    departmentTemplates = [
                        { departmentId: dept.id, taskName: 'Setup workstation', order: 1 },
                        { departmentId: dept.id, taskName: 'Provide access credentials', order: 2 },
                        { departmentId: dept.id, taskName: 'Schedule orientation', order: 3 }
                    ];
                }
                
                defaultTemplates.push(...departmentTemplates);
            });

            console.log(`\n📝 Creating ${defaultTemplates.length} templates...`);

            // Create templates
            for (const template of defaultTemplates) {
                await db.OnboardingTemplate.create(template);
                console.log(`   ✅ ${template.taskName}`);
            }

            console.log(`\n✅ Successfully created ${defaultTemplates.length} onboarding templates`);

        } else {
            console.log(`✅ Onboarding templates already exist (${templateCount} templates). No action needed.`);
        }

        console.log('\n🎉 Onboarding templates backfill completed!');
        
        // Close database connection
        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during onboarding templates backfill:', error);
        if (sequelize) await sequelize.close();
        process.exit(1);
    }
}

// Run the backfill
backfillOnboardingTemplates();