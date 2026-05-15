const router = require("express").Router();
const Payout = require("../models/Payout");
const PayoutAudit = require("../models/PayoutAudit");
const Vendor = require("../models/Vendor");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);

async function addAudit(payout_id, action, performed_by, note = null) {
    await PayoutAudit.create({ payout_id, action, performed_by, note });
}

// GET /payouts — list with filters
router.get("/", async (req, res) => {
    const { status, vendor_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vendor_id) filter.vendor_id = vendor_id;

    const payouts = await Payout.find(filter)
        .populate("vendor_id", "name upi_id bank_account")
        .populate("created_by", "name email role")
        .sort({ createdAt: -1 });

    res.json(payouts);
});

// POST /payouts — OPS creates a draft payout
router.post("/", requireRole("OPS"), async (req, res) => {
    const { vendor_id, amount, mode, note } = req.body;

    if (!vendor_id) return res.status(400).json({ error: "vendor_id is required" });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "amount must be greater than 0" });
    if (!mode || !["UPI", "IMPS", "NEFT"].includes(mode)) {
        return res.status(400).json({ error: "mode must be UPI, IMPS, or NEFT" });
    }

    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    if (!vendor.is_active) return res.status(400).json({ error: "Vendor is inactive" });

    const payout = await Payout.create({
        vendor_id,
        amount: Number(amount),
        mode,
        note: note || null,
        status: "Draft",
        created_by: req.user.id,
    });

    await addAudit(payout._id, "CREATED", req.user.id);

    const populated = await payout.populate([
        { path: "vendor_id", select: "name upi_id bank_account" },
        { path: "created_by", select: "name email role" },
    ]);

    res.status(201).json(populated);
});

// GET /payouts/:id — detail + audit trail
router.get("/:id", async (req, res) => {
    const payout = await Payout.findById(req.params.id)
        .populate("vendor_id", "name upi_id bank_account ifsc")
        .populate("created_by", "name email role");

    if (!payout) return res.status(404).json({ error: "Payout not found" });

    const audits = await PayoutAudit.find({ payout_id: payout._id })
        .populate("performed_by", "name email role")
        .sort({ createdAt: 1 });

    res.json({ payout, audits });
});

// POST /payouts/:id/submit — OPS submits a draft
router.post("/:id/submit", requireRole("OPS"), async (req, res) => {
    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ error: "Payout not found" });
    if (payout.status !== "Draft") {
        return res.status(400).json({ error: `Cannot submit a payout with status '${payout.status}'. Only Draft payouts can be submitted.` });
    }

    payout.status = "Submitted";
    await payout.save();
    await addAudit(payout._id, "SUBMITTED", req.user.id);

    res.json({ message: "Payout submitted for review", payout });
});

// POST /payouts/:id/approve — FINANCE approves
router.post("/:id/approve", requireRole("FINANCE"), async (req, res) => {
    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ error: "Payout not found" });
    if (payout.status !== "Submitted") {
        return res.status(400).json({ error: `Cannot approve a payout with status '${payout.status}'. Only Submitted payouts can be approved.` });
    }

    payout.status = "Approved";
    await payout.save();
    await addAudit(payout._id, "APPROVED", req.user.id);

    res.json({ message: "Payout approved", payout });
});

// POST /payouts/:id/reject — FINANCE rejects with mandatory reason
router.post("/:id/reject", requireRole("FINANCE"), async (req, res) => {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
        return res.status(400).json({ error: "Rejection reason is required" });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ error: "Payout not found" });
    if (payout.status !== "Submitted") {
        return res.status(400).json({ error: `Cannot reject a payout with status '${payout.status}'. Only Submitted payouts can be rejected.` });
    }

    payout.status = "Rejected";
    payout.decision_reason = reason.trim();
    await payout.save();
    await addAudit(payout._id, "REJECTED", req.user.id, reason.trim());

    res.json({ message: "Payout rejected", payout });
});

module.exports = router;
