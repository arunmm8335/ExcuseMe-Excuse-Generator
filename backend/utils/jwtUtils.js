const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - The generated JWT token
 */
const generateToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = { user: { id: userId } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) reject(err);
                else resolve(token);
            }
        );
    });
};

/**
 * Extract user ID from JWT token in request headers
 * @param {string} token - The JWT token
 * @returns {string|null} - The user ID or null if invalid
 */
const extractUserIdFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user?.id || decoded.id || null;
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    extractUserIdFromToken
};
