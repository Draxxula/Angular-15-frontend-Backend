// middleware to authorize access based on user roles

const { expressjwt } = require('express-jwt'); // Destructure the expressjwt function
const config = require('config.json');
const db = require('_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User')
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // authenticate JWT token and attach user to request object (req.user)
         expressjwt({ secret: config.secret, algorithms: ['HS256'], requestProperty: 'user' }),
        
        // authorize based on user role
        async (req, res, next) => {
            // Safely check if req.user exists before accessing its properties
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized: No user in request' });
            }

            try {
                const account = await db.Account.findByPk(req.user.id);

                if (!account || (roles.length && !roles.includes(account.role))) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                // Attach additional details to req.user
                req.user.role = account.role;
                const refreshTokens = await account.getRefreshTokens();
                req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);

                next();
            } catch (err) {
                console.error('Authorization middleware error:', err);
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    ];
}
