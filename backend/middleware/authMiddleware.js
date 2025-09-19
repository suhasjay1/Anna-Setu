const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get token from the request header
    const token = req.header('Authorization')?.split(' ')[1]; // Expects "Bearer [token]"

    // 2. Check if no token is present
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    // 3. Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Add the user's info from the token to the request object
        req.user = decoded;
        
        next(); // Proceed to the next function (the controller)
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};