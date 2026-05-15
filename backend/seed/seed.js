const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Payout = require("../models/Payout");
const PayoutAudit = require("../models/PayoutAudit");

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
        User.deleteMany({}),
        Vendor.deleteMany({}),
        Payout.deleteMany({}),
        PayoutAudit.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Seed users
    const ops = await User.create({ email: "ops@demo.com", password: "ops123", role: "OPS", name: "Ops User" });
    const finance = await User.create({ email: "finance@demo.com", password: "fin123", role: "FINANCE", name: "Finance User" });
    console.log("Seeded users: ops@demo.com / ops123, finance@demo.com / fin123");

    // Seed vendors
    const vendors = await Vendor.insertMany([
        { name: "Acme Supplies", upi_id: "acme@upi", bank_account: "112233445566", ifsc: "HDFC0001234" },
        { name: "GlobalTech India", upi_id: "globaltech@paytm", bank_account: "998877665544", ifsc: "ICIC0009876" },
        { name: "FastDelivery Co.", upi_id: null, bank_account: "554433221100", ifsc: "SBIN0005678" },
        { name: "Archived Vendor", is_active: false, upi_id: "old@upi" },
    ]);
    console.log(`Seeded ${vendors.length} vendors`);

    // Seed payouts in different states
    const draft = await Payout.create({
        vendor_id: vendors[0]._id, amount: 15000, mode: "NEFT",
        note: "Q2 supply payment", status: "Draft", created_by: ops._id,
    });
    await PayoutAudit.create({ payout_id: draft._id, action: "CREATED", performed_by: ops._id });

    const submitted = await Payout.create({
        vendor_id: vendors[1]._id, amount: 7500, mode: "UPI",
        note: "Tech support retainer", status: "Submitted", created_by: ops._id,
    });
    await PayoutAudit.create({ payout_id: submitted._id, action: "CREATED", performed_by: ops._id });
    await PayoutAudit.create({ payout_id: submitted._id, action: "SUBMITTED", performed_by: ops._id });

    const approved = await Payout.create({
        vendor_id: vendors[2]._id, amount: 3200, mode: "IMPS",
        note: "Delivery charges June", status: "Approved", created_by: ops._id,
    });
    await PayoutAudit.create({ payout_id: approved._id, action: "CREATED", performed_by: ops._id });
    await PayoutAudit.create({ payout_id: approved._id, action: "SUBMITTED", performed_by: ops._id });
    await PayoutAudit.create({ payout_id: approved._id, action: "APPROVED", performed_by: finance._id });

    const rejected = await Payout.create({
        vendor_id: vendors[0]._id, amount: 50000, mode: "NEFT",
        note: "Advance payment request", status: "Rejected",
        decision_reason: "Amount exceeds monthly limit. Please split into smaller payouts.",
        created_by: ops._id,
    });
    await PayoutAudit.create({ payout_id: rejected._id, action: "CREATED", performed_by: ops._id });
    await PayoutAudit.create({ payout_id: rejected._id, action: "SUBMITTED", performed_by: ops._id });
    await PayoutAudit.create({
        payout_id: rejected._id, action: "REJECTED", performed_by: finance._id,
        note: "Amount exceeds monthly limit. Please split into smaller payouts.",
    });

    console.log("Seeded 4 payouts (Draft, Submitted, Approved, Rejected)");
    console.log("\nSeed complete!");
    await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
