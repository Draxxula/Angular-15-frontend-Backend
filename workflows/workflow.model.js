// workflows/workflow.model.js
const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { 
      type: DataTypes.ENUM('Onboarding', 'Request Approval', 'Department Transfer', 'Custom'),
      allowNull: false 
    },
    details: { type: DataTypes.TEXT, allowNull: false },
    status: { 
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    employeeId: { type: DataTypes.STRING, allowNull: false }, // FK to employee
    requestId: { type: DataTypes.INTEGER, allowNull: true }, // FK to request (optional)
    created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated: { type: DataTypes.DATE }
  };

  const options = {
    timestamps: false,
    defaultScope: {
      attributes: { exclude: [] }
    },
    scopes: {}
  };

  return sequelize.define('workflow', attributes, options);
}
