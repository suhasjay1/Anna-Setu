exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is attached by the authMiddleware that runs before this
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Forbidden: You do not have the necessary permissions to access this resource.' 
            });
        }
        next(); // User has the correct role, proceed to the controller
    };
};