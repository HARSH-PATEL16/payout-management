const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
        }
        next();
    };
}

module.exports = { authenticate, requireRole };
