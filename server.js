// server.js
require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
//app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

app.use(cors({ origin: 'https://websystemtest.vercel.app' }));

// api routes
//accounts routes
app.use('/accounts', require('./accounts/accounts.controller'));

//employees routes
app.use('/employees', require('./employees/employee.controller'));

//departments routes
app.use('/departments', require('./departments/department.controller'));

//requests routes   
app.use('/requests', require('./requests/request.controller'));

//workflows routes
app.use('/workflows', require('./workflows/workflow.controller'));

//onboarding routes
app.use('/onboarding', require('./onboarding/onboarding.controller'));


// swagger docs route
app.use('/api-docs', require('_helpers/swagger'));

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: 'Invalid or missing token' });
    }
    next(err);
});

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));