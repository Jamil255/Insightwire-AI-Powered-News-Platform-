const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id; // Attach user ID to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

module.exports = authMiddleware;
