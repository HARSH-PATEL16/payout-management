const router = require("express").Router();
const Vendor = require("../models/Vendor");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", async (req, res) => {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
});

router.post("/", async (req, res) => {
    const { name, upi_id, bank_account, ifsc, is_active } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Vendor name is required" });
    }

    const vendor = await Vendor.create({
        name: name.trim(),
        upi_id: upi_id || null,
        bank_account: bank_account || null,
        ifsc: ifsc || null,
        is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json(vendor);
});

module.exports = router;
