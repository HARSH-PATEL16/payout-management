const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
});

module.exports = router;
