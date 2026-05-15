require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const vendorRoutes = require("./routes/vendor");
const payoutRoutes = require("./routes/payouts");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/vendors", vendorRoutes);
app.use("/payouts", payoutRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(process.env.PORT || 4000, () => {
            console.log(`Server running on port ${process.env.PORT || 4000}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    });
