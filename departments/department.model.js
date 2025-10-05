const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false},
    description: { type: DataTypes.STRING }
  };

  const options = {
    timestamps: false,
    defaultScope: {
      attributes: { exclude: [] }
    },
    scopes: {}
  };

  return sequelize.define('department', attributes, options);
}