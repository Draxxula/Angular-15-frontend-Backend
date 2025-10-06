// _helpers/swagger.js
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Ensure the path to the YAML file is correct
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
