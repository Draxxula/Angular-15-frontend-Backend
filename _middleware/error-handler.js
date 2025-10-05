const { expressjwt } = require('express-jwt'); // Destructure the expressjwt function
const config = require('config.json');
const db = require('_helpers/db');


// global error handler
module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    console.error('Global Error Handler:', err);

    // Custom application error (string)
    if (typeof err === 'string') {
        return res.status(400).json({ message: err });
    }

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: err.message });
    }

    // express-jwt authentication error
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: 'Invalid Token' });
    }

    // Default to 500 server error
    return res.status(500).json({ message: err.message });
}


// // middleware to authorize access based on user roles
// module.exports = authorize;

// function authorize(roles = []) {
//     // roles param can be a single role string (e.g. Role.User or 'User')
//     // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
//     if (typeof roles === 'string') {
//         roles = [roles];
//     }

//     return [
//         // authenticate JWT token and attach user to request object (req.user)
//         expressjwt({ secret: config.secret, algorithms: ['HS256'] }), // Use the destructured function

//         // authorize based on user role
//         async (req, res, next) => {
//             const account = await db.Account.findByPk(req.user.id);

//             if (!account || (roles.length && !roles.includes(account.role))) {
//                 // account no longer exists or role not authorized
//                 return res.status(401).json({ message: 'Unauthorized' });
//             }

//             // authentication and authorization successful
//             req.user.role = account.role;
//             const refreshTokens = await account.getRefreshTokens();
//             req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);

//             next();
//         }
//     ];
// }