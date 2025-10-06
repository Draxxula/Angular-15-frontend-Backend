// _helpers/db.js
const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

module.exports = db = {};

initialize();

async function initialize() {

    let caCert;
    try {
        if (process.env.MYSQL_SSL_CA) {
    // Decode Base64 back to PEM text
    caCert = Buffer.from(process.env.MYSQL_SSL_CA, 'base64').toString('utf-8');
} else {
    // Fallback to local file (dev only)
    const caCertPath = path.join(__dirname, '../certs/ca.pem');
    if (fs.existsSync(caCertPath)) {
        caCert = fs.readFileSync(caCertPath, 'utf-8');
    }
}
    } catch (err) {
        console.warn('⚠️ No CA certificate found, SSL may fail if required.');
    }

    const { host, port, user, password, database } = config.database;

    // --- 1. mysql2 Connection (create DB if missing) ---
    const connectionOptions = {
        host,
        port,
        user,
        password,
        ssl: caCert ? { ca: caCert, rejectUnauthorized: true } : undefined
    };

    try {
        const connection = await mysql.createConnection(connectionOptions);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        await connection.end();
        console.log(`✅ Database "${database}" ensured.`);
    } catch (error) {
        console.error('❌ Database connection failed during initial setup (mysql2):', error.message);
        throw error;
    }

    // connect to db
    const sequelize = new Sequelize(database, user, password, { 
        host,
        port,
        dialect: 'mysql',
        logging: false, // disable logging; default: console.log
        dialectOptions: caCert 
            ? { ssl: { ca: caCert, rejectUnauthorized: true } } 
            : {},
        logging: console.log   // 🔹 shows SQL queries (so you’ll see CREATE TABLE …)
    }); 

    
    // init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Department = require('../departments/department.model')(sequelize);
    db.Employee = require('../employees/employee.model')(sequelize);
    db.Request = require('../requests/request.model')(sequelize);
    db.Workflow = require('../workflows/workflow.model')(sequelize);
    db.OnboardingTemplate = require('../onboarding/onboarding.model')(sequelize);

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    // account and employee one-to-one relationship
    db.Account.hasOne(db.Employee, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.Employee.belongsTo(db.Account, { foreignKey: 'accountId' });

    // department and employee one-to-many relationship
    db.Department.hasMany(db.Employee, { as: 'employees', foreignKey: 'departmentId', onDelete: 'CASCADE' });
    db.Employee.belongsTo(db.Department, { as: 'department', foreignKey: 'departmentId' });

    // request and employee many-to-one relationship
    db.Employee.hasMany(db.Request, { foreignKey: 'employeeId', onDelete: 'CASCADE', as: 'requests'});
    db.Request.belongsTo(db.Employee, { foreignKey: 'employeeId' });

    // workflow and employee many-to-one relationship
    db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId', targetKey: 'employeeId', // This is critical!
    as: 'employee' });
    db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId', sourceKey: 'employeeId', // This is critical!
    as: 'workflows' });

    // workflow and request many-to-one relationship
    db.Workflow.belongsTo(db.Request, { foreignKey: 'requestId', as: 'request' });
    db.Request.hasMany(db.Workflow, { foreignKey: 'requestId', as: 'workflows' });

    db.Department.hasMany(db.OnboardingTemplate, { foreignKey: 'departmentId', as: 'onboardingTemplates' });
    db.OnboardingTemplate.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });


    // sync departments first
    await db.Department.sync();
    // then employees
    await db.Employee.sync();
    // then accounts and refresh tokens
    await db.Account.sync();
    await db.RefreshToken.sync();
    // then requests
    await db.Request.sync();
    // then workflows
    await db.Workflow.sync();
    // then onboarding templates
    await db.OnboardingTemplate.sync();
    // sync all models with database
    await sequelize.sync({ alter: true });
    //await sequelize.sync();

}