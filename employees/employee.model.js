// employees/employee.model.js
const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    employeeId: { type: DataTypes.STRING, primaryKey: true }, // e.g., EMP001
    position: { type: DataTypes.STRING, allowNull: false },
    departmentId: { type: DataTypes.INTEGER, allowNull: false }, // FK to Department
    accountId: { type: DataTypes.INTEGER, allowNull: false },    // FK to Account
    hireDate: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('Active', 'Inactive'), allowNull: false, defaultValue: 'Active' },
  };

  const options = {
    timestamps: false,
    defaultScope: {
      attributes: { exclude: [] }
    },
    scopes: {}
  };

  return sequelize.define('employee', attributes, options);
}