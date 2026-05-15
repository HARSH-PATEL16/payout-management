const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        upi_id: { type: String, default: null },
        bank_account: { type: String, default: null },
        ifsc: { type: String, default: null },
        is_active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
